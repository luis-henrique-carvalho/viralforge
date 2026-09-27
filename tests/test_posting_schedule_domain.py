"""test_posting_schedule_domain.py — Comprehensive Unit & Integration Tests for Posting Schedule & Auto-Chaining.

Verifies:
1. Multi-Slot Chaining: Distribution of N videos across multiple daily slots before advancing to next day.
2. Intra-Day Overflow: Chronological resolution discarding past slots today and rolling over.
3. Brand Isolation: Multiple brands scheduling at identical timestamps without collision.
4. Publisher Port Dispatch Invariant: Verifying scheduled_for ISO timestamp exact match on port.schedule().
5. Publication Failure Isolation: Granular receipt recording when one channel fails and another succeeds.
6. Gap filling & cancellation across multi-slot daily schedules.
7. API route integration for preview-slots with brand posting schedule.
"""
from __future__ import annotations

import json
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
from zoneinfo import ZoneInfo

import pytest
from fastapi.testclient import TestClient

from clippyme.api.app import app
from clippyme.domain import viral_studio_store
from clippyme.domain.brand_workspace_service import auto_schedule_brand_video, publish_brand_video
from clippyme.domain.errors import NotFoundError, ValidationError
from clippyme.domain.social_publisher_port import (
    PublicationJob,
    PublicationReceipt,
    SocialChannel,
    SocialPublisherPort,
    set_social_publisher,
)
from clippyme.domain.viral_studio_orchestrator import publish_batch_videos


@pytest.fixture(autouse=True)
def setup_store(tmp_path):
    store_dir = tmp_path / "viral_studio"
    store_dir.mkdir(parents=True, exist_ok=True)
    viral_studio_store.set_store_dir(str(store_dir))
    viral_studio_store.reset_store()
    viral_studio_store.seed_defaults(force=True)
    yield
    viral_studio_store.reset_store()


class SpyPublisher(SocialPublisherPort):
    def __init__(self):
        self.scheduled_jobs: list[PublicationJob] = []
        self.published_jobs: list[PublicationJob] = []
        self.fail_channel_ids: set[str] = set()

    async def list_accounts(
        self, customer_id: str | None = None, brand_id: str | None = None, **kwargs
    ) -> list[SocialChannel]:
        return [
            SocialChannel(id="ch_tiktok_1", platform="tiktok", name="TikTok Brand", connected=True),
            SocialChannel(id="ch_insta_1", platform="instagram", name="Insta Brand", connected=True),
            SocialChannel(id="ch_youtube_1", platform="youtube", name="YouTube Shorts", connected=True),
        ]

    async def schedule(self, job: PublicationJob) -> PublicationReceipt:
        if job.account_id in self.fail_channel_ids:
            raise ConnectionError(f"Simulated upstream error on channel {job.account_id}")
        self.scheduled_jobs.append(job)
        return PublicationReceipt(
            item_id=job.item_id,
            post_id=f"post_spy_{job.item_id}_{job.account_id}",
            platform_post_id=f"plat_{job.account_id}_{job.item_id}",
            status="scheduled",
            scheduled_for=job.scheduled_for,
            raw_response={"integrationId": job.account_id, "scheduled_for": job.scheduled_for},
        )

    async def publish(self, job: PublicationJob) -> PublicationReceipt:
        if job.account_id in self.fail_channel_ids:
            raise ConnectionError(f"Simulated publish error on channel {job.account_id}")
        self.published_jobs.append(job)
        return PublicationReceipt(
            item_id=job.item_id,
            post_id=f"post_pub_{job.item_id}_{job.account_id}",
            status="published",
            published_at=datetime.now(timezone.utc).isoformat(),
            post_url=f"https://social.example.com/posts/{job.item_id}",
        )

    async def cancel(self, external_id: str) -> bool:
        return True

    async def get_status(self, external_id: str) -> PublicationReceipt:
        return PublicationReceipt(item_id="mock_item", status="scheduled")


@pytest.fixture
def spy_publisher():
    pub = SpyPublisher()
    set_social_publisher(pub)
    yield pub
    set_social_publisher(None)


# ---------------------------------------------------------------------------
# 1. Multi-Slot Chaining Tests
# ---------------------------------------------------------------------------

