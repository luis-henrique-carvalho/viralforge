import pytest
import time
from clippyme.domain.discovery.schemas import (
    DiscoveryFilter,
    DiscoveryItem,
    DiscoveryResult,
    PlatformType,
    SortOrder,
)
from clippyme.domain.discovery.scoring import (
    calculate_engagement_rate,
    calculate_freshness_decay,
    calculate_view_velocity,
    calculate_virality_score,
)
from clippyme.domain.discovery.service import DiscoveryService


def test_calculate_view_velocity():
    now = 1700000000
    published = now - 3600  # 1 hora atrás
    velocity = calculate_view_velocity(1000, published, now)
    assert velocity == 1000.0


def test_calculate_engagement_rate():
    # TikTok: likes + 2.5*comments + 4*shares + 3*saves
    er_tiktok = calculate_engagement_rate(
        PlatformType.TIKTOK, views=10000, likes=1000, comments=100, shares=50, saves=20
    )
    # (1000 + 250 + 200 + 60) / 10000 = 1510 / 10000 = 0.151
    assert pytest.approx(er_tiktok, 0.001) == 0.151

    # Instagram: likes + 3*comments + 4.5*shares
    er_ig = calculate_engagement_rate(
        PlatformType.INSTAGRAM, views=5000, likes=500, comments=50, shares=20
    )
    # (500 + 150 + 90) / 5000 = 740 / 5000 = 0.148
    assert pytest.approx(er_ig, 0.001) == 0.148


def test_calculate_freshness_decay():
    now = 1700000000
    # Zero age -> decay should be ~1.0
    decay_fresh = calculate_freshness_decay(now, 72.0, now)
    assert pytest.approx(decay_fresh, 0.01) == 1.0

    # 72 hours age -> decay should be ~0.5
    decay_72h = calculate_freshness_decay(now - 72 * 3600, 72.0, now)
    assert pytest.approx(decay_72h, 0.01) == 0.5


def test_calculate_virality_score():
    now = 1700000000
    score = calculate_virality_score(
        platform=PlatformType.INSTAGRAM,
        views=500000,
        likes=50000,
        comments=2000,
        shares=1000,
        published_timestamp=now - 3600 * 5,
        current_timestamp=now,
    )
    assert 0.0 <= score <= 100.0
    assert score > 50.0  # Vídeo muito engajado e recente deve pontuar alto


def test_discovery_schemas():
    filter_obj = DiscoveryFilter(query="politica", platform=PlatformType.INSTAGRAM, limit=10)
    assert filter_obj.query == "politica"
    assert filter_obj.platform == PlatformType.INSTAGRAM
    assert filter_obj.limit == 10

    item = DiscoveryItem(
        id="123",
        platform=PlatformType.INSTAGRAM,
        url="https://www.instagram.com/reel/abc/",
        title="Discurso",
        view_count=100000,
        like_count=10000,
        virality_score=85.5,
    )
    assert item.id == "123"
    assert item.virality_score == 85.5


def test_discovery_service_sorting():
    service = DiscoveryService()
    items = [
        DiscoveryItem(
            id="1",
            platform=PlatformType.INSTAGRAM,
            url="https://inst.com/1",
            view_count=1000,
            virality_score=50.0,
            published_timestamp=100,
        ),
        DiscoveryItem(
            id="2",
            platform=PlatformType.INSTAGRAM,
            url="https://inst.com/2",
            view_count=50000,
            virality_score=95.0,
            published_timestamp=200,
        ),
    ]

    sorted_by_viral = service._sort_items(items, SortOrder.VIRALITY_SCORE)
    assert sorted_by_viral[0].id == "2"

    sorted_by_views = service._sort_items(items, SortOrder.VIEW_COUNT)
    assert sorted_by_views[0].id == "2"


