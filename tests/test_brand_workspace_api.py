"""Tests for Brand Workspace API endpoints and Domain Service (Phase 2).

Verifies:
- GET /api/viral-studio/brands/{id}/workspace aggregation
- GET /api/viral-studio/brands/{id}/channels
- POST /api/viral-studio/brands/{id}/channels/connect-url
- GET /api/viral-studio/brands/{id}/videos & filtering
- POST /api/viral-studio/brands/{id}/auto-schedule (with multi-brand isolation check)
- POST /api/viral-studio/brands/{id}/publish
- POST /api/viral-studio/brands/{id}/schedule-slots
- GET /api/viral-studio/brands/{id}/scheduled
- DELETE /api/viral-studio/brands/{id}/scheduled/{post_id} (atomic status reversion to APPROVED)
"""
from __future__ import annotations

import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from clippyme.api.app import app
from clippyme.domain import viral_studio_store
from clippyme.domain.social_publisher_port import (
    PublicationJob,
    PublicationReceipt,
    SocialChannel,
    SocialPublisherPort,
)


class MockPublisher(SocialPublisherPort):
    def __init__(self):
        self.scheduled_jobs = []
        self.published_jobs = []
        self.cancelled_posts = []

    async def list_accounts(
        self, customer_id: str | None = None, brand_id: str | None = None, **kwargs
    ) -> list[SocialChannel]:
        return [
            SocialChannel(
                id="acc_tiktok_1",
                platform="tiktok",
                name="Brand TikTok",
                connected=True,
                avatar_url="https://example.com/tiktok.png",
            ),
            SocialChannel(
                id="acc_insta_1",
                platform="instagram",
                name="Brand Insta",
                connected=True,
                avatar_url="https://example.com/insta.png",
            ),
        ]

    async def get_connect_channel_url(self, brand_id: str | None = None) -> str:
        return f"https://postiz.app/connect?brand={brand_id or 'default'}"

    async def find_next_slot(self, account_id: str) -> datetime | None:
        return datetime(2026, 10, 1, 18, 0, 0, tzinfo=timezone.utc)

    async def schedule(self, job: PublicationJob) -> PublicationReceipt:
        self.scheduled_jobs.append(job)
        return PublicationReceipt(
            item_id=job.item_id,
            post_id=f"post_mock_{job.item_id}_{job.account_id}",
            status="scheduled",
            scheduled_for=job.scheduled_for or "2026-10-01T18:00:00Z",
        )

    async def publish(self, job: PublicationJob) -> PublicationReceipt:
        self.published_jobs.append(job)
        return PublicationReceipt(
            item_id=job.item_id,
            post_id=f"post_mock_pub_{job.item_id}",
            status="published",
            post_url=f"https://tiktok.com/@test/video/123",
            published_at="2026-10-01T18:00:00Z",
        )

    async def cancel(self, post_id: str) -> bool:
        self.cancelled_posts.append(post_id)
        return True

    async def get_status(self, external_id: str) -> PublicationReceipt:
        return PublicationReceipt(
            item_id="item_mock_1",
            account_id="acc_tiktok_1",
            post_id=external_id,
            status="scheduled",
        )

    async def list_scheduled(
        self,
        customer_id: str | None = None,
        start_date: str = "",
        end_date: str = "",
    ) -> list[dict]:
        return [
            {
                "id": "post_mock_123",
                "item_id": "item_mock_1",
                "content": "Sample post copy",
                "scheduled_for": "2026-10-01T18:00:00Z",
                "status": "scheduled",
            }
        ]


@pytest.fixture
def mock_publisher_env():
    from clippyme.domain.social_publisher_port import set_social_publisher
    mock_pub = MockPublisher()
    set_social_publisher(mock_pub)
    yield mock_pub
    set_social_publisher(None)


