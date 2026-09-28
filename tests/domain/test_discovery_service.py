"""Unit tests for Discovery Service and Platform Providers."""
import pytest
from unittest.mock import MagicMock
from clippyme.domain.discovery.schemas import (
    DiscoveryFilter,
    DiscoveryItem,
    PlatformType,
    SortOrder,
)
from clippyme.domain.discovery.service import DiscoveryService
from clippyme.domain.discovery.providers.youtube_provider import YouTubeProvider
from clippyme.domain.discovery.providers.tiktok_provider import TikTokProvider


@pytest.mark.asyncio
async def test_discovery_service_duration_filtering(monkeypatch):
    service = DiscoveryService()

    fake_items = [
        DiscoveryItem(
            id="v1",
            platform=PlatformType.YOUTUBE,
            url="https://youtube.com/shorts/v1",
            title="Short Video",
            duration_seconds=15.0,
            view_count=1000,
            virality_score=80.0,
        ),
        DiscoveryItem(
            id="v2",
            platform=PlatformType.YOUTUBE,
            url="https://youtube.com/shorts/v2",
            title="Medium Video",
            duration_seconds=45.0,
            view_count=2000,
            virality_score=90.0,
        ),
        DiscoveryItem(
            id="v3",
            platform=PlatformType.YOUTUBE,
            url="https://youtube.com/shorts/v3",
            title="Long Video",
            duration_seconds=120.0,
            view_count=5000,
            virality_score=70.0,
        ),
    ]

    async def fake_search(params):
        return fake_items

    monkeypatch.setattr(service._providers[PlatformType.YOUTUBE], "search", fake_search)

    # Test max duration filter
    f_max = DiscoveryFilter(
        query="test",
        platform=PlatformType.YOUTUBE,
        max_duration_seconds=30,
    )
    res_max = await service.search(f_max)
    assert len(res_max.items) == 1
    assert res_max.items[0].id == "v1"

    # Test min duration filter
    f_min = DiscoveryFilter(
        query="test",
        platform=PlatformType.YOUTUBE,
        min_duration_seconds=30,
        max_duration_seconds=60,
    )
    res_min = await service.search(f_min)
    assert len(res_min.items) == 1
    assert res_min.items[0].id == "v2"


def test_youtube_provider_search_sync(monkeypatch):
    provider = YouTubeProvider()

    mock_entries = [
        {
            "id": "yt123",
            "title": "Achadinho Incrivel",
            "uploader": "Canal Legal",
            "uploader_id": "canallegal",
            "view_count": 50000,
            "like_count": 5000,
            "comment_count": 200,
            "timestamp": 1700000000,
            "duration": 35,
            "thumbnail": "https://img.youtube.com/vi/yt123/hqdefault.jpg",
        }
    ]

    class FakeYDL:
        def __init__(self, *args, **kwargs):
            pass
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
        def extract_info(self, url, download=False):
            return {"entries": mock_entries}

    import yt_dlp
    monkeypatch.setattr(yt_dlp, "YoutubeDL", FakeYDL)

    items = provider._search_sync("achadinhos", limit=10)
    assert len(items) == 1
    assert items[0].id == "yt123"
    assert items[0].platform == PlatformType.YOUTUBE
    assert items[0].duration_seconds == 35
    assert items[0].virality_score > 0


def test_tiktok_provider_search_sync(monkeypatch):
    provider = TikTokProvider()

    mock_entries = [
        {
            "id": "tt123",
            "title": "Viral TikTok",
            "uploader": "tiktok_user",
            "uploader_id": "tiktok_user",
            "view_count": 100000,
            "like_count": 15000,
            "comment_count": 800,
            "repost_count": 300,
            "timestamp": 1700000000,
            "thumbnail": "https://p16-va.tiktokcdn.com/123.jpg",
        }
    ]

    class FakeYDL:
        def __init__(self, *args, **kwargs):
            pass
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
        def extract_info(self, url, download=False):
            return {"entries": mock_entries}

    import yt_dlp
    monkeypatch.setattr(yt_dlp, "YoutubeDL", FakeYDL)

    items = provider._search_sync("achadinhos", limit=10)
    assert len(items) == 1
    assert items[0].id == "tt123"
    assert items[0].platform == PlatformType.TIKTOK
    assert items[0].virality_score > 0