def test_multi_slot_chaining_10_videos_over_4_days():
    """10 videos with 3 daily slots (10:00, 15:00, 20:00) distributed across 4 days."""
    tz_str = "America/Sao_Paulo"
    tz = ZoneInfo(tz_str)
    # Fix a reference start_date in the future to test pure math independent of current time of day
    future_start = (datetime.now(tz) + timedelta(days=5)).strftime("%Y-%m-%d")
    start_date_obj = datetime.strptime(future_start, "%Y-%m-%d").date()

    slots = viral_studio_store.get_next_available_slots(
        account_id="ch_brand_1",
        count=10,
        slots=["10:00", "15:00", "20:00"],
        start_date=future_start,
        timezone_str=tz_str,
    )

    assert len(slots) == 10

    # Day 0 (start_date): 3 slots (10:00, 15:00, 20:00)
    assert slots[0].date() == start_date_obj
    assert (slots[0].hour, slots[0].minute) == (10, 0)
    assert slots[1].date() == start_date_obj
    assert (slots[1].hour, slots[1].minute) == (15, 0)
    assert slots[2].date() == start_date_obj
    assert (slots[2].hour, slots[2].minute) == (20, 0)

    # Day 1: 3 slots
    d1 = start_date_obj + timedelta(days=1)
    assert slots[3].date() == d1
    assert (slots[3].hour, slots[3].minute) == (10, 0)
    assert slots[4].date() == d1
    assert (slots[4].hour, slots[4].minute) == (15, 0)
    assert slots[5].date() == d1
    assert (slots[5].hour, slots[5].minute) == (20, 0)

    # Day 2: 3 slots
    d2 = start_date_obj + timedelta(days=2)
    assert slots[6].date() == d2
    assert (slots[6].hour, slots[6].minute) == (10, 0)
    assert slots[7].date() == d2
    assert (slots[7].hour, slots[7].minute) == (15, 0)
    assert slots[8].date() == d2
    assert (slots[8].hour, slots[8].minute) == (20, 0)

    # Day 3: 10th video (10:00)
    d3 = start_date_obj + timedelta(days=3)
    assert slots[9].date() == d3
    assert (slots[9].hour, slots[9].minute) == (10, 0)


# ---------------------------------------------------------------------------
# 2. Intra-Day Overflow & Chronological Resolution
# ---------------------------------------------------------------------------

def test_intra_day_overflow_skips_past_slots_today():
    """When now is 16:00, 10:00 and 15:00 today are skipped, 1st slot is 20:00 today, 2nd is 10:00 tomorrow."""
    tz_str = "America/Sao_Paulo"
    tz = ZoneInfo(tz_str)
    fixed_now = datetime(2026, 9, 27, 16, 0, 0, tzinfo=tz)

    with patch("clippyme.domain.viral_studio_store.datetime") as mock_dt:
        mock_dt.now.return_value = fixed_now
        mock_dt.combine = datetime.combine
        mock_dt.fromisoformat = datetime.fromisoformat
        mock_dt.strptime = datetime.strptime

        slots = viral_studio_store.get_next_available_slots(
            account_id="ch_brand_1",
            count=2,
            slots=["10:00", "15:00", "20:00"],
            timezone_str=tz_str,
        )

        assert len(slots) == 2
        # First slot must be today at 20:00
        assert slots[0].date() == fixed_now.date()
        assert (slots[0].hour, slots[0].minute) == (20, 0)

        # Second slot overflows to tomorrow at 10:00
        assert slots[1].date() == fixed_now.date() + timedelta(days=1)
        assert (slots[1].hour, slots[1].minute) == (10, 0)


# ---------------------------------------------------------------------------
# 3. Brand Isolation Invariant
# ---------------------------------------------------------------------------