@pytest.fixture
def temp_studio_store(monkeypatch, tmp_path):
    store_dir = tmp_path / "viral_studio"
    store_dir.mkdir(parents=True, exist_ok=True)
    viral_studio_store.set_store_dir(str(store_dir))

    # Seed mock brand 1
    brand_data = {
        "id": "brand_test",
        "name": "Test Brand",
        "handle": "@testbrand",
        "description": "A brand for testing workspace",
        "template_id": "classic-affiliate",
        "default_cta": "Click link in bio!",
        "niche": "Tech & Gadgets",
        "discovery_keywords": ["tech", "ai", "reviews"],
        "posting_schedule": {
            "slots": ["12:00", "18:00", "21:00"],
            "timezone": "America/Sao_Paulo",
            "frequency": 3,
        },
        "publishing_profiles": {
            "postiz": {
                "active": True,
                "customer_id": "auto",
                "channel_ids": ["acc_tiktok_1", "acc_insta_1"],
                "linked_at": "2026-09-27T12:00:00Z",
            }
        },
    }
    with open(store_dir / "brands.json", "w") as f:
        json.dump({"brand_test": brand_data}, f)

    # Seed dummy video file
    video_file = tmp_path / "test_rendered_video.mp4"
    video_file.write_text("fake video content")

    # Seed batches with items belonging to brand_test and another brand
    batches_data = {
        "batch_1": {
            "id": "batch_1",
            "batch_id": "batch_1",
            "brand_id": "brand_test",
            "status": "COMPLETED",
            "items": [
                {
                    "item_id": "item_1",
                    "id": "item_1",
                    "brand_id": "brand_test",
                    "status": "APPROVED",
                    "headline": "Amazing Viral Video",
                    "caption": "Check this out #viral",
                    "rendered_path": str(video_file),
                    "publication_records": [],
                },
                {
                    "item_id": "item_2",
                    "id": "item_2",
                    "brand_id": "brand_test",
                    "status": "PENDING",
                    "headline": "Pending Item Not Approved",
                    "caption": "Pending caption",
                    "rendered_path": str(video_file),
                    "publication_records": [],
                },
            ],
        },
        "batch_2": {
            "id": "batch_2",
            "batch_id": "batch_2",
            "brand_id": "other_brand",
            "status": "COMPLETED",
            "items": [
                {
                    "item_id": "item_other",
                    "id": "item_other",
                    "brand_id": "other_brand",
                    "status": "APPROVED",
                    "headline": "Other Brand Video",
                    "caption": "Other caption",
                    "rendered_path": str(video_file),
                    "publication_records": [],
                }
            ],
        },
    }
    with open(store_dir / "batches.json", "w") as f:
        json.dump(batches_data, f)

    # Seed templates
    templates_data = {
        "classic-affiliate": {
            "id": "classic-affiliate",
            "name": "Classic Affiliate",
            "description": "Classic banner template",
            "aspect_ratio": "9:16",
        }
    }
    with open(store_dir / "templates.json", "w") as f:
        json.dump(templates_data, f)

    yield {
        "store_dir": store_dir,
        "video_file": str(video_file),
    }

    # Reset store dir after test
    viral_studio_store.set_store_dir("data/viral_studio")


def test_get_brand_workspace_summary(temp_studio_store, mock_publisher_env):
    client = TestClient(app)
    response = client.get("/api/viral-studio/brands/brand_test/workspace")
    assert response.status_code == 200
    data = response.json()

    assert data["brand"]["id"] == "brand_test"
    assert data["brand"]["niche"] == "Tech & Gadgets"
    assert data["brand"]["discovery_keywords"] == ["tech", "ai", "reviews"]
    assert data["counts"]["total_videos"] == 2
    assert data["counts"]["approved_videos"] == 1
    assert data["counts"]["scheduled_posts"] == 0
    assert len(data["channels"]) == 2
    assert data["template"]["id"] == "classic-affiliate"


def test_get_brand_workspace_summary_resolves_active_publishing_profile(temp_studio_store, mock_publisher_env):
    client = TestClient(app)
    # Update brand with multiple profiles where postiz is active
    store_dir = temp_studio_store["store_dir"]
    with open(store_dir / "brands.json", "r") as f:
        brands = json.load(f)
    brands["brand_test"]["publishing_profiles"] = {
        "zernio": {"customer_id": "z_1", "active": False, "linked_at": "2026-09-27T10:00:00Z"},
        "postiz": {"customer_id": "p_1", "active": True, "linked_at": "2026-09-27T12:00:00Z"},
    }
    with open(store_dir / "brands.json", "w") as f:
        json.dump(brands, f)

    response = client.get("/api/viral-studio/brands/brand_test/workspace")
    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "postiz"


def test_list_brand_channels(temp_studio_store, mock_publisher_env):
    client = TestClient(app)
    response = client.get("/api/viral-studio/brands/brand_test/channels")
    assert response.status_code == 200
    channels = response.json()
    assert len(channels) == 2
    assert channels[0]["platform"] == "tiktok"
    assert channels[1]["platform"] == "instagram"


