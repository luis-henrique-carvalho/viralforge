"""Background asynchronous worker and queue concurrency orchestrator for DiscoverySearches.

Manages:
- Bounded concurrency via ``asyncio.Semaphore``
- In-memory execution queue (``asyncio.Queue``)
- Active tasks registry for in-flight cancellation (``asyncio.Task.cancel()``)
- Durability and status transitions in ``DiscoveryStore``
- Crash recovery on startup (normalizing orphan QUEUED/SEARCHING states)
"""
from __future__ import annotations

import asyncio
import logging
import os
import threading
import time
from datetime import datetime, timezone
from typing import Dict, Optional, Union

from clippyme.domain.discovery.schemas import (
    DiscoveryFilter,
    DiscoverySearch,
    DiscoverySearchStatus,
    DiscoverySearchSummary,
    PlatformType,
)
from clippyme.domain.discovery import store
from clippyme.domain.discovery.service import get_discovery_service

logger = logging.getLogger("clippyme.discovery_worker")

MAX_CONCURRENT_DISCOVERY = int(os.environ.get("MAX_CONCURRENT_DISCOVERY", "2"))


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class DiscoveryWorker:
    """Asynchronous worker responsible for executing discovery searches without blocking HTTP."""

    def __init__(self, max_concurrent: int = MAX_CONCURRENT_DISCOVERY):
        self.max_concurrent = max_concurrent
        self._queue: asyncio.Queue[str] = asyncio.Queue()
        self._semaphore: asyncio.Semaphore = asyncio.Semaphore(max_concurrent)
        self._platform_locks: Dict[Union[str, PlatformType], asyncio.Lock] = {
            PlatformType.TIKTOK: asyncio.Lock(),
            PlatformType.INSTAGRAM: asyncio.Lock(),
            PlatformType.YOUTUBE: asyncio.Lock(),
        }
        self._active_tasks: Dict[str, asyncio.Task] = {}
        self._running: bool = False

    def _get_platform_lock(self, platform: Union[str, PlatformType]) -> asyncio.Lock:
        """Get or initialize the lock for a specific social platform."""
        if platform not in self._platform_locks:
            self._platform_locks[platform] = asyncio.Lock()
        return self._platform_locks[platform]

    async def create_and_enqueue(self, filter_params: DiscoveryFilter) -> DiscoverySearchSummary:
        """Instantiate a new DiscoverySearch aggregate from filter params, enqueue it, and return its summary."""
        import uuid

        search_id = str(uuid.uuid4())
        search = DiscoverySearch(
            id=search_id,
            platform=filter_params.platform,
            query=filter_params.query,
            filter_params=filter_params,
            status=DiscoverySearchStatus.QUEUED,
            total_found=0,
            items=[],
            created_at=_utcnow_iso(),
        )
        saved = await self.enqueue_search(search)
        return saved.to_summary()

    async def recover_on_startup(self) -> None:
        """Scan stored searches and mark orphan QUEUED/SEARCHING searches as FAILED."""
        summaries = store.list_searches(limit=500)
        orphan_count = 0
        now = _utcnow_iso()
        for summary in summaries:
            if summary.status in (DiscoverySearchStatus.QUEUED, DiscoverySearchStatus.SEARCHING):
                full_search = store.get_search(summary.id)
                if full_search:
                    full_search.status = DiscoverySearchStatus.FAILED
                    full_search.completed_at = now
                    full_search.error_message = "Busca interrompida por reinício do servidor"
                    store.save_search(full_search)
                    orphan_count += 1
        if orphan_count > 0:
            logger.info("Recovered %d orphaned discovery searches on startup", orphan_count)

    async def enqueue_search(self, search: Union[DiscoverySearch, dict]) -> DiscoverySearch:
        """Persist new search in QUEUED state and enqueue for background execution."""
        if isinstance(search, dict):
            search_obj = DiscoverySearch.model_validate(search)
        else:
            search_obj = search

        search_obj.status = DiscoverySearchStatus.QUEUED
        saved = store.save_search(search_obj)
        await self._queue.put(saved.id)
        logger.info("Enqueued discovery search %s for query '%s'", saved.id, saved.query)
        return saved

    async def cancel_search(self, search_id: str) -> Optional[DiscoverySearch]:
        """Cancel an active or queued search immediately, freeing concurrency and updating store."""
        search = store.get_search(search_id)
        if not search:
            return None

        # If search is currently active in-flight, cancel its asyncio.Task
        task = self._active_tasks.get(search_id)
        if task and not task.done():
            logger.info("Cancelling active in-flight discovery task %s", search_id)
            task.cancel()

        # Update persistent state to CANCELLED if not already terminal
        if search.status not in (DiscoverySearchStatus.COMPLETED, DiscoverySearchStatus.FAILED):
            search.status = DiscoverySearchStatus.CANCELLED
            search.completed_at = _utcnow_iso()
            store.save_search(search)
            logger.info("Discovery search %s marked as CANCELLED", search_id)

        return search

    async def _process_search(self, search_id: str) -> None:
        """Internal worker task that acquires semaphore, calls discovery service, and persists results."""
        try:
            search = store.get_search(search_id)
            if not search or search.status == DiscoverySearchStatus.CANCELLED:
                logger.info("Skipping dispatch for cancelled/missing discovery search %s", search_id)
                return

            async with self._semaphore:
                # Re-check status after awaiting semaphore
                search = store.get_search(search_id)
                if not search or search.status == DiscoverySearchStatus.CANCELLED:
                    logger.info("Discovery search %s was cancelled while waiting for semaphore", search_id)
                    return

                platform_lock = self._get_platform_lock(search.platform)
                async with platform_lock:
                    # Re-check status after awaiting platform lock
                    search = store.get_search(search_id)
                    if not search or search.status == DiscoverySearchStatus.CANCELLED:
                        logger.info("Discovery search %s was cancelled while waiting for platform lock", search_id)
                        return

                    search.status = DiscoverySearchStatus.SEARCHING
                    search.started_at = _utcnow_iso()
                    store.save_search(search)
                    logger.info("Starting discovery mining for search %s (query: '%s', platform: '%s')", search_id, search.query, search.platform)

                    start_time = time.monotonic()
                    try:
                        service = get_discovery_service()
                        result = await service.search(search.filter_params)
                        items = store.mark_imported_status(result.items)
                        duration = round(time.monotonic() - start_time, 3)

                        search.items = items
                        search.total_found = len(items)
                        search.status = DiscoverySearchStatus.COMPLETED
                        search.completed_at = _utcnow_iso()
                        search.duration_seconds = duration
                        store.save_search(search)
                        logger.info(
                            "Discovery search %s COMPLETED in %.2fs with %d items",
                            search_id,
                            duration,
                            len(items),
                        )
                    except asyncio.CancelledError:
                        logger.info("Discovery search task %s received CancelledError", search_id)
                        search.status = DiscoverySearchStatus.CANCELLED
                        search.completed_at = _utcnow_iso()
                        search.duration_seconds = round(time.monotonic() - start_time, 3)
                        store.save_search(search)
                        raise
                    except Exception as exc:
                        logger.exception("Discovery search %s failed: %s", search_id, exc)
                        search.status = DiscoverySearchStatus.FAILED
                        search.error_message = str(exc)
                        search.completed_at = _utcnow_iso()
                        search.duration_seconds = round(time.monotonic() - start_time, 3)
                        store.save_search(search)
        finally:
            self._active_tasks.pop(search_id, None)
            self._queue.task_done()

    async def run(self) -> None:
        """Main consumer loop that processes searches from the queue."""
        self._running = True
        logger.info("DiscoveryWorker started with concurrency limit %d", self.max_concurrent)
        while self._running:
            try:
                search_id = await self._queue.get()
            except asyncio.CancelledError:
                break

            if not self._running or not search_id:
                if search_id:
                    self._queue.task_done()
                break

            task = asyncio.create_task(self._process_search(search_id))
            self._active_tasks[search_id] = task

    async def stop(self) -> None:
        """Gracefully stop the worker, cancelling in-flight tasks and waiting for them to finish."""
        self._running = False
        logger.info("Stopping DiscoveryWorker (%d active tasks)...", len(self._active_tasks))
        for task in list(self._active_tasks.values()):
            if not task.done():
                task.cancel()

        if self._active_tasks:
            await asyncio.gather(*list(self._active_tasks.values()), return_exceptions=True)
        self._active_tasks.clear()
        # Wake up queue listener if stuck on get()
        try:
            self._queue.put_nowait("")
        except Exception:
            pass
        logger.info("DiscoveryWorker stopped.")


_WORKER_INSTANCE: Optional[DiscoveryWorker] = None
_WORKER_LOCK = threading.Lock()


def get_discovery_worker() -> DiscoveryWorker:
    """Retrieve the singleton DiscoveryWorker instance."""
    global _WORKER_INSTANCE
    if _WORKER_INSTANCE is None:
        with _WORKER_LOCK:
            if _WORKER_INSTANCE is None:
                _WORKER_INSTANCE = DiscoveryWorker()
    return _WORKER_INSTANCE


def reset_discovery_worker() -> None:
    """Reset the singleton DiscoveryWorker instance (primarily for testing)."""
    global _WORKER_INSTANCE
    with _WORKER_LOCK:
        _WORKER_INSTANCE = None