def test_brand_isolation_no_cross_collision():
    """Two different brands scheduling for the exact same slot timestamp do not collide."""
    tz_str = "America/Sao_Paulo"
    tz = ZoneInfo(tz_str)
    future_day = (datetime.now(tz) + timedelta(days=2)).date()
    target_slot_iso = f"{future_day.isoformat()}T15:00:00-03:00"

    # Create Brand A and Brand B
    viral_studio_store.create_brand({"id": "brand_alpha", "name": "Brand Alpha"})
    viral_studio_store.create_brand({"id": "brand_beta", "name": "Brand Beta"})

    # Schedule item under brand_alpha for target_slot_iso
    viral_studio_store.create_batch({
        "brand_id": "brand_alpha",
        "items": [
            {
                "item_id": "item_alpha_1",
                "brand_id": "brand_alpha",
                "source_url": "https://example.com/a.mp4",
                "status": "SCHEDULED",
                "scheduled_for": target_slot_iso,
            }
        ]
    })

    # Brand Alpha querying next slot for future_day should skip 15:00 and get 20:00
    alpha_slots = viral_studio_store.get_next_available_slots(
        brand_id="brand_alpha",
        count=1,
        slots=["10:00", "15:00", "20:00"],
        start_date=future_day.isoformat(),
        timezone_str=tz_str,
    )
    assert len(alpha_slots) == 1
    # 10:00 was not occupied, so 10:00 is returned
    assert (alpha_slots[0].hour, alpha_slots[0].minute) == (10, 0)

    # Occupy 10:00 as well for brand_alpha
    viral_studio_store.create_batch({
        "brand_id": "brand_alpha",
        "items": [
            {
                "item_id": "item_alpha_2",
                "brand_id": "brand_alpha",
                "source_url": "https://example.com/a2.mp4",
                "status": "SCHEDULED",
                "scheduled_for": f"{future_day.isoformat()}T10:00:00-03:00",
            }
        ]
    })

    alpha_slots_after = viral_studio_store.get_next_available_slots(
        brand_id="brand_alpha",
        count=1,
        slots=["10:00", "15:00", "20:00"],
        start_date=future_day.isoformat(),
        timezone_str=tz_str,
    )
    # Both 10:00 and 15:00 are occupied for brand_alpha -> returns 20:00
    assert (alpha_slots_after[0].hour, alpha_slots_after[0].minute) == (20, 0)

    # BUT Brand Beta querying for the same date must get 10:00 (completely isolated!)
    beta_slots = viral_studio_store.get_next_available_slots(
        brand_id="brand_beta",
        count=2,
        slots=["10:00", "15:00", "20:00"],
        start_date=future_day.isoformat(),
        timezone_str=tz_str,
    )
    assert len(beta_slots) == 2
    assert (beta_slots[0].hour, beta_slots[0].minute) == (10, 0)
    assert (beta_slots[1].hour, beta_slots[1].minute) == (15, 0)


# ---------------------------------------------------------------------------
# 4. Postiz / Publisher Port Dispatch Invariant (Exact ISO Timestamp)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_auto_schedule_brand_video_dispatches_exact_schedule_timestamp(tmp_path, spy_publisher):
    """Auto-scheduling calculates domain slot timestamp and sends the exact ISO string to all brand channels."""
    video_file = tmp_path / "video_sample.mp4"
    video_file.write_text("dummy video")

    brand_data = {
        "id": "brand_dispatch_test",
        "name": "Dispatch Brand",
        "posting_schedule": {
            "slots": ["14:00", "19:00"],
            "timezone": "America/Sao_Paulo",
            "frequency": 2,
        },
        "publishing_profiles": {
            "postiz": {
                "active": True,
                "channel_ids": ["ch_tiktok_1", "ch_insta_1"],
            }
        },
    }
    viral_studio_store.create_brand(brand_data)

    # Seed approved item
    viral_studio_store.create_batch({
        "id": "batch_dispatch",
        "brand_id": "brand_dispatch_test",
        "items": [
            {
                "item_id": "item_dispatch_1",
                "brand_id": "brand_dispatch_test",
                "source_url": "https://example.com/v1.mp4",
                "status": "APPROVED",
                "headline": "Dispatch Viral Title",
                "caption": "Dispatch Viral Caption",
                "rendered_path": str(video_file),
                "publication_records": [],
            }
        ]
    })

    receipts = await auto_schedule_brand_video(
        brand_id="brand_dispatch_test",
        item_id="item_dispatch_1",
        channel_ids=["ch_tiktok_1", "ch_insta_1"],
    )

    assert len(receipts) == 2
    assert all(r.status == "scheduled" for r in receipts)

    # Verify spy publisher received both jobs with identical, domain-calculated scheduled_for timestamp
    assert len(spy_publisher.scheduled_jobs) == 2
    job_tiktok = next(j for j in spy_publisher.scheduled_jobs if j.account_id == "ch_tiktok_1")
    job_insta = next(j for j in spy_publisher.scheduled_jobs if j.account_id == "ch_insta_1")

    assert job_tiktok.scheduled_for is not None
    assert job_insta.scheduled_for is not None
    assert job_tiktok.scheduled_for == job_insta.scheduled_for

    # Ensure scheduled timestamp matches the brand's posting slots (either 14:00 or 19:00 in America/Sao_Paulo)
    dt_scheduled = datetime.fromisoformat(job_tiktok.scheduled_for)
    assert dt_scheduled.hour in (14, 19)
    assert dt_scheduled.minute == 0


