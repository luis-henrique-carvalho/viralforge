"""Host tests for Viral Studio publishing orchestrator and API endpoints."""
import pytest
from fastapi.testclient import TestClient

from clippyme.api.app import app
from clippyme.domain import viral_studio_orchestrator, viral_studio_store
from clippyme.domain.mock_publisher_adapter import MockPublisherAdapter
from clippyme.domain.social_publisher_port import set_social_publisher


@pytest.fixture(autouse=True)
def setup_env_and_store(tmp_path):
    store_dir = str(tmp_path / "viral_studio")
    viral_studio_store.set_store_dir(store_dir)
    viral_studio_store.reset_store()
    viral_studio_store.seed_defaults(force=True)

    adapter = MockPublisherAdapter()
    set_social_publisher(adapter)

    yield adapter

    viral_studio_store.reset_store()
    set_social_publisher(None)


@pytest.mark.asyncio
async def test_publish_viral_items_auto_chaining(tmp_path, setup_env_and_store):
    adapter = setup_env_and_store

    video_file = tmp_path / "rendered.mp4"
    video_file.write_bytes(b"dummy mp4 data")

    # Create batch with 2 APPROVED items
    _ = viral_studio_store.create_batch(
        {
            "brand_id": "vale-o-clique",
            "items": [
                {
                    "item_id": "item-auto-1",
                    "source_url": "https://example.com/va1.mp4",
                    "status": "APPROVED",
                    "rendered_path": str(video_file),
                    "selected_headline": "Super Promo 1",
                    "caption": "Compre agora!",
                },
                {
                    "item_id": "item-auto-2",
                    "source_url": "https://example.com/va2.mp4",
                    "status": "APPROVED",
                    "rendered_path": str(video_file),
                    "selected_headline": "Super Promo 2",
                    "caption": "Confira no link!",
                },
            ],
        }
    )

    result = await viral_studio_orchestrator.publish_viral_items(
        item_ids=["item-auto-1", "item-auto-2"],
        platforms=[{"platform": "tiktok", "accountId": "acc_chain_1"}],
        schedule_mode="auto",
        publisher=adapter,
    )

    assert result["total"] == 2
    assert result["successful"] == 2
    assert result["failed"] == 0

    item1 = viral_studio_store.get_item_or_raise("item-auto-1")
    item2 = viral_studio_store.get_item_or_raise("item-auto-2")

    assert item1["status"] == "SCHEDULED"
    assert item2["status"] == "SCHEDULED"
    assert item1["scheduled_for"] is not None
    assert item2["scheduled_for"] is not None
    assert item1["scheduled_for"] != item2["scheduled_for"]


@pytest.mark.asyncio
async def test_cancel_item_schedule_orchestrator(tmp_path, setup_env_and_store):
    adapter = setup_env_and_store

    video_file = tmp_path / "rendered.mp4"
    video_file.write_bytes(b"dummy mp4 data")

    _ = viral_studio_store.create_batch(
        {
            "brand_id": "vale-o-clique",
            "items": [
                {
                    "item_id": "item-to-cancel",
                    "source_url": "https://example.com/vcancel.mp4",
                    "status": "APPROVED",
                    "rendered_path": str(video_file),
                }
            ],
        }
    )

    # Schedule item
    await viral_studio_orchestrator.publish_viral_items(
        item_ids=["item-to-cancel"],
        platforms=[{"platform": "instagram", "accountId": "acc_ig_1"}],
        schedule_mode="auto",
        publisher=adapter,
    )

    item = viral_studio_store.get_item_or_raise("item-to-cancel")
    assert item["status"] == "SCHEDULED"
    post_id = item["post_id"]

    # Cancel via orchestrator
    updated_item = await viral_studio_orchestrator.cancel_item_schedule("item-to-cancel", publisher=adapter)
    assert updated_item["status"] == "APPROVED"
    assert updated_item["scheduled_for"] is None

    # Check mock adapter post status is cancelled
    status = await adapter.get_status(post_id)
    assert status.status == "cancelled"


def test_api_publishing_endpoints(tmp_path, setup_env_and_store):
    client = TestClient(app)

    # 1. GET /api/viral-studio/publishing/accounts
    res_accounts = client.get("/api/viral-studio/publishing/accounts")
    assert res_accounts.status_code == 200
    accounts = res_accounts.json()
    assert len(accounts) >= 3

    # 2. GET /api/viral-studio/publishing/preview-slots
    res_slots = client.get(
        "/api/viral-studio/publishing/preview-slots",
        params={"account_id": "acc_01", "count": 3, "preferred_time": "18:00"},
    )
    assert res_slots.status_code == 200
    slots_data = res_slots.json()
    assert slots_data["count"] == 3
    assert len(slots_data["projected_slots"]) == 3
    assert "18:00" in slots_data["projected_slots"][0]["formatted"]

    # 3. POST /api/viral-studio/publish and POST /api/viral-studio/publishing/{item_id}/cancel
    video_file = tmp_path / "rendered_api.mp4"
    video_file.write_bytes(b"dummy video")

    _ = viral_studio_store.create_batch(
        {
            "brand_id": "vale-o-clique",
            "items": [
                {
                    "item_id": "item-api-1",
                    "source_url": "https://example.com/vapi.mp4",
                    "status": "APPROVED",
                    "rendered_path": str(video_file),
                }
            ],
        }
    )

    publish_payload = {
        "item_ids": ["item-api-1"],
        "platforms": [{"platform": "youtube", "accountId": "acc_yt"}],
        "schedule_mode": "auto",
    }
    res_pub = client.post("/api/viral-studio/publish", json=publish_payload)
    assert res_pub.status_code == 200
    pub_json = res_pub.json()
    assert pub_json["successful"] == 1
    assert pub_json["results"][0]["status"] == "scheduled"

    # Cancel via API
    res_cancel = client.post("/api/viral-studio/publishing/item-api-1/cancel")
    assert res_cancel.status_code == 200
    cancel_json = res_cancel.json()
    assert cancel_json["status"] == "APPROVED"
    assert cancel_json["scheduled_for"] is None
