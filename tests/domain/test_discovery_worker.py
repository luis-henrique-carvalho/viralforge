"""Unit tests for DiscoveryWorker queue, concurrency semaphore, cancellation, and recovery."""
import asyncio
import pytest
from clippyme.domain.discovery.schemas import (
    DiscoveryFilter,
    DiscoveryItem,
    DiscoveryResult,
    DiscoverySearch,
    DiscoverySearchStatus,
    PlatformType,
)
from clippyme.domain.discovery.worker import DiscoveryWorker, reset_discovery_worker
from clippyme.domain.discovery import store


@pytest.fixture(autouse=True)
def isolated_discovery_env(tmp_path):
    orig_dir = store.get_discovery_dir()
    store.set_discovery_dir(str(tmp_path))
    reset_discovery_worker()
    yield tmp_path
    store.reset_discovery_store()
    store.set_discovery_dir(orig_dir)
    reset_discovery_worker()


@pytest.mark.asyncio
async def test_worker_execute_search_to_completion(monkeypatch):
    worker = DiscoveryWorker(max_concurrent=2)

    fake_items = [
        DiscoveryItem(
            id="vid-1",
            platform=PlatformType.INSTAGRAM,
            url="https://instagram.com/reel/123",
            title="Achadinho",
            view_count=50000,
            virality_score=90.0,
        )
    ]

    async def fake_search(params):
        return DiscoveryResult(
            query=params.query,
            platform=params.platform,
            total_found=len(fake_items),
            items=fake_items,
            cached=False,
            fetched_at="2026-09-24T12:00:00Z",
        )

    from clippyme.domain.discovery.service import get_discovery_service
    service = get_discovery_service()
    monkeypatch.setattr(service, "search", fake_search)

    search = DiscoverySearch(
        id="search-success",
        platform=PlatformType.INSTAGRAM,
        query="achadinhos",
        filter_params=DiscoveryFilter(query="achadinhos", platform=PlatformType.INSTAGRAM),
        status=DiscoverySearchStatus.QUEUED,
        created_at="2026-09-24T12:00:00Z",
    )

    await worker.enqueue_search(search)

    # Run worker for 1 tick
    worker_task = asyncio.create_task(worker.run())
    await asyncio.sleep(0.1)
    await worker.stop()
    await worker_task

    completed = store.get_search("search-success")
    assert completed is not None
    assert completed.status == DiscoverySearchStatus.COMPLETED
    assert completed.total_found == 1
    assert len(completed.items) == 1
    assert completed.items[0].id == "vid-1"
    assert completed.completed_at is not None
    assert completed.duration_seconds is not None


@pytest.mark.asyncio
async def test_worker_cancel_queued_search(monkeypatch):
    worker = DiscoveryWorker(max_concurrent=1)

    search = DiscoverySearch(
        id="search-cancel-queued",
        platform=PlatformType.TIKTOK,
        query="cancel_me",
        filter_params=DiscoveryFilter(query="cancel_me", platform=PlatformType.TIKTOK),
        status=DiscoverySearchStatus.QUEUED,
        created_at="2026-09-24T12:00:00Z",
    )

    await worker.enqueue_search(search)
    # Cancel while still in queue
    cancelled = await worker.cancel_search("search-cancel-queued")
    assert cancelled is not None
    assert cancelled.status == DiscoverySearchStatus.CANCELLED

    # Now run worker, it should skip dispatch
    executed = False
    async def fake_search(params):
        nonlocal executed
        executed = True
        return DiscoveryResult(query="q", platform=PlatformType.TIKTOK, total_found=0, items=[], fetched_at="now")

    from clippyme.domain.discovery.service import get_discovery_service
    service = get_discovery_service()
    monkeypatch.setattr(service, "search", fake_search)

    worker_task = asyncio.create_task(worker.run())
    await asyncio.sleep(0.1)
    await worker.stop()
    await worker_task

    assert executed is False
    final_search = store.get_search("search-cancel-queued")
    assert final_search.status == DiscoverySearchStatus.CANCELLED


@pytest.mark.asyncio
async def test_worker_cancel_in_flight_search(monkeypatch):
    worker = DiscoveryWorker(max_concurrent=2)

    started_event = asyncio.Event()

    async def long_running_search(params):
        started_event.set()
        await asyncio.sleep(10)  # simulate long extraction
        return DiscoveryResult(query="q", platform=PlatformType.YOUTUBE, total_found=0, items=[], fetched_at="now")

    from clippyme.domain.discovery.service import get_discovery_service
    service = get_discovery_service()
    monkeypatch.setattr(service, "search", long_running_search)

    search = DiscoverySearch(
        id="search-inflight",
        platform=PlatformType.YOUTUBE,
        query="long_search",
        filter_params=DiscoveryFilter(query="long_search", platform=PlatformType.YOUTUBE),
        status=DiscoverySearchStatus.QUEUED,
        created_at="2026-09-24T12:00:00Z",
    )

    await worker.enqueue_search(search)
    worker_task = asyncio.create_task(worker.run())

    # Wait until the search is actively executing
    await asyncio.wait_for(started_event.wait(), timeout=2.0)
    assert "search-inflight" in worker._active_tasks

    # Now cancel in flight
    await worker.cancel_search("search-inflight")
    await asyncio.sleep(0.1)

    await worker.stop()
    await worker_task

    final_search = store.get_search("search-inflight")
    assert final_search.status == DiscoverySearchStatus.CANCELLED
    assert final_search.completed_at is not None