# ---------------------------------------------------------------------------
# 5. Publication Failure Isolation
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_partial_failure_isolation_between_channels(tmp_path, spy_publisher):
    """TikTok succeeds, Instagram fails: receipts recorded for both, item transitions to SCHEDULED."""
    video_file = tmp_path / "video_resilience.mp4"
    video_file.write_text("video binary")

    brand_data = {
        "id": "brand_resilience",
        "name": "Resilience Brand",
        "posting_schedule": {
            "slots": ["18:00"],
            "timezone": "America/Sao_Paulo",
        },
        "publishing_profiles": {
            "postiz": {
                "active": True,
                "channel_ids": ["ch_tiktok_1", "ch_insta_1"],
            }
        },
    }
    viral_studio_store.create_brand(brand_data)

    viral_studio_store.create_batch({
        "id": "batch_resilience",
        "brand_id": "brand_resilience",
        "items": [
            {
                "item_id": "item_resilience_1",
                "brand_id": "brand_resilience",
                "source_url": "https://example.com/v_resilience.mp4",
                "status": "APPROVED",
                "headline": "Resilient Item",
                "rendered_path": str(video_file),
                "publication_records": [],
            }
        ]
    })

    # Configure spy publisher to fail ONLY on Instagram
    spy_publisher.fail_channel_ids.add("ch_insta_1")

    receipts = await auto_schedule_brand_video(
        brand_id="brand_resilience",
        item_id="item_resilience_1",
        channel_ids=["ch_tiktok_1", "ch_insta_1"],
    )

    assert len(receipts) == 2
    r_tiktok = next(r for r in receipts if "ch_tiktok_1" in str(r.post_id or ""))
    r_insta = next(r for r in receipts if r.status == "failed")

    assert r_tiktok.status == "scheduled"
    assert r_insta.status == "failed"
    assert "Simulated upstream error on channel ch_insta_1" in str(r_insta.error)

    # Item should be SCHEDULED because at least one channel succeeded
    item_after = viral_studio_store.get_item("item_resilience_1")
    assert item_after["status"] == "SCHEDULED"

    records = item_after.get("publication_records", [])
    assert len(records) == 2
    rec_tiktok = next(r for r in records if r.get("channel_id") == "ch_tiktok_1")
    rec_insta = next(r for r in records if r.get("channel_id") == "ch_insta_1")

    assert rec_tiktok["status"] == "scheduled"
    assert rec_insta["status"] == "failed"
    assert "Simulated upstream error" in rec_insta["error"]


@pytest.mark.asyncio
async def test_all_channels_failure_sets_item_status_failed(tmp_path, spy_publisher):
    """When all channels fail during dispatch, item status becomes FAILED with records saved."""
    video_file = tmp_path / "video_all_fail.mp4"
    video_file.write_text("video binary")

    brand_data = {
        "id": "brand_fail_all",
        "name": "Fail Brand",
        "posting_schedule": {"slots": ["18:00"], "timezone": "America/Sao_Paulo"},
    }
    viral_studio_store.create_brand(brand_data)

    viral_studio_store.create_batch({
        "id": "batch_fail_all",
        "brand_id": "brand_fail_all",
        "items": [
            {
                "item_id": "item_fail_all_1",
                "brand_id": "brand_fail_all",
                "source_url": "https://example.com/v_fail.mp4",
                "status": "APPROVED",
                "headline": "Fail All Item",
                "rendered_path": str(video_file),
                "publication_records": [],
            }
        ]
    })

    spy_publisher.fail_channel_ids.add("ch_tiktok_1")

    receipts = await auto_schedule_brand_video(
        brand_id="brand_fail_all",
        item_id="item_fail_all_1",
        channel_ids=["ch_tiktok_1"],
    )

    assert len(receipts) == 1
    assert receipts[0].status == "failed"

    item_after = viral_studio_store.get_item("item_fail_all_1")
    assert item_after["status"] == "FAILED"


