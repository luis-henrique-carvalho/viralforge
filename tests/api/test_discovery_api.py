"""API tests for Discovery endpoints."""
import pytest
from fastapi.testclient import TestClient
from clippyme.api.app import app
from clippyme.domain.discovery.schemas import DiscoveryItem, PlatformType


def test_get_discovery_platforms():
    client = TestClient(app)
    res = client.get("/api/discovery/platforms")
    assert res.status_code == 200
    data = res.json()
    assert "platforms" in data
    assert len(data["platforms"]) >= 3

    # Backwards compatibility check with /api/discover/platforms
    res_legacy = client.get("/api/discover/platforms")
    assert res_legacy.status_code == 200
    assert res_legacy.json() == data


def test_post_discovery_search(monkeypatch):
    client = TestClient(app)

    fake_items = [
        DiscoveryItem(
            id="v100",
            platform=PlatformType.YOUTUBE,
            url="https://youtube.com/shorts/v100",
            title="Promoção Bombando",
            view_count=50000,
            virality_score=85.0,
        )
    ]

    async def fake_search(params):
        from clippyme.domain.discovery.schemas import DiscoveryResult
        return DiscoveryResult(
            query=params.query,
            platform=params.platform,
            total_found=len(fake_items),
            items=fake_items,
            cached=False,
            fetched_at="2026-09-23T12:00:00Z",
        )

    from clippyme.domain.discovery.service import get_discovery_service
    service = get_discovery_service()
    monkeypatch.setattr(service, "search", fake_search)

    payload = {
        "query": "promocoes",
        "platform": "youtube",
        "limit": 20,
    }

    res = client.post("/api/discovery/search", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert body["query"] == "promocoes"
    assert body["total_found"] == 1
    assert body["items"][0]["id"] == "v100"

    # Backwards compatibility check with /api/discover/search
    res_legacy = client.post("/api/discover/search", json=payload)
    assert res_legacy.status_code == 200
    assert res_legacy.json()["items"][0]["id"] == "v100"