@pytest.mark.asyncio
async def test_worker_startup_recovery():
    worker = DiscoveryWorker(max_concurrent=2)

    # Seed orphan searches from a simulated previous crashed run
    orphan_queued = DiscoverySearch(
        id="orphan-queued",
        platform=PlatformType.TIKTOK,
        query="orphan1",
        filter_params=DiscoveryFilter(query="orphan1", platform=PlatformType.TIKTOK),
        status=DiscoverySearchStatus.QUEUED,
        created_at="2026-09-24T10:00:00Z",
    )
    orphan_searching = DiscoverySearch(
        id="orphan-searching",
        platform=PlatformType.TIKTOK,
        query="orphan2",
        filter_params=DiscoveryFilter(query="orphan2", platform=PlatformType.TIKTOK),
        status=DiscoverySearchStatus.SEARCHING,
        created_at="2026-09-24T10:00:00Z",
    )
    store.save_search(orphan_queued)
    store.save_search(orphan_searching)

    await worker.recover_on_startup()

    recovered_queued = store.get_search("orphan-queued")
    assert recovered_queued.status == DiscoverySearchStatus.FAILED
    assert "reinício do servidor" in recovered_queued.error_message

    recovered_searching = store.get_search("orphan-searching")
    assert recovered_searching.status == DiscoverySearchStatus.FAILED
    assert "reinício do servidor" in recovered_searching.error_message


@pytest.mark.asyncio
async def test_worker_handles_execution_error(monkeypatch):
    worker = DiscoveryWorker(max_concurrent=2)

    async def failing_search(params):
        raise RuntimeError("Rate limit exceeded on social provider")

    from clippyme.domain.discovery.service import get_discovery_service
    service = get_discovery_service()
    monkeypatch.setattr(service, "search", failing_search)

    search = DiscoverySearch(
        id="search-error",
        platform=PlatformType.INSTAGRAM,
        query="fail",
        filter_params=DiscoveryFilter(query="fail", platform=PlatformType.INSTAGRAM),
        status=DiscoverySearchStatus.QUEUED,
        created_at="2026-09-24T12:00:00Z",
    )

    await worker.enqueue_search(search)
    worker_task = asyncio.create_task(worker.run())
    await asyncio.sleep(0.1)
    await worker.stop()
    await worker_task

    final_search = store.get_search("search-error")
    assert final_search.status == DiscoverySearchStatus.FAILED
    assert "Rate limit exceeded" in (final_search.error_message or "")


@pytest.mark.asyncio
async def test_worker_semaphore_concurrency_limit(monkeypatch):
    worker = DiscoveryWorker(max_concurrent=1)
    concurrent_count = 0
    max_observed_concurrent = 0

    async def slow_search(params):
        nonlocal concurrent_count, max_observed_concurrent
        concurrent_count += 1
        if concurrent_count > max_observed_concurrent:
            max_observed_concurrent = concurrent_count
        await asyncio.sleep(0.05)
        concurrent_count -= 1
        return DiscoveryResult(query="q", platform=PlatformType.TIKTOK, total_found=0, items=[], fetched_at="now")

    from clippyme.domain.discovery.service import get_discovery_service
    service = get_discovery_service()
    monkeypatch.setattr(service, "search", slow_search)

    for i in range(3):
        s = DiscoverySearch(
            id=f"concur-{i}",
            platform=PlatformType.TIKTOK,
            query=f"concur-{i}",
            filter_params=DiscoveryFilter(query=f"concur-{i}", platform=PlatformType.TIKTOK),
            created_at="2026-09-24T12:00:00Z",
        )
        await worker.enqueue_search(s)

    worker_task = asyncio.create_task(worker.run())
    await asyncio.sleep(0.3)
    await worker.stop()
    await worker_task

    assert max_observed_concurrent == 1
    for i in range(3):
        assert store.get_search(f"concur-{i}").status == DiscoverySearchStatus.COMPLETED


@pytest.mark.asyncio
async def test_cancel_nonexistent_search():
    worker = DiscoveryWorker(max_concurrent=2)
    res = await worker.cancel_search("non-existent")
    assert res is None