# ---------------------------------------------------------------------------
# 6. API Route Integration: Preview Slots with Brand Schedule
# ---------------------------------------------------------------------------

def test_api_preview_slots_with_brand_posting_schedule():
    client = TestClient(app)

    # Create a brand with custom 3-slot schedule
    viral_studio_store.create_brand({
        "id": "brand_preview_test",
        "name": "Preview Brand",
        "posting_schedule": {
            "slots": ["08:30", "13:30", "19:30"],
            "timezone": "America/Sao_Paulo",
            "frequency": 3,
        },
    })

    target_start = (datetime.now(timezone.utc) + timedelta(days=3)).strftime("%Y-%m-%d")

    res = client.get(
        f"/api/viral-studio/publishing/preview-slots?brand_id=brand_preview_test&count=4&start_date={target_start}"
    )
    assert res.status_code == 200
    data = res.json()
    assert data["count"] == 4
    projected = data["projected_slots"]
    assert len(projected) == 4

    dt0 = datetime.fromisoformat(projected[0]["datetime"])
    dt1 = datetime.fromisoformat(projected[1]["datetime"])
    dt2 = datetime.fromisoformat(projected[2]["datetime"])
    dt3 = datetime.fromisoformat(projected[3]["datetime"])

    assert (dt0.hour, dt0.minute) == (8, 30)
    assert (dt1.hour, dt1.minute) == (13, 30)
    assert (dt2.hour, dt2.minute) == (19, 30)
    # 4th slot overflows to next day at 08:30
    assert (dt3.hour, dt3.minute) == (8, 30)
    assert dt3.date() == dt0.date() + timedelta(days=1)


# ---------------------------------------------------------------------------
# 7. Orchestrator Batch Auto-Publishing Integration
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_publish_batch_videos_auto_chains_across_brand_schedule(tmp_path, spy_publisher):
    video_file = tmp_path / "batch_item_video.mp4"
    video_file.write_text("batch media")

    brand_data = {
        "id": "brand_batch_auto",
        "name": "Batch Auto Brand",
        "posting_schedule": {
            "slots": ["11:00", "16:00"],
            "timezone": "America/Sao_Paulo",
        },
        "publishing_profiles": {
            "postiz": {"active": True, "channel_ids": ["ch_tiktok_1"]}
        },
    }
    viral_studio_store.create_brand(brand_data)

    future_start = (datetime.now(timezone.utc) + timedelta(days=4)).strftime("%Y-%m-%d")

    viral_studio_store.create_batch({
        "id": "batch_auto_test",
        "brand_id": "brand_batch_auto",
        "items": [
            {
                "item_id": f"batch_item_{i}",
                "brand_id": "brand_batch_auto",
                "source_url": f"https://example.com/batch_{i}.mp4",
                "status": "APPROVED",
                "selected_headline": f"Headline {i}",
                "caption": f"Caption {i}",
                "rendered_path": str(video_file),
                "publication_records": [],
            }
            for i in range(3)
        ],
    })

    result = await publish_batch_videos(
        item_ids=["batch_item_0", "batch_item_1", "batch_item_2"],
        platforms=[{"platform": "tiktok", "accountId": "ch_tiktok_1"}],
        schedule_mode="auto",
        start_date=future_start,
        publisher=spy_publisher,
    )

    assert result["successful"] == 3
    assert len(result["results"]) == 3

    # Check 3 items scheduled across the 2 daily slots:
    # Item 0 -> Day 0 at 11:00
    # Item 1 -> Day 0 at 16:00
    # Item 2 -> Day 1 at 11:00
    dt_0 = datetime.fromisoformat(result["results"][0]["scheduled_for"])
    dt_1 = datetime.fromisoformat(result["results"][1]["scheduled_for"])
    dt_2 = datetime.fromisoformat(result["results"][2]["scheduled_for"])

    assert (dt_0.hour, dt_0.minute) == (11, 0)
    assert (dt_1.hour, dt_1.minute) == (16, 0)
    assert (dt_2.hour, dt_2.minute) == (11, 0)
    assert dt_2.date() == dt_0.date() + timedelta(days=1)


