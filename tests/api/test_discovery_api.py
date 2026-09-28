"""API tests for Discovery endpoints (synchronous and asynchronous)."""
import pytest
from fastapi.testclient import TestClient
from clippyme.api.app import app
from clippyme.domain.discovery.schemas import (
    DiscoveryFilter,
    DiscoveryItem,
    DiscoverySearch,
    DiscoverySearchStatus,
    PlatformType,
)
from clippyme.domain.discovery import store
from clippyme.domain.discovery.worker import reset_discovery_worker


@pytest.fixture(autouse=True)
def isolated_discovery_env(tmp_path):
    orig_dir = store.get_discovery_dir()
    store.set_discovery_dir(str(tmp_path))
    reset_discovery_worker()
    yield tmp_path
    store.reset_discovery_store()
    store.set_discovery_dir(orig_dir)
    reset_discovery_worker()


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


def test_async_discovery_lifecycle_endpoints():
    client = TestClient(app)

    # 1. Create search (HTTP 202 Accepted)
    payload = {
        "query": "tecnologia",
        "platform": "tiktok",
        "limit": 15,
    }
    res_create = client.post("/api/discovery/searches", json=payload)
    assert res_create.status_code == 202
    summary = res_create.json()
    search_id = summary["id"]
    assert summary["query"] == "tecnologia"
    assert summary["platform"] == "tiktok"
    assert summary["status"] == "QUEUED"

    # 2. List searches (History)
    res_list = client.get("/api/discovery/searches")
    assert res_list.status_code == 200
    summaries = res_list.json()
    assert len(summaries) >= 1
    assert any(s["id"] == search_id for s in summaries)

    # 3. Get search detail
    res_detail = client.get(f"/api/discovery/searches/{search_id}")
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert detail["id"] == search_id
    assert detail["query"] == "tecnologia"
    assert "items" in detail

    # 4. Cancel search
    res_cancel = client.post(f"/api/discovery/searches/{search_id}/cancel")
    assert res_cancel.status_code == 200
    cancel_summary = res_cancel.json()
    assert cancel_summary["id"] == search_id
    assert cancel_summary["status"] == "CANCELLED"

    # Verify detail status is CANCELLED
    res_detail_cancelled = client.get(f"/api/discovery/searches/{search_id}")
    assert res_detail_cancelled.json()["status"] == "CANCELLED"

    # 5. Delete search
    res_delete = client.delete(f"/api/discovery/searches/{search_id}")
    assert res_delete.status_code == 200
    assert res_delete.json()["success"] is True

    # 6. Verify 404 after deletion
    res_not_found = client.get(f"/api/discovery/searches/{search_id}")
    assert res_not_found.status_code == 404
