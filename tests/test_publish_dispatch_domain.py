"""Unit tests for PublishDispatchService and asynchronous publishing queue.

Verifies:
1. enqueue_dispatch creates a QUEUED job and launches background execution.
2. Publication failures do NOT change item.status to FAILED (status stays APPROVED).
3. Partial failures and complete failures record granular receipts.
4. 1-Click retry re-enqueues only failed channels to prevent duplicate posting.
5. cancel_scheduled_post cancels on provider and resets item state.
6. Auto-healing of legacy items with rendered video files.
7. Scheduled timeline normalizes missing post IDs without HTTP 500 error.
"""
import json
import os
import stat
import pytest

from clippyme.api.viral_studio_schemas import ScheduledTimelinePost, ScheduledTimelineResponse
from clippyme.domain import viral_studio_store
from clippyme.domain.publish_dispatch_service import (
    DispatchJob,
    PublishDispatchService,
)
from clippyme.domain.social_publisher_port import (
    PublicationReceipt,
    SocialChannel,
    SocialPublisherPort,
)


class FakePublisher(SocialPublisherPort):
    def __init__(
        self,
        should_fail: bool = False,
        fail_accounts: set = None,
        error_msg: str = "Connection timeout",
    ):
        self.should_fail = should_fail
        self.fail_accounts = fail_accounts or set()
        self.error_msg = error_msg
        self.scheduled_calls = []
        self.cancelled_calls = []

    async def publish(self, job):
        return await self.schedule(job)

    async def schedule(self, job):
        self.scheduled_calls.append(job)
        if self.should_fail or (job.account_id in self.fail_accounts):
            raise RuntimeError(self.error_msg)
        return PublicationReceipt(
            item_id=job.item_id,
            status="scheduled",
            post_id=f"post_{job.account_id}_123",
            platform_post_id=f"rel_{job.account_id}",
            scheduled_for=job.scheduled_for,
            post_url="https://instagram.com/p/123",
        )

    async def cancel(self, external_id):
        self.cancelled_calls.append(external_id)
        return True

    async def get_status(self, external_id):
        return PublicationReceipt(item_id="", status="scheduled", post_id=external_id)

    async def list_accounts(self, **kwargs):
        return [
            SocialChannel(id="acc_1", platform="instagram", name="Test Insta", connected=True),
            SocialChannel(id="acc_2", platform="tiktok", name="Test TikTok", connected=True),
        ]

    async def list_workspaces(self):
        return []

    async def ensure_brand_workspace(self, brand_name, brand_id):
        return None

    async def find_next_slot(self, channel_id):
        return None

    async def list_scheduled(self, customer_id, start_date, end_date):
        return []

    async def get_connect_channel_url(self, brand_id=None):
        return ""

    async def get_metrics(self, external_id):
        return {}


@pytest.fixture
def mock_brand_and_video(tmp_path, monkeypatch):
    """Fixture providing a mock brand and a batch with a rendered video file."""
    brands_file = str(tmp_path / "brands.json")
    batches_file = str(tmp_path / "batches.json")
    queue_file = str(tmp_path / "dispatch_queue.json")

    monkeypatch.setattr("clippyme.domain.viral_studio_store.BRANDS_FILE", brands_file)
    monkeypatch.setattr("clippyme.domain.viral_studio_store.BATCHES_FILE", batches_file)
    monkeypatch.setattr("clippyme.domain.publish_dispatch_service.DISPATCH_QUEUE_PATH", queue_file)

    # Create dummy video file
    video_dir = tmp_path / "output" / "batch_1" / "item_1"
    video_dir.mkdir(parents=True, exist_ok=True)
    video_path = video_dir / "rendered.mp4"
    video_path.write_bytes(b"mock video binary 12345")

    brands_data = {
        "test_brand": {
            "id": "test_brand",
            "name": "Test Brand",
            "handle": "@test_brand",
            "posting_schedule": {
                "slots": ["10:00", "18:00"],
                "timezone": "America/Sao_Paulo",
            },
            "publishing_profiles": {
                "active_provider": "mock",
            },
        }
    }
    with open(brands_file, "w") as f:
        json.dump(brands_data, f)

    batches_data = {
        "batch_1": {
            "id": "batch_1",
            "brand_id": "test_brand",
            "items": [
                {
                    "id": "item_1",
                    "item_id": "item_1",
                    "batch_id": "batch_1",
                    "brand_id": "test_brand",
                    "status": "APPROVED",
                    "rendered_path": str(video_path),
                    "selected_headline": "Headline Test",
                    "caption": "Caption Test",
                    "publication_records": [],
                }
            ],
        }
    }
    with open(batches_file, "w") as f:
        json.dump(batches_data, f)

    return "test_brand", "item_1", str(video_path)


