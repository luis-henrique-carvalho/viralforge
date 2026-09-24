"""Tests for multi-brand batch distribution and BrandSyndication."""
import pytest
import uuid
from clippyme.domain import viral_studio_store, viral_studio_orchestrator
from clippyme.domain.mock_publisher_adapter import MockPublisherAdapter
from clippyme.domain.social_publisher_port import set_social_publisher
from clippyme.domain.errors import NotFoundError, ValidationError


@pytest.fixture(autouse=True)
def setup_store(tmp_path):
    store_dir = str(tmp_path / "viral_studio")
    viral_studio_store.set_store_dir(store_dir)
    viral_studio_store.reset_store()
    viral_studio_store.seed_defaults(force=True)

    # Seed an extra brand
    viral_studio_store.create_brand({
        "id": "achados-br",
        "name": "Achados Brasil",
        "handle": "@achadosbr",
        "publishing_profiles": {
            "instagram": {"account_id": "ig_achados", "platform": "instagram"},
            "tiktok": {"account_id": "tt_achados", "platform": "tiktok"},
        }
    })

    adapter = MockPublisherAdapter()
    set_social_publisher(adapter)

    yield adapter

    viral_studio_store.reset_store()
    set_social_publisher(None)


def test_create_batch_round_robin_distribution():
    batch = viral_studio_store.create_batch({
        "brand_ids": ["vale-o-clique", "achados-br"],
        "distribution_strategy": "round_robin",
        "items": [
            {"source_url": "https://example.com/v1.mp4"},
            {"source_url": "https://example.com/v2.mp4"},
            {"source_url": "https://example.com/v3.mp4"},
            {"source_url": "https://example.com/v4.mp4"},
        ],
    })

    items = batch["items"]
    assert len(items) == 4
    assert items[0]["brand_id"] == "vale-o-clique"
    assert items[1]["brand_id"] == "achados-br"
    assert items[2]["brand_id"] == "vale-o-clique"
    assert items[3]["brand_id"] == "achados-br"


def test_create_batch_sequential_distribution():
    batch = viral_studio_store.create_batch({
        "brand_ids": ["vale-o-clique", "achados-br"],
        "distribution_strategy": "sequential",
        "items": [
            {"source_url": "https://example.com/v1.mp4"},
            {"source_url": "https://example.com/v2.mp4"},
            {"source_url": "https://example.com/v3.mp4"},
            {"source_url": "https://example.com/v4.mp4"},
        ],
    })

    items = batch["items"]
    assert len(items) == 4
    # Sequential chunks: first 2 to brand 0, next 2 to brand 1
    assert items[0]["brand_id"] == "vale-o-clique"
    assert items[1]["brand_id"] == "vale-o-clique"
    assert items[2]["brand_id"] == "achados-br"
    assert items[3]["brand_id"] == "achados-br"


def test_create_batch_invalid_brand_rejected():
    with pytest.raises(NotFoundError, match="Brand not found"):
        viral_studio_store.create_batch({
            "brand_ids": ["vale-o-clique", "non-existent-brand"],
            "items": [{"source_url": "https://example.com/v1.mp4"}],
        })


@pytest.mark.asyncio
async def test_brand_syndication_omnichannel_and_partial_failure(tmp_path, setup_store):
    adapter = setup_store
    video_file = tmp_path / "rendered.mp4"
    video_file.write_bytes(b"dummy mp4 video")

    batch = viral_studio_store.create_batch({
        "brand_ids": ["achados-br"],
        "items": [
            {
                "item_id": "item-syndicate-1",
                "source_url": "https://example.com/syn1.mp4",
                "status": "APPROVED",
                "rendered_path": str(video_file),
                "selected_headline": "Super Promoção",
                "caption": "Aproveite agora!",
            }
        ],
    })

    item_id = "item-syndicate-1"

    # Simulate syndication to 2 connected accounts (Instagram and TikTok)
    res = await viral_studio_orchestrator.publish_viral_items(
        item_ids=[item_id],
        platforms=[],  # Empty platforms -> should resolve brand's publishing_profiles
        schedule_mode="now",
        publisher=adapter,
    )

    assert res["total"] == 2
    assert res["successful"] == 2
    assert res["failed"] == 0

    item = viral_studio_store.get_item_or_raise(item_id)
    assert item["status"] == "PUBLISHED"
    # Verify both publication records were saved
    assert len(item["publication_records"]) == 2
    platforms_published = {r.get("platform") for r in item["publication_records"]}
    assert "instagram" in platforms_published
    assert "tiktok" in platforms_published


def test_create_batch_sequential_distribution_uneven_split():
    batch = viral_studio_store.create_batch({
        "brand_ids": ["vale-o-clique", "achados-br"],
        "distribution_strategy": "sequential",
        "items": [
            {"source_url": "https://example.com/v1.mp4"},
            {"source_url": "https://example.com/v2.mp4"},
            {"source_url": "https://example.com/v3.mp4"},
            {"source_url": "https://example.com/v4.mp4"},
            {"source_url": "https://example.com/v5.mp4"},
        ],
    })

    items = batch["items"]
    assert len(items) == 5
    # 5 items / 2 brands -> block_size = 3 (first 3 to brand 0, next 2 to brand 1)
    assert items[0]["brand_id"] == "vale-o-clique"
    assert items[1]["brand_id"] == "vale-o-clique"
    assert items[2]["brand_id"] == "vale-o-clique"
    assert items[3]["brand_id"] == "achados-br"
    assert items[4]["brand_id"] == "achados-br"


def test_create_batch_item_explicit_brand_id():
    batch = viral_studio_store.create_batch({
        "brand_ids": ["vale-o-clique"],
        "items": [
            {"source_url": "https://example.com/v1.mp4", "brand_id": "achados-br"},
            {"source_url": "https://example.com/v2.mp4"},
        ],
    })

    items = batch["items"]
    assert items[0]["brand_id"] == "achados-br"
    assert items[1]["brand_id"] == "vale-o-clique"


def test_create_batch_item_invalid_explicit_brand_id_rejected():
    with pytest.raises(NotFoundError, match="Brand not found for item: unknown-brand"):
        viral_studio_store.create_batch({
            "brand_ids": ["vale-o-clique"],
            "items": [
                {"source_url": "https://example.com/v1.mp4", "brand_id": "unknown-brand"},
            ],
        })