def test_get_brand_channel_connect_url(temp_studio_store, mock_publisher_env):
    client = TestClient(app)
    response = client.post("/api/viral-studio/brands/brand_test/channels/connect-url")
    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert "brand=brand_test" in data["url"]


def test_get_brand_videos(temp_studio_store, mock_publisher_env):
    client = TestClient(app)
    # All videos
    response = client.get("/api/viral-studio/brands/brand_test/videos")
    assert response.status_code == 200
    videos = response.json()
    assert len(videos) == 2

    # Filtered by APPROVED status
    response_approved = client.get("/api/viral-studio/brands/brand_test/videos?status=APPROVED")
    assert response_approved.status_code == 200
    approved_videos = response_approved.json()
    assert len(approved_videos) == 1
    assert approved_videos[0]["item_id"] == "item_1"


def test_auto_schedule_brand_video_success(temp_studio_store, mock_publisher_env):
    client = TestClient(app)
    payload = {
        "item_id": "item_1",
        "channel_ids": ["acc_tiktok_1"],
    }
    response = client.post("/api/viral-studio/brands/brand_test/auto-schedule?sync=true", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["receipts"]) == 1
    assert data["receipts"][0]["status"] == "scheduled"
    assert "post_mock_item_1_acc_tiktok_1" in data["receipts"][0]["post_id"]

    # Verify item status transitioned to SCHEDULED in batches.json
    batches = viral_studio_store.list_batches()
    item = next(i for b in batches for i in b.get("items", []) if i.get("item_id") == "item_1")
    assert item["status"] == "SCHEDULED"
    assert len(item["publication_records"]) == 1
    assert item["publication_records"][0]["channel_id"] == "acc_tiktok_1"


def test_auto_schedule_multi_brand_isolation_violation(temp_studio_store, mock_publisher_env):
    client = TestClient(app)
    # Try to schedule item_other (belonging to other_brand) under brand_test
    payload = {
        "item_id": "item_other",
        "channel_ids": ["acc_tiktok_1"],
    }
    response = client.post("/api/viral-studio/brands/brand_test/auto-schedule", json=payload)
    assert response.status_code == 400
    assert "Brand isolation mismatch" in response.text


def test_auto_schedule_unapproved_item_fails(temp_studio_store, mock_publisher_env):
    client = TestClient(app)
    # item_2 is DRAFT
    payload = {
        "item_id": "item_2",
        "channel_ids": ["acc_tiktok_1"],
    }
    response = client.post("/api/viral-studio/brands/brand_test/auto-schedule", json=payload)
    assert response.status_code == 400
    assert "Only ready items can be auto-scheduled" in response.text