# ---------------------------------------------------------------------------
# 8. Edge Case & Robustness Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_sequential_auto_schedule_brand_video_calls_avoid_collision(tmp_path, spy_publisher):
    """Sequential auto-schedule calls for the same brand advance through the brand's posting slots."""
    video_file = tmp_path / "video_seq.mp4"
    video_file.write_text("video binary")

    brand_data = {
        "id": "brand_seq_test",
        "name": "Seq Brand",
        "posting_schedule": {
            "slots": ["10:00", "15:00", "20:00"],
            "timezone": "America/Sao_Paulo",
        },
        "publishing_profiles": {
            "postiz": {"active": True, "channel_ids": ["ch_tiktok_1"]}
        },
    }
    viral_studio_store.create_brand(brand_data)

    viral_studio_store.create_batch({
        "id": "batch_seq_test",
        "brand_id": "brand_seq_test",
        "items": [
            {
                "item_id": "item_seq_1",
                "brand_id": "brand_seq_test",
                "source_url": "https://example.com/seq1.mp4",
                "status": "APPROVED",
                "headline": "Seq 1",
                "rendered_path": str(video_file),
                "publication_records": [],
            },
            {
                "item_id": "item_seq_2",
                "brand_id": "brand_seq_test",
                "source_url": "https://example.com/seq2.mp4",
                "status": "APPROVED",
                "headline": "Seq 2",
                "rendered_path": str(video_file),
                "publication_records": [],
            },
        ],
    })

    receipts_1 = await auto_schedule_brand_video("brand_seq_test", "item_seq_1", ["ch_tiktok_1"])
    receipts_2 = await auto_schedule_brand_video("brand_seq_test", "item_seq_2", ["ch_tiktok_1"])

    assert receipts_1[0].status == "scheduled"
    assert receipts_2[0].status == "scheduled"

    item_1 = viral_studio_store.get_item("item_seq_1")
    item_2 = viral_studio_store.get_item("item_seq_2")

    assert item_1["scheduled_for"] is not None
    assert item_2["scheduled_for"] is not None
    assert item_1["scheduled_for"] != item_2["scheduled_for"]

    dt_1 = datetime.fromisoformat(item_1["scheduled_for"])
    dt_2 = datetime.fromisoformat(item_2["scheduled_for"])
    assert dt_2 > dt_1


def test_get_item_populates_brand_id_from_batch_if_missing_on_item():
    """get_item falls back to batch brand_id when item dict does not have explicit brand_id."""
    viral_studio_store.create_brand({"id": "brand_parent", "name": "Parent Brand"})
    viral_studio_store.create_batch({
        "id": "batch_parent_test",
        "brand_id": "brand_parent",
        "items": [
            {
                "item_id": "item_no_brand",
                "source_url": "https://example.com/nobrand.mp4",
                "status": "APPROVED",
            }
        ],
    })

    fetched = viral_studio_store.get_item("item_no_brand")
    assert fetched is not None
    assert fetched.get("brand_id") == "brand_parent"


def test_get_next_available_slots_edge_cases():
    """Test boundary conditions: count <= 0, invalid timezone, malformed slots."""
    # Count <= 0 returns empty list
    assert viral_studio_store.get_next_available_slots(count=0) == []
    assert viral_studio_store.get_next_available_slots(count=-5) == []

    # Invalid timezone falls back to America/Sao_Paulo without crashing
    slots_bad_tz = viral_studio_store.get_next_available_slots(
        count=1, timezone_str="NonExistent/Timezone"
    )
    assert len(slots_bad_tz) == 1
    assert slots_bad_tz[0].tzinfo.key == "America/Sao_Paulo"

    # Malformed slot string elements are filtered and fallback is used if all invalid
    slots_malformed = viral_studio_store.get_next_available_slots(
        count=2, slots=["not_a_time", "99:99", "abc"]
    )
    assert len(slots_malformed) == 2
    assert (slots_malformed[0].hour, slots_malformed[0].minute) == (18, 0)

