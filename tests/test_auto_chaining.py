from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import pytest

from clippyme.domain import viral_studio_store
from clippyme.domain.errors import NotFoundError, ValidationError


@pytest.fixture(autouse=True)
def setup_store(tmp_path, monkeypatch):
    store_dir = str(tmp_path / "viral_studio")
    viral_studio_store.set_store_dir(store_dir)
    viral_studio_store.reset_store()
    viral_studio_store.seed_defaults(force=True)
    yield
    viral_studio_store.reset_store()


def test_get_next_available_slots_empty_store():
    tz = ZoneInfo("America/Sao_Paulo")
    now = datetime.now(tz)

    slots = viral_studio_store.get_next_available_slots(
        account_id="acc_tiktok_01",
        count=3,
        preferred_time="18:00",
        timezone_str="America/Sao_Paulo",
    )

    assert len(slots) == 3
    # Check that slots are in ascending consecutive order
    for idx, slot in enumerate(slots):
        assert slot.tzinfo is not None
        assert slot.hour == 18
        assert slot.minute == 0
        if idx > 0:
            assert slot.date() == slots[idx - 1].date() + timedelta(days=1)
        assert slot > now


def test_get_next_available_slots_with_occupied_dates():
    tz = ZoneInfo("America/Sao_Paulo")
    now = datetime.now(tz)
    today = now.date()
    tomorrow = today + timedelta(days=1)
    day_after = today + timedelta(days=2)

    # Seed a batch with scheduled items for today, tomorrow, and day after for account_id="acc_tiktok_01"
    _ = viral_studio_store.create_batch(
        {
            "brand_id": "vale-o-clique",
            "items": [
                {
                    "item_id": "item-0",
                    "source_url": "https://example.com/v0.mp4",
                    "status": "SCHEDULED",
                    "account_id": "acc_tiktok_01",
                    "scheduled_for": f"{today.isoformat()}T18:00:00-03:00",
                },
                {
                    "item_id": "item-1",
                    "source_url": "https://example.com/v1.mp4",
                    "status": "SCHEDULED",
                    "account_id": "acc_tiktok_01",
                    "scheduled_for": f"{tomorrow.isoformat()}T18:00:00-03:00",
                },
                {
                    "item_id": "item-2",
                    "source_url": "https://example.com/v2.mp4",
                    "status": "SCHEDULED",
                    "account_id": "acc_tiktok_01",
                    "scheduled_for": f"{day_after.isoformat()}T18:00:00-03:00",
                },
            ],
        }
    )

    # New projection for the same account should auto-chain starting on the 3rd day after today (day_after + 1)
    slots = viral_studio_store.get_next_available_slots(
        account_id="acc_tiktok_01",
        count=2,
        preferred_time="18:00",
        timezone_str="America/Sao_Paulo",
    )

    assert len(slots) == 2
    expected_first_slot_date = day_after + timedelta(days=1)
    assert slots[0].date() == expected_first_slot_date
    assert slots[1].date() == expected_first_slot_date + timedelta(days=1)

    # A different account shouldn't be blocked by acc_tiktok_01's occupied dates
    other_slots = viral_studio_store.get_next_available_slots(
        account_id="acc_instagram_02",
        count=2,
        preferred_time="18:00",
        timezone_str="America/Sao_Paulo",
    )
    assert len(other_slots) == 2
    # The first slot for the new account will be today (if before 18:00) or tomorrow
    assert other_slots[0].date() <= tomorrow


def test_get_next_available_slots_with_start_date():
    target_future_date = (datetime.now(timezone.utc) + timedelta(days=10)).strftime("%Y-%m-%d")

    slots = viral_studio_store.get_next_available_slots(
        account_id="acc_01",
        count=3,
        preferred_time="20:30",
        start_date=target_future_date,
        timezone_str="America/Sao_Paulo",
    )

    assert len(slots) == 3
    assert slots[0].strftime("%Y-%m-%d") == target_future_date
    assert slots[0].hour == 20
    assert slots[0].minute == 30