@pytest.mark.asyncio
async def test_enqueue_dispatch_success(mock_brand_and_video):
    brand_id, item_id, _ = mock_brand_and_video
    fake_publisher = FakePublisher(should_fail=False)
    service = PublishDispatchService(publisher=fake_publisher)

    job = await service.enqueue_dispatch(
        brand_id=brand_id,
        item_id=item_id,
        channel_ids=["acc_1"],
        spawn_background=False,
    )

    assert job.status == "QUEUED"
    assert job.item_id == item_id
    assert job.brand_id == brand_id
    assert job.scheduled_for is not None

    # Run processing
    await service._process_dispatch_job(job.job_id)

    # Verify item status updated to SCHEDULED
    item, _, _ = viral_studio_store.find_item_batch(item_id)
    assert item["status"] == "SCHEDULED"
    assert len(item["publication_records"]) == 1
    assert item["publication_records"][0]["status"] == "scheduled"
    assert item["publication_records"][0]["post_id"] == "post_acc_1_123"


@pytest.mark.asyncio
async def test_dispatch_failure_keeps_item_approved_never_failed(mock_brand_and_video):
    brand_id, item_id, _ = mock_brand_and_video
    fake_publisher = FakePublisher(should_fail=True, error_msg="Network error connecting to Postiz at https://ngrok: Timeout")
    service = PublishDispatchService(publisher=fake_publisher)

    job = await service.enqueue_dispatch(
        brand_id=brand_id,
        item_id=item_id,
        channel_ids=["acc_1"],
        spawn_background=False,
    )

    # Run processing
    await service._process_dispatch_job(job.job_id)

    # Verify CRUCIAL RULE: item status MUST REMAIN APPROVED, NEVER FAILED
    item, _, _ = viral_studio_store.find_item_batch(item_id)
    assert item["status"] == "APPROVED"
    assert len(item["publication_records"]) == 1
    assert item["publication_records"][0]["status"] == "failed"
    assert "Timeout" in item["publication_records"][0]["error"]


@pytest.mark.asyncio
async def test_retry_channel_dispatch_isolated_no_duplicate(mock_brand_and_video):
    """Verify that retrying a partial failed dispatch only retries the failed channel."""
    brand_id, item_id, _ = mock_brand_and_video
    # acc_1 succeeds, acc_2 fails
    fake_publisher = FakePublisher(fail_accounts={"acc_2"}, error_msg="TikTok API rate limit")
    service = PublishDispatchService(publisher=fake_publisher)

    job = await service.enqueue_dispatch(
        brand_id=brand_id,
        item_id=item_id,
        channel_ids=["acc_1", "acc_2"],
        spawn_background=False,
    )
    await service._process_dispatch_job(job.job_id)

    # Job is PARTIAL_FAILED
    queue = service.list_dispatches()
    assert queue[0].status == "PARTIAL_FAILED"
    assert len(fake_publisher.scheduled_calls) == 2

    # Now fix failure for acc_2 and retry
    fake_publisher.fail_accounts.clear()
    fake_publisher.scheduled_calls.clear()

    # Retry should automatically target ONLY the failed channel (acc_2), not duplicating acc_1
    retried_job = await service.retry_dispatch(job.job_id, spawn_background=False)
    assert retried_job.channel_ids == ["acc_2"]

    await service._process_dispatch_job(retried_job.job_id)
    assert len(fake_publisher.scheduled_calls) == 1
    assert fake_publisher.scheduled_calls[0].account_id == "acc_2"


@pytest.mark.asyncio
async def test_cancel_scheduled_post(mock_brand_and_video):
    brand_id, item_id, _ = mock_brand_and_video
    fake_publisher = FakePublisher(should_fail=False)
    service = PublishDispatchService(publisher=fake_publisher)

    job = await service.enqueue_dispatch(
        brand_id=brand_id,
        item_id=item_id,
        channel_ids=["acc_1"],
        spawn_background=False,
    )
    await service._process_dispatch_job(job.job_id)

    # Cancel post
    cancelled = await service.cancel_scheduled_post(brand_id=brand_id, post_id="post_acc_1_123")
    assert cancelled is True
    assert "post_acc_1_123" in fake_publisher.cancelled_calls

    item, _, _ = viral_studio_store.find_item_batch(item_id)
    assert item["status"] == "APPROVED"


def test_auto_heal_legacy_failed_items(mock_brand_and_video):
    """Test that items previously marked FAILED but having valid rendered_path are auto-healed to APPROVED."""
    _, item_id, _ = mock_brand_and_video

    # Corrupt status to FAILED in store
    viral_studio_store.update_item(item_id=item_id, updates={"status": "FAILED"})

    # Trigger load
    batches = viral_studio_store.list_batches()
    item = next(i for b in batches for i in b.get("items", []) if i.get("id") == item_id)
    assert item["status"] == "APPROVED"


def test_outbox_queue_file_permissions(mock_brand_and_video):
    """Verify that dispatch queue file is persisted with 0o600 mode."""
    from clippyme.domain.publish_dispatch_service import _save_queue_sync, DISPATCH_QUEUE_PATH
    _save_queue_sync({"test": {"job_id": "test"}})

    file_stat = os.stat(DISPATCH_QUEUE_PATH)
    mode = stat.S_IMODE(file_stat.st_mode)
    assert mode == 0o600