def test_publish_brand_video_direct(temp_studio_store, mock_publisher_env):
    client = TestClient(app)
    payload = {
        "item_id": "item_1",
        "channel_ids": ["acc_tiktok_1"],
        "publish_now": True,
    }
    response = client.post("/api/viral-studio/brands/brand_test/publish?sync=true", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["receipts"][0]["status"] == "published"

    # Verify item status transitioned to PUBLISHED
    batches = viral_studio_store.list_batches()
    item = next(i for b in batches for i in b.get("items", []) if i.get("item_id") == "item_1")
    assert item["status"] == "PUBLISHED"


def test_update_brand_schedule_slots(temp_studio_store, mock_publisher_env):
    client = TestClient(app)
    payload = {
        "slots": ["09:00", "14:00", "20:00"],
        "timezone": "America/New_York",
        "frequency": 3,
    }
    response = client.post("/api/viral-studio/brands/brand_test/schedule-slots", json=payload)
    assert response.status_code == 200
    brand = response.json()
    assert brand["posting_schedule"]["slots"] == ["09:00", "14:00", "20:00"]
    assert brand["posting_schedule"]["timezone"] == "America/New_York"
    assert brand["posting_schedule"]["frequency"] == 3


def test_list_brand_scheduled_timeline(temp_studio_store, mock_publisher_env):
    client = TestClient(app)
    response = client.get("/api/viral-studio/brands/brand_test/scheduled")
    assert response.status_code == 200
    timeline = response.json()
    assert timeline["brand_id"] == "brand_test"
    assert len(timeline["posts"]) >= 1
    post = timeline["posts"][0]
    assert "id" in post and post["id"]
    assert "post_id" in post and post["post_id"]
    assert post["id"] == post["post_id"]
    assert "scheduled_for" in post
    assert "scheduled_time" in post


def test_cancel_brand_scheduled_post_reverts_status_to_approved(temp_studio_store, mock_publisher_env):
    client = TestClient(app)

    # First auto-schedule item_1 to create a post and set status to SCHEDULED
    schedule_res = client.post(
        "/api/viral-studio/brands/brand_test/auto-schedule?sync=true",
        json={"item_id": "item_1", "channel_ids": ["acc_tiktok_1"]},
    )
    assert schedule_res.status_code == 200
    post_id = schedule_res.json()["receipts"][0]["post_id"]

    # Verify item is SCHEDULED
    batches = viral_studio_store.list_batches()
    item = next(i for b in batches for i in b.get("items", []) if i.get("item_id") == "item_1")
    assert item["status"] == "SCHEDULED"

    # Now cancel the scheduled post
    cancel_res = client.delete(f"/api/viral-studio/brands/brand_test/scheduled/{post_id}")
    assert cancel_res.status_code == 200
    assert cancel_res.json()["success"] is True

    # Invariant: Item status must be atomically reverted to APPROVED
    batches = viral_studio_store.list_batches()
    item_after = next(i for b in batches for i in b.get("items", []) if i.get("item_id") == "item_1")
    assert item_after["status"] == "APPROVED"
    assert item_after["publication_records"][0]["status"] == "cancelled"

    # Invariant: Cancelled posts must not be returned in fallback timeline list
    with patch.object(mock_publisher_env, "list_scheduled", AsyncMock(return_value=[])):
        timeline_res = client.get("/api/viral-studio/brands/brand_test/scheduled")
        assert timeline_res.status_code == 200
        active_posts = timeline_res.json()["posts"]
        assert not any(p["id"] == post_id for p in active_posts)


def test_brand_channels_isolation_and_binding(temp_studio_store, mock_publisher_env):
    client = TestClient(app)

    # 1. Create a brand without bound channels
    brand_unbound = {
        "name": "Isolated Brand",
        "handle": "@isolated",
        "niche": "Security",
    }
    create_res = client.post("/api/viral-studio/brands", json=brand_unbound)
    assert create_res.status_code == 201
    new_brand_id = create_res.json()["id"]

    # 2. Get active channels for unbound brand -> should return empty list (isolated!)
    chans_res = client.get(f"/api/viral-studio/brands/{new_brand_id}/channels")
    assert chans_res.status_code == 200
    assert chans_res.json() == []

    # 3. Get available channels from publisher -> should return all accounts
    avail_res = client.get(f"/api/viral-studio/brands/{new_brand_id}/channels/available")
    assert avail_res.status_code == 200
    avail_chans = avail_res.json()
    assert len(avail_chans) == 2

    # 4. Bind only 1 channel to this brand
    bind_res = client.post(
        f"/api/viral-studio/brands/{new_brand_id}/channels/bind",
        json={"channel_ids": ["acc_tiktok_1"]},
    )
    assert bind_res.status_code == 200
    updated_brand = bind_res.json()
    profiles = updated_brand.get("publishing_profiles") or {}
    assert len(profiles) >= 1
    active_profile = next(iter(profiles.values()))
    assert active_profile.get("channel_ids") == ["acc_tiktok_1"]

    # 5. Get active channels now -> should return only acc_tiktok_1
    chans_after_bind = client.get(f"/api/viral-studio/brands/{new_brand_id}/channels")
    assert chans_after_bind.status_code == 200
    bound_chans = chans_after_bind.json()
    assert len(bound_chans) == 1
    assert bound_chans[0]["id"] == "acc_tiktok_1"


def test_list_publishing_workspaces(temp_studio_store, mock_publisher_env):
    client = TestClient(app)
    res = client.get("/api/viral-studio/publishing/workspaces")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_auto_schedule_and_publish_return_channels_count(temp_studio_store, mock_publisher_env):
    client = TestClient(app)
    # 1. Auto schedule async
    res_sched = client.post(
        "/api/viral-studio/brands/brand_test/auto-schedule",
        json={"item_id": "item_1", "channel_ids": ["acc_tiktok_1", "acc_instagram_1"]},
    )
    assert res_sched.status_code == 202
    data_sched = res_sched.json()
    assert data_sched["success"] is True
    assert data_sched["channels_count"] == 2

    # 2. Publish async
    res_pub = client.post(
        "/api/viral-studio/brands/brand_test/publish",
        json={"item_id": "item_1", "channel_ids": ["acc_tiktok_1"], "publish_now": True},
    )
    assert res_pub.status_code == 202
    data_pub = res_pub.json()
    assert data_pub["success"] is True
    assert data_pub["channels_count"] == 1


def test_publish_brand_scheduled_now(temp_studio_store, mock_publisher_env):
    client = TestClient(app)
    # First auto-schedule
    schedule_res = client.post(
        "/api/viral-studio/brands/brand_test/auto-schedule?sync=true",
        json={"item_id": "item_1", "channel_ids": ["acc_tiktok_1"]},
    )
    assert schedule_res.status_code == 200
    post_id = schedule_res.json()["receipts"][0]["post_id"]

    # Now trigger publish-now
    pub_now_res = client.post(f"/api/viral-studio/brands/brand_test/scheduled/{post_id}/publish-now")
    assert pub_now_res.status_code == 202
    data = pub_now_res.json()
    assert data["success"] is True
    assert data["item_id"] == "item_1"


def test_list_brand_scheduled_timeline_includes_active_queue_jobs(temp_studio_store, mock_publisher_env):
    from clippyme.domain.publish_dispatch_service import _save_queue_sync, DispatchJob
    # Add a mock active job in dispatch queue
    active_job = DispatchJob(
        job_id="job_active_123",
        item_id="item_1",
        brand_id="brand_test",
        channel_ids=["acc_tiktok_1"],
        status="UPLOADING",
        title="Active Uploading Video",
    )
    _save_queue_sync({"job_active_123": active_job.to_dict()})

    client = TestClient(app)
    res = client.get("/api/viral-studio/brands/brand_test/scheduled")
    assert res.status_code == 200
    posts = res.json()["posts"]
    assert any(p["id"] == "job_active_123" and p["status"] == "UPLOADING" for p in posts)
    active_post = next(p for p in posts if p["id"] == "job_active_123")
    assert active_post["channel_name"] == "Brand TikTok"
    assert active_post["platform"] == "tiktok"


def test_cancel_queued_dispatch_job_removes_from_timeline(temp_studio_store, mock_publisher_env):
    from clippyme.domain.publish_dispatch_service import _save_queue_sync, _load_queue_sync, DispatchJob
    # Add a mock active job in dispatch queue
    queued_job = DispatchJob(
        job_id="job_queued_cancel_test",
        item_id="item_1",
        brand_id="brand_test",
        channel_ids=["acc_tiktok_1"],
        status="QUEUED",
        title="Queued Test Video",
    )
    _save_queue_sync({"job_queued_cancel_test": queued_job.to_dict()})

    client = TestClient(app)
    # Check it is in timeline
    res_before = client.get("/api/viral-studio/brands/brand_test/scheduled")
    assert any(p["id"] == "job_queued_cancel_test" for p in res_before.json()["posts"])

    # Cancel the queued job
    del_res = client.delete("/api/viral-studio/brands/brand_test/scheduled/job_queued_cancel_test")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Invariant: Job status is CANCELLED in queue and not in timeline
    q = _load_queue_sync()
    assert q["job_queued_cancel_test"]["status"] == "CANCELLED"

    res_after = client.get("/api/viral-studio/brands/brand_test/scheduled")
    assert not any(p["id"] == "job_queued_cancel_test" for p in res_after.json()["posts"])


def test_get_brand_videos_reflects_in_flight_dispatch_queue_status(temp_studio_store, mock_publisher_env):
    """GET /api/viral-studio/brands/{id}/videos must reflect in-flight QUEUED/UPLOADING jobs as SCHEDULED."""
    from clippyme.domain.publish_dispatch_service import _save_queue_sync, DispatchJob
    # Pre-add active dispatch queue job
    job = DispatchJob(
        job_id="job_inflight_videos_tab",
        item_id="item_1",
        brand_id="brand_test",
        channel_ids=["acc_tiktok_1"],
        status="UPLOADING",
        scheduled_for="2026-09-28T15:00:00-03:00",
        title="In-flight Uploading Video",
    )
    _save_queue_sync({"job_inflight_videos_tab": job.to_dict()})

    client = TestClient(app)
    res = client.get("/api/viral-studio/brands/brand_test/videos")
    assert res.status_code == 200
    items = res.json()
    item1 = next(i for i in items if i["id"] == "item_1")
    assert item1["status"] == "SCHEDULED"
    assert item1["scheduled_for"] == "2026-09-28T15:00:00-03:00"