def test_cancel_item_schedule_flow():
    # Create batch with a scheduled item
    _ = viral_studio_store.create_batch(
        {
            "brand_id": "vale-o-clique",
            "items": [
                {
                    "item_id": "item-cancel-1",
                    "source_url": "https://example.com/vcancel.mp4",
                    "status": "SCHEDULED",
                    "scheduled_for": "2026-09-28T18:00:00-03:00",
                    "publication_records": [
                        {"key": "test_key", "status": "scheduled", "post_id": "post_123"}
                    ],
                }
            ],
        }
    )

    # Cancel schedule
    cancelled_item = viral_studio_store.cancel_item_schedule("item-cancel-1")
    assert cancelled_item["status"] == "APPROVED"
    assert cancelled_item["scheduled_for"] is None

    # Check publication record status updated
    assert cancelled_item["publication_records"][0]["status"] == "cancelled"

    # Verify audit log added
    audit_logs = [log for log in cancelled_item.get("logs", []) if log.get("type") == "AUDIT"]
    assert len(audit_logs) >= 1
    assert "cancelado" in audit_logs[-1]["message"].lower()

    # Cancelling an already approved item raises ValidationError
    with pytest.raises(ValidationError):
        viral_studio_store.cancel_item_schedule("item-cancel-1")

    # Cancelling non-existent item raises NotFoundError
    with pytest.raises(NotFoundError):
        viral_studio_store.cancel_item_schedule("non-existent-item")


def test_gap_filling_when_intermediate_posts_cancelled():
    """Validates the exact scenario where posts on intermediate days (e.g. Day 1 and Day 2)
    are cancelled while posts further out (e.g. Day 3 to Day 8) remain scheduled.
    The intelligent scheduler must fill the freed gaps first before appending past the end of the queue.
    """
    tz = ZoneInfo("America/Sao_Paulo")
    now = datetime.now(tz)
    today = now.date()

    # Create scheduled items spanning from today (Day 0) to Day 7
    days = [today + timedelta(days=i) for i in range(8)]
    items_payload = [
        {
            "item_id": f"item-seq-{i}",
            "source_url": f"https://example.com/v{i}.mp4",
            "status": "SCHEDULED",
            "account_id": "acc_gap_user_test",
            "scheduled_for": f"{days[i].isoformat()}T18:00:00-03:00",
        }
        for i in range(8)
    ]

    _ = viral_studio_store.create_batch(
        {
            "brand_id": "vale-o-clique",
            "items": items_payload,
        }
    )

    # Cancel Day 1 and Day 2 (e.g. tomorrow and the day after)
    viral_studio_store.cancel_item_schedule("item-seq-1")
    viral_studio_store.cancel_item_schedule("item-seq-2")

    # Request 4 slots:
    # - Slot 0 should fill Day 1 (gap 1)
    # - Slot 1 should fill Day 2 (gap 2)
    # - Day 3, 4, 5, 6, 7 are occupied -> should be skipped!
    # - Slot 2 should land on Day 8 (today + 8 days)
    # - Slot 3 should land on Day 9 (today + 9 days)
    slots = viral_studio_store.get_next_available_slots(
        account_id="acc_gap_user_test",
        count=4,
        preferred_time="18:00",
        timezone_str="America/Sao_Paulo",
    )

    assert len(slots) == 4
    assert slots[0].date() == days[1], f"Expected slot 0 to fill gap on {days[1]}, got {slots[0].date()}"
    assert slots[1].date() == days[2], f"Expected slot 1 to fill gap on {days[2]}, got {slots[1].date()}"
    assert slots[2].date() == days[7] + timedelta(days=1), f"Expected slot 2 to append after end on {days[7] + timedelta(days=1)}, got {slots[2].date()}"
    assert slots[3].date() == days[7] + timedelta(days=2), f"Expected slot 3 to append on {days[7] + timedelta(days=2)}, got {slots[3].date()}"