def test_scheduled_timeline_post_handles_none_id_safely():
    """Verify that posts with null/missing IDs from provider do not cause 500 validation error."""
    raw_post_none_id = {
        "id": None,
        "post_id": None,
        "title": "Post without ID",
        "date": "2026-09-28T18:00:00Z",
    }
    model = ScheduledTimelinePost.model_validate(raw_post_none_id)
    assert model.id is not None
    assert len(model.id) > 0
    assert model.status == "scheduled"
    assert model.scheduled_for == "2026-09-28T18:00:00Z"

    resp = ScheduledTimelineResponse(brand_id="test_brand", posts=[model], total=1)
    assert resp.total == 1
    assert resp.posts[0].id == model.id


@pytest.mark.asyncio
async def test_auto_schedule_brand_with_none_posting_schedule(mock_brand_and_video):
    """Verify that a brand with posting_schedule: None does not throw AttributeError."""
    brand_id, item_id, _ = mock_brand_and_video
    fake_publisher = FakePublisher(should_fail=False)
    service = PublishDispatchService(publisher=fake_publisher)

    # Corrupt brand schedule to None
    brand = viral_studio_store.get_brand(brand_id)
    brand["posting_schedule"] = None
    viral_studio_store.update_brand(brand_id, brand)

    job = await service.enqueue_dispatch(
        brand_id=brand_id,
        item_id=item_id,
        channel_ids=["acc_1"],
        spawn_background=False,
    )
    assert job.status == "QUEUED"
    await service._process_dispatch_job(job.job_id)
    assert len(fake_publisher.scheduled_calls) == 1


@pytest.mark.asyncio
async def test_rapid_consecutive_auto_schedule_assigns_distinct_slots(mock_brand_and_video, tmp_path):
    """Rapid consecutive auto-schedule calls must reserve and increment slots without collision."""
    brand_id, item_id_1, video_path = mock_brand_and_video
    fake_publisher = FakePublisher(should_fail=False)
    service = PublishDispatchService(publisher=fake_publisher)

    # Add 2 more items to the batch
    batches = viral_studio_store._load_batches_locked()
    batch = list(batches.values())[0]
    batch["items"].extend([
        {"id": "item_2", "status": "APPROVED", "rendered_path": video_path},
        {"id": "item_3", "status": "APPROVED", "rendered_path": video_path},
    ])
    viral_studio_store._atomic_write_json(viral_studio_store.get_batches_path(), batches)

    # Configure brand with 3 slots
    brand = viral_studio_store.get_brand(brand_id)
    brand["posting_schedule"] = {
        "frequency": 3,
        "slots": ["10:00", "15:00", "20:00"],
        "timezone": "America/Sao_Paulo",
    }
    viral_studio_store.update_brand(brand_id, brand)

    # Enqueue 3 items in rapid succession without processing yet
    job1 = await service.enqueue_dispatch(brand_id=brand_id, item_id=item_id_1, channel_ids=["acc_1"], spawn_background=False)
    job2 = await service.enqueue_dispatch(brand_id=brand_id, item_id="item_2", channel_ids=["acc_1"], spawn_background=False)
    job3 = await service.enqueue_dispatch(brand_id=brand_id, item_id="item_3", channel_ids=["acc_1"], spawn_background=False)

    # All 3 scheduled_for slots must be distinct
    slots = [job1.scheduled_for, job2.scheduled_for, job3.scheduled_for]
    assert len(set(slots)) == 3, f"Expected 3 distinct slots, got: {slots}"

    # Verify chronological sequence
    from datetime import datetime
    dt1 = datetime.fromisoformat(job1.scheduled_for)
    dt2 = datetime.fromisoformat(job2.scheduled_for)
    dt3 = datetime.fromisoformat(job3.scheduled_for)
    assert dt1 < dt2 < dt3


@pytest.mark.asyncio
async def test_recover_on_startup_resumes_interrupted_uploading_jobs(mock_brand_and_video):
    """Startup recovery must automatically detect and resume jobs interrupted during UPLOADING."""
    from clippyme.domain.publish_dispatch_service import _save_queue_sync, _load_queue_sync
    brand_id, item_id, _ = mock_brand_and_video
    fake_publisher = FakePublisher(should_fail=False)
    service = PublishDispatchService(publisher=fake_publisher)

    # Simulate an interrupted job left in UPLOADING state
    interrupted_job = DispatchJob(
        job_id="job_interrupted_upload",
        item_id=item_id,
        brand_id=brand_id,
        channel_ids=["acc_1"],
        status="UPLOADING",
        scheduled_for="2026-09-28T20:00:00-03:00",
        title="Interrupted Video",
    )
    _save_queue_sync({"job_interrupted_upload": interrupted_job.to_dict()})

    # Call recover_on_startup
    resumed = await service.recover_on_startup()
    assert resumed == 1

    # Give event loop a tick to process
    import asyncio
    await asyncio.sleep(0.1)

    # Job must now be finished and marked SCHEDULED
    q = _load_queue_sync()
    assert q["job_interrupted_upload"]["status"] == "SCHEDULED"
    assert len(fake_publisher.scheduled_calls) == 1


