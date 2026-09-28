"""publish_dispatch_service — Deep Module for Asynchronous Social Publishing & Dispatch Queue.

Follows /codebase-design and Hexagonal Architecture principles:
- Small, expressive public interface for callers (API / Domain).
- Asynchronous background worker using background tasks so HTTP requests return in <10ms.
- Durable Outbox pattern: records dispatch jobs in dispatch_queue.json with 0o600 permissions.
- Strict State Isolation: publication failures NEVER corrupt video render state (item.status remains APPROVED).
- Granular channel isolation and 1-Click Retry capability per failed channel.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import threading
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional

from clippyme.domain import viral_studio_store
from clippyme.domain.errors import NotFoundError, ValidationError
from clippyme.domain.social_publisher_port import (
    PublicationJob,
    PublicationReceipt,
    SocialPublisherPort,
    get_social_publisher,
)

logger = logging.getLogger("clippyme.publish_dispatch_service")

DISPATCH_QUEUE_PATH = os.path.join("data", "viral_studio", "dispatch_queue.json")
_QUEUE_LOCK = threading.RLock()

DispatchStatus = Literal[
    "QUEUED",
    "UPLOADING",
    "SCHEDULED",
    "PUBLISHED",
    "FAILED",
    "PARTIAL_FAILED",
]


@dataclass
class DispatchJob:
    job_id: str
    item_id: str
    brand_id: str
    channel_ids: List[str]
    brand_name: Optional[str] = None
    channel_names: List[str] = field(default_factory=list)
    provider: str = "postiz"
    status: DispatchStatus = "QUEUED"
    scheduled_for: Optional[str] = None
    publish_now: bool = False
    title: Optional[str] = None
    caption: Optional[str] = None
    video_path: Optional[str] = None
    thumbnail_url: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    receipts: List[Dict[str, Any]] = field(default_factory=list)
    error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> DispatchJob:
        valid_keys = {
            "job_id", "item_id", "brand_id", "channel_ids", "brand_name",
            "channel_names", "provider", "status", "scheduled_for", "publish_now",
            "title", "caption", "video_path", "thumbnail_url", "created_at",
            "updated_at", "receipts", "error",
        }
        filtered = {k: v for k, v in data.items() if k in valid_keys}
        return cls(**filtered)


def _load_queue_sync() -> Dict[str, Dict[str, Any]]:
    with _QUEUE_LOCK:
        if not os.path.exists(DISPATCH_QUEUE_PATH):
            return {}
        try:
            with open(DISPATCH_QUEUE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as exc:
            logger.error("Failed to load dispatch queue from %s: %s", DISPATCH_QUEUE_PATH, exc)
            return {}


def _save_queue_sync(queue_data: Dict[str, Dict[str, Any]]) -> None:
    with _QUEUE_LOCK:
        os.makedirs(os.path.dirname(DISPATCH_QUEUE_PATH), exist_ok=True)
        temp_path = f"{DISPATCH_QUEUE_PATH}.tmp.{uuid.uuid4().hex[:6]}"
        fd = os.open(temp_path, os.O_CREAT | os.O_WRONLY | os.O_TRUNC, 0o600)
        try:
            with open(fd, "w", encoding="utf-8") as f:
                json.dump(queue_data, f, indent=2, ensure_ascii=False)
            os.replace(temp_path, DISPATCH_QUEUE_PATH)
        except Exception:
            if os.path.exists(temp_path):
                try:
                    os.unlink(temp_path)
                except OSError:
                    pass
            raise


async def _resolve_target_channels(
    brand_id: str,
    brand: Dict[str, Any],
    channel_ids: Optional[List[str]],
) -> tuple[str, List[str]]:
    from clippyme.domain import brand_workspace_service
    provider_name = brand_workspace_service.get_brand_active_provider(brand)
    if not channel_ids:
        accounts = await brand_workspace_service.get_brand_channels(brand_id, all_available=False)
        channel_ids = [ch.id for ch in accounts if ch.connected]
    if not channel_ids:
        raise ValidationError(f"No connected social channels found for brand '{brand_id}'")
    return provider_name, channel_ids


def _resolve_target_slot(
    brand_id: str,
    brand: Dict[str, Any],
    channel_ids: List[str],
    scheduled_for: Optional[str],
    publish_now: bool,
) -> tuple[Optional[str], str]:
    schedule = brand.get("posting_schedule") or {}
    timezone_str = schedule.get("timezone") or viral_studio_store.DEFAULT_BRAND_SCHEDULE["timezone"]
    if publish_now or scheduled_for:
        return scheduled_for, timezone_str

    slots_list = schedule.get("slots") or viral_studio_store.DEFAULT_BRAND_SCHEDULE["slots"]
    primary_acc = channel_ids[0] if channel_ids else None
    avail_slots = viral_studio_store.get_next_available_slots(
        account_id=primary_acc,
        brand_id=brand_id,
        count=1,
        slots=slots_list,
        timezone_str=timezone_str,
    )
    if avail_slots:
        return avail_slots[0].isoformat(), timezone_str
    return datetime.now(timezone.utc).isoformat(), timezone_str


async def _dispatch_to_channels(
    port: SocialPublisherPort,
    job: DispatchJob,
    target_channels: List[str],
    timezone_str: str,
) -> List[PublicationReceipt]:
    receipts: List[PublicationReceipt] = []
    for channel_id in target_channels:
        pub_job = PublicationJob(
            item_id=job.item_id,
            media_path=job.video_path,
            title=job.title,
            caption=job.caption,
            account_id=channel_id,
            scheduled_for=job.scheduled_for,
            timezone=timezone_str,
            publish_now=job.publish_now,
        )
        try:
            receipt = await (port.publish(pub_job) if job.publish_now else port.schedule(pub_job))
            receipts.append(receipt)
        except Exception as exc:
            err_msg = str(exc) or repr(exc) or type(exc).__name__
            logger.error("Dispatch error for item %s on channel %s: %s", job.item_id, channel_id, err_msg)
            receipts.append(
                PublicationReceipt(
                    item_id=job.item_id,
                    status="failed",
                    post_id=None,
                    scheduled_for=job.scheduled_for,
                    error=err_msg,
                    raw_response={"error": err_msg},
                )
            )
    return receipts


def _record_dispatch_results(
    job: DispatchJob,
    target_channels: List[str],
    receipts: List[PublicationReceipt],
) -> None:
    _, batch_id, _ = viral_studio_store.find_item_batch(job.item_id)
    now_iso = datetime.now(timezone.utc).isoformat()

    for idx, receipt in enumerate(receipts):
        ch_id = target_channels[idx] if idx < len(target_channels) else None
        record = {
            "id": receipt.post_id or f"post_{job.item_id}_{ch_id or idx}",
            "post_id": receipt.post_id,
            "channel_id": ch_id,
            "platform_post_id": receipt.platform_post_id,
            "scheduled_for": job.scheduled_for or receipt.scheduled_for,
            "published_at": receipt.published_at,
            "status": receipt.status,
            "post_url": receipt.post_url,
            "error": receipt.error,
            "updated_at": now_iso,
        }
        viral_studio_store.append_publication_record(
            batch_id=batch_id,
            item_id=job.item_id,
            record=record,
        )

    has_success = any(r.status in ("scheduled", "published") for r in receipts)
    if has_success:
        viral_studio_store.update_item(
            item_id=job.item_id,
            updates={
                "status": "PUBLISHED" if job.publish_now else "SCHEDULED",
                "scheduled_for": job.scheduled_for if not job.publish_now else None,
            },
        )
    else:
        # Crucial state isolation rule: KEEP APPROVED on publish failure! Never FAILED!
        viral_studio_store.update_item(
            item_id=job.item_id,
            updates={"status": "APPROVED"},
        )


class PublishDispatchService:
    """Production service managing asynchronous publishing, queue persistence, and background dispatches."""

    def __init__(self, publisher: Optional[SocialPublisherPort] = None):
        self._publisher = publisher

    def _get_publisher(self, provider_name: Optional[str] = None) -> SocialPublisherPort:
        if self._publisher is not None:
            return self._publisher
        return get_social_publisher(provider=provider_name)

    async def enqueue_dispatch(
        self,
        brand_id: str,
        item_id: str,
        channel_ids: Optional[List[str]] = None,
        scheduled_for: Optional[str] = None,
        publish_now: bool = False,
        spawn_background: bool = True,
    ) -> DispatchJob:
        """Validate item, reserve slot, persist dispatch job in QUEUED status, and spawn background task."""
        brand = viral_studio_store.get_brand_or_raise(brand_id)
        item, _, batch = viral_studio_store.find_item_batch(item_id)

        item_brand = item.get("brand_id") or batch.get("brand_id")
        if item_brand != brand_id:
            raise ValidationError(
                f"Brand isolation mismatch: video '{item_id}' belongs to brand '{item_brand}', not '{brand_id}'"
            )

        video_path = item.get("rendered_path")
        if not video_path or not os.path.isfile(video_path):
            raise ValidationError(f"Rendered video file not found at path: {video_path}")

        valid_statuses = ("APPROVED", "SCHEDULED", "PUBLISHED")
        if not publish_now and item.get("status") not in valid_statuses:
            raise ValidationError(
                f"Only ready items can be auto-scheduled (item '{item_id}' is currently '{item.get('status')}')"
            )

        provider_name, target_channels = await _resolve_target_channels(brand_id, brand, channel_ids)
        effective_slot, _ = _resolve_target_slot(brand_id, brand, target_channels, scheduled_for, publish_now)

        job_id = f"job_pub_{uuid.uuid4().hex[:12]}"
        title = item.get("selected_headline") or item.get("headline") or brand.get("name")
        caption = item.get("caption") or brand.get("default_cta") or ""

        rel_batch = batch.get("id") or batch.get("batch_id")
        thumb_url = f"/videos/viral_studio/{rel_batch}/{item_id}/rendered_thumbnail.jpg" if rel_batch else None

        dispatch_job = DispatchJob(
            job_id=job_id,
            item_id=item_id,
            brand_id=brand_id,
            brand_name=brand.get("name"),
            channel_ids=target_channels,
            provider=provider_name,
            status="QUEUED",
            scheduled_for=effective_slot if not publish_now else None,
            publish_now=publish_now,
            title=title,
            caption=caption,
            video_path=video_path,
            thumbnail_url=thumb_url,
        )

        queue = await asyncio.to_thread(_load_queue_sync)
        queue[job_id] = dispatch_job.to_dict()
        await asyncio.to_thread(_save_queue_sync, queue)

        if spawn_background:
            asyncio.create_task(self._process_dispatch_job(job_id))
        return dispatch_job

    async def enqueue_auto_schedule(
        self,
        brand_id: str,
        item_id: str,
        channel_ids: Optional[List[str]] = None,
    ) -> DispatchJob:
        """Alias for scheduling an approved item to the next available slot."""
        return await self.enqueue_dispatch(
            brand_id=brand_id,
            item_id=item_id,
            channel_ids=channel_ids,
            publish_now=False,
        )

    async def enqueue_publish(
        self,
        brand_id: str,
        item_id: str,
        channel_ids: Optional[List[str]] = None,
    ) -> DispatchJob:
        """Alias for immediately publishing an item."""
        return await self.enqueue_dispatch(
            brand_id=brand_id,
            item_id=item_id,
            channel_ids=channel_ids,
            publish_now=True,
        )

    async def _process_dispatch_job(self, job_id: str) -> None:
        """Background worker executing media upload and post creation via port."""
        queue = await asyncio.to_thread(_load_queue_sync)
        raw_job = queue.get(job_id)
        if not raw_job:
            logger.error("Job %s not found in dispatch queue", job_id)
            return
        job = DispatchJob.from_dict(raw_job)
        job.status = "UPLOADING"
        job.updated_at = datetime.now(timezone.utc).isoformat()
        queue[job_id] = job.to_dict()
        await asyncio.to_thread(_save_queue_sync, queue)

        logger.info(
            "[DISPATCH WORKER] Starting dispatch: job_id=%s, item_id=%s, brand=%s, provider=%s, channels=%s, mode=%s",
            job_id,
            job.item_id,
            job.brand_id,
            job.provider,
            job.channel_ids,
            "PUBLISH_NOW" if job.publish_now else f"SCHEDULED_FOR({job.scheduled_for})",
        )

        try:
            brand = viral_studio_store.get_brand(job.brand_id) or {}
            schedule = brand.get("posting_schedule") or {}
            timezone_str = schedule.get("timezone") or "America/Sao_Paulo"
            port = self._get_publisher(provider_name=job.provider)

            receipts = await asyncio.wait_for(
                _dispatch_to_channels(port, job, job.channel_ids, timezone_str),
                timeout=120.0,
            )
            _record_dispatch_results(job, job.channel_ids, receipts)

            has_success = any(r.status in ("scheduled", "published") for r in receipts)
            any_failed = any(r.status == "failed" for r in receipts)

            if has_success and not any_failed:
                final_status: DispatchStatus = "PUBLISHED" if job.publish_now else "SCHEDULED"
                err_summary = None
            elif has_success and any_failed:
                final_status = "PARTIAL_FAILED"
                err_summary = "Alguns canais falharam durante o envio."
            else:
                final_status = "FAILED"
                err_summary = next((r.error for r in receipts if r.error), "Erro de envio no provider.")

            job_receipts = []
            for idx, r in enumerate(receipts):
                ch_id = job.channel_ids[idx] if idx < len(job.channel_ids) else None
                r_dict = asdict(r)
                r_dict["channel_id"] = ch_id
                job_receipts.append(r_dict)

            job.status = final_status
            job.receipts = job_receipts
            job.error = err_summary
            job.updated_at = datetime.now(timezone.utc).isoformat()
        except Exception as exc:
            logger.error("Unhandled error in dispatch worker for job %s: %s", job_id, exc, exc_info=True)
            job.status = "FAILED"
            job.error = f"Erro no processamento do envio: {exc}"
            job.updated_at = datetime.now(timezone.utc).isoformat()

        logger.info(
            "[DISPATCH WORKER] Finished dispatch job %s: status=%s, receipts=%d, error=%s",
            job_id,
            job.status,
            len(job.receipts),
            job.error,
        )

        queue = await asyncio.to_thread(_load_queue_sync)
        queue[job_id] = job.to_dict()
        await asyncio.to_thread(_save_queue_sync, queue)

    async def recover_on_startup(self) -> int:
        """Scan outbox queue on startup and resume any interrupted QUEUED or UPLOADING jobs."""
        queue = await asyncio.to_thread(_load_queue_sync)
        resumed_count = 0
        for job_id, raw_job in queue.items():
            if not isinstance(raw_job, dict):
                continue
            status = str(raw_job.get("status") or "").upper()
            if status in ("QUEUED", "UPLOADING"):
                logger.info("Resuming interrupted dispatch job on startup: %s (status=%s)", job_id, status)
                asyncio.create_task(self._process_dispatch_job(job_id))
                resumed_count += 1
        return resumed_count

    async def retry_channel_dispatch(
        self,
        job_id_or_item_id: str,
        channel_id: str,
        spawn_background: bool = True,
    ) -> DispatchJob:
        """Retry dispatch specifically and only for the single requested channel."""
        return await self.retry_dispatch(
            job_id_or_item_id,
            channel_id=channel_id,
            spawn_background=spawn_background,
        )

    async def retry_dispatch(
        self,
        job_id_or_item_id: str,
        channel_id: Optional[str] = None,
        spawn_background: bool = True,
    ) -> DispatchJob:
        """Re-enqueue a failed dispatch or item dispatch without altering the rendered media."""
        queue = await asyncio.to_thread(_load_queue_sync)
        target_job_data = queue.get(job_id_or_item_id)
        if not target_job_data:
            for j in queue.values():
                if j.get("item_id") == job_id_or_item_id:
                    target_job_data = j
                    break

        if not target_job_data:
            item, _, batch = viral_studio_store.find_item_batch(job_id_or_item_id)
            brand_id = item.get("brand_id") or batch.get("brand_id")
            return await self.enqueue_dispatch(
                brand_id=brand_id,
                item_id=item.get("id") or item.get("item_id"),
                channel_ids=[channel_id] if channel_id else None,
                spawn_background=spawn_background,
            )

        old_job = DispatchJob.from_dict(target_job_data)
        if channel_id:
            channels_to_retry = [channel_id]
        else:
            # Isolated retry: retry only failed channels if partial failure
            failed_channels = [
                r.get("channel_id")
                for r in old_job.receipts
                if r.get("status") == "failed" and r.get("channel_id")
            ]
            channels_to_retry = failed_channels if failed_channels else old_job.channel_ids

        return await self.enqueue_dispatch(
            brand_id=old_job.brand_id,
            item_id=old_job.item_id,
            channel_ids=channels_to_retry,
            scheduled_for=old_job.scheduled_for,
            publish_now=old_job.publish_now,
            spawn_background=spawn_background,
        )

    async def cancel_scheduled_post(self, brand_id: str, post_id: str) -> bool:
        """Cancel a scheduled post via the active publisher port and update store state."""
        brand = viral_studio_store.get_brand_or_raise(brand_id)
        from clippyme.domain import brand_workspace_service
        provider_name = brand_workspace_service.get_brand_active_provider(brand)
        port = self._get_publisher(provider_name=provider_name)

        success = await port.cancel(post_id)
        viral_studio_store.update_item_status_by_post_id(post_id, "APPROVED")
        return success

    def list_dispatches(
        self,
        brand_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
    ) -> List[DispatchJob]:
        """Query persistent dispatch history and active outbox queue."""
        queue = _load_queue_sync()
        jobs = [DispatchJob.from_dict(d) for d in queue.values()]

        if brand_id:
            jobs = [j for j in jobs if j.brand_id == brand_id]
        if status:
            norm_status = status.upper()
            jobs = [j for j in jobs if j.status.upper() == norm_status]

        jobs.sort(key=lambda j: j.updated_at or j.created_at, reverse=True)
        return jobs[:limit]

    def list_dispatch_records(
        self,
        brand_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
    ) -> List[DispatchJob]:
        """Alias for list_dispatches."""
        return self.list_dispatches(brand_id=brand_id, status=status, limit=limit)


dispatch_service = PublishDispatchService()