def test_discovery_search_to_summary():
    from clippyme.domain.discovery.schemas import DiscoverySearch, DiscoverySearchStatus, DiscoverySearchSummary

    filter_obj = DiscoveryFilter(query="test", platform=PlatformType.TIKTOK)
    search = DiscoverySearch(
        id="s-1",
        platform=PlatformType.TIKTOK,
        query="test",
        filter_params=filter_obj,
        status=DiscoverySearchStatus.QUEUED,
        total_found=5,
        created_at="2026-09-24T12:00:00Z",
        completed_at="2026-09-24T12:01:00Z",
        error_message=None,
    )
    summary = search.to_summary()
    assert isinstance(summary, DiscoverySearchSummary)
    assert summary.id == "s-1"
    assert summary.platform == PlatformType.TIKTOK
    assert summary.query == "test"
    assert summary.status == DiscoverySearchStatus.QUEUED
    assert summary.total_found == 5
    assert summary.created_at == "2026-09-24T12:00:00Z"
    assert summary.completed_at == "2026-09-24T12:01:00Z"


@pytest.mark.asyncio
async def test_discovery_worker_create_and_enqueue(tmp_path, monkeypatch):
    import clippyme.domain.discovery.store as store_mod
    from clippyme.domain.discovery.worker import DiscoveryWorker

    monkeypatch.setattr(store_mod, "DATA_DIR", str(tmp_path))
    worker = DiscoveryWorker(max_concurrent=2)
    filter_obj = DiscoveryFilter(query="marketing", platform=PlatformType.YOUTUBE)

    summary = await worker.create_and_enqueue(filter_obj)
    assert summary.id is not None
    assert summary.query == "marketing"
    assert summary.platform == PlatformType.YOUTUBE
    assert summary.status == "QUEUED"

    queued_id = await worker._queue.get()
    assert queued_id == summary.id


@pytest.mark.asyncio
async def test_discovery_worker_platform_locking(tmp_path, monkeypatch):
    import asyncio
    import clippyme.domain.discovery.store as store_mod
    from clippyme.domain.discovery.worker import DiscoveryWorker
    from clippyme.domain.discovery.schemas import DiscoveryResult

    monkeypatch.setattr(store_mod, "DATA_DIR", str(tmp_path))
    worker = DiscoveryWorker(max_concurrent=4)

    # Track concurrent execution per platform
    active_per_platform = {PlatformType.TIKTOK: 0, PlatformType.INSTAGRAM: 0}
    max_active_per_platform = {PlatformType.TIKTOK: 0, PlatformType.INSTAGRAM: 0}

    class MockDiscoveryService:
        async def search(self, filter_params):
            plat = filter_params.platform
            active_per_platform[plat] += 1
            if active_per_platform[plat] > max_active_per_platform[plat]:
                max_active_per_platform[plat] = active_per_platform[plat]
            await asyncio.sleep(0.05)
            active_per_platform[plat] -= 1
            return DiscoveryResult(
                query=filter_params.query,
                platform=plat,
                total_found=0,
                items=[],
                fetched_at="now",
            )

    import clippyme.domain.discovery.worker as worker_mod
    monkeypatch.setattr(worker_mod, "get_discovery_service", lambda: MockDiscoveryService())

    # Enqueue two TikTok searches and one Instagram search
    s1 = await worker.create_and_enqueue(DiscoveryFilter(query="q1", platform=PlatformType.TIKTOK))
    s2 = await worker.create_and_enqueue(DiscoveryFilter(query="q2", platform=PlatformType.TIKTOK))
    s3 = await worker.create_and_enqueue(DiscoveryFilter(query="q3", platform=PlatformType.INSTAGRAM))

    # Process all three concurrently
    await asyncio.gather(
        worker._process_search(s1.id),
        worker._process_search(s2.id),
        worker._process_search(s3.id),
    )

    # For TikTok, max concurrency should be exactly 1 due to per-platform lock
    assert max_active_per_platform[PlatformType.TIKTOK] == 1
    assert max_active_per_platform[PlatformType.INSTAGRAM] == 1
