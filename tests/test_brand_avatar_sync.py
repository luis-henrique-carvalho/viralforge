"""tests/test_brand_avatar_sync.py — TDD tests for brand avatar auto-sync and video rendering."""
import os
import json
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from PIL import Image
import io

from clippyme.domain import brand_workspace_service, viral_studio_store, viral_studio_renderer
from clippyme.domain.social_publisher_port import SocialChannel, SocialPublisherPort


@pytest.fixture
def clean_store(tmp_path, monkeypatch):
    """Provide clean isolated file store for testing."""
    brands_path = str(tmp_path / "brands.json")
    batches_path = str(tmp_path / "batches.json")
    templates_path = str(tmp_path / "templates.json")

    monkeypatch.setattr(viral_studio_store, "BRANDS_FILE", brands_path)
    monkeypatch.setattr(viral_studio_store, "BATCHES_FILE", batches_path)
    monkeypatch.setattr(viral_studio_store, "TEMPLATES_FILE", templates_path)

    # Initialize empty stores
    with open(brands_path, "w") as f:
        json.dump({}, f)
    with open(batches_path, "w") as f:
        json.dump({}, f)
    with open(templates_path, "w") as f:
        json.dump({}, f)

    return tmp_path


@pytest.mark.asyncio
async def test_bind_brand_channels_auto_inherits_channel_avatar_url(clean_store):
    """When a brand has no avatar, binding a channel with avatar_url automatically sets brand.avatar_url."""
    brand = viral_studio_store.create_brand({
        "id": "brand_test",
        "name": "Brand Test",
        "handle": "@brand_test",
        "avatar_url": None,
        "avatar_path": None,
    })
    assert brand.get("avatar_url") is None

    mock_port = MagicMock(spec=SocialPublisherPort)
    mock_port.list_accounts = AsyncMock(return_value=[
        SocialChannel(
            id="ch_ig_1",
            platform="instagram",
            name="Brand Test IG",
            connected=True,
            avatar_url="https://example.com/avatar.jpg",
            provider="postiz",
        )
    ])
    mock_port.ensure_brand_workspace = AsyncMock(return_value="ws_1")
    mock_port.assign_channel_to_workspace = AsyncMock(return_value=True)

    with patch("clippyme.domain.brand_workspace_service.get_social_publisher", return_value=mock_port):
        updated = await brand_workspace_service.bind_brand_channels(
            brand_id="brand_test",
            channel_ids=["ch_ig_1"],
            workspace_id="ws_1",
        )

    assert updated.get("avatar_url") == "https://example.com/avatar.jpg"
    persisted = viral_studio_store.get_brand("brand_test")
    assert persisted.get("avatar_url") == "https://example.com/avatar.jpg"


@pytest.mark.asyncio
async def test_bind_brand_channels_preserves_custom_avatar_path(clean_store):
    """When a brand already has a local avatar_path, channel binding does not overwrite it."""
    brand = viral_studio_store.create_brand({
        "id": "brand_custom",
        "name": "Brand Custom",
        "handle": "@brand_custom",
        "avatar_url": None,
        "avatar_path": "data/assets/custom_avatar.png",
    })

    mock_port = MagicMock(spec=SocialPublisherPort)
    mock_port.list_accounts = AsyncMock(return_value=[
        SocialChannel(
            id="ch_ig_2",
            platform="instagram",
            name="Brand Custom IG",
            connected=True,
            avatar_url="https://example.com/other.jpg",
            provider="postiz",
        )
    ])
    mock_port.ensure_brand_workspace = AsyncMock(return_value="ws_2")
    mock_port.assign_channel_to_workspace = AsyncMock(return_value=True)

    with patch("clippyme.domain.brand_workspace_service.get_social_publisher", return_value=mock_port):
        updated = await brand_workspace_service.bind_brand_channels(
            brand_id="brand_custom",
            channel_ids=["ch_ig_2"],
            workspace_id="ws_2",
        )

    assert updated.get("avatar_path") == "data/assets/custom_avatar.png"
    assert updated.get("avatar_url") is None


@pytest.mark.asyncio
async def test_get_workspace_summary_auto_populates_missing_avatar(clean_store):
    """Querying workspace summary auto-syncs avatar_url from connected channels if brand avatar is empty."""
    brand = viral_studio_store.create_brand({
        "id": "brand_sync",
        "name": "Brand Sync",
        "handle": "@brand_sync",
        "avatar_url": "",
        "avatar_path": None,
        "publishing_profiles": {
            "postiz": {"active": True, "channel_ids": ["ch_sync_1"]}
        }
    })

    mock_port = MagicMock(spec=SocialPublisherPort)
    mock_port.list_accounts = AsyncMock(return_value=[
        SocialChannel(
            id="ch_sync_1",
            platform="instagram",
            name="Brand Sync IG",
            connected=True,
            avatar_url="https://cdn.example.com/pic.png",
            provider="postiz",
        )
    ])

    with patch("clippyme.domain.brand_workspace_service.get_social_publisher", return_value=mock_port):
        summary = await brand_workspace_service.get_workspace_summary("brand_sync")

    assert summary["brand"]["avatar_url"] == "https://cdn.example.com/pic.png"
    persisted = viral_studio_store.get_brand("brand_sync")
    assert persisted.get("avatar_url") == "https://cdn.example.com/pic.png"


def test_resolve_or_download_avatar_validates_and_caches_image(tmp_path, monkeypatch):
    """Valid image stream is downloaded, verified, and cached on disk."""
    monkeypatch.setattr(viral_studio_renderer, "_REPO_ROOT", str(tmp_path))

    # Generate small valid PNG bytes
    buf = io.BytesIO()
    img = Image.new("RGBA", (80, 80), color=(255, 100, 50, 255))
    img.save(buf, format="PNG")
    valid_png_bytes = buf.getvalue()

    mock_resp = MagicMock()
    mock_resp.read.return_value = valid_png_bytes
    mock_resp.__enter__.return_value = mock_resp

    with patch("urllib.request.urlopen", return_value=mock_resp):
        brand_data = {
            "name": "Test Brand",
            "avatar_url": "https://images.example.com/test_avatar.png",
        }
        cached_path = viral_studio_renderer._resolve_or_download_avatar(brand_data)

    assert cached_path is not None
    assert os.path.isfile(cached_path)
    assert os.path.getsize(cached_path) > 100

    with Image.open(cached_path) as loaded:
        assert loaded.size == (80, 80)


def test_resolve_or_download_avatar_discards_html_warning_page(tmp_path, monkeypatch):
    """If server returns HTML warning text instead of image bytes, it is safely rejected."""
    monkeypatch.setattr(viral_studio_renderer, "_REPO_ROOT", str(tmp_path))

    html_bytes = b"<html><body>ERR_NGROK_6024: You are about to visit ngrok</body></html>"
    mock_resp = MagicMock()
    mock_resp.read.return_value = html_bytes
    mock_resp.__enter__.return_value = mock_resp

    with patch("urllib.request.urlopen", return_value=mock_resp):
        brand_data = {
            "name": "Warning Brand",
            "avatar_url": "https://ngrok.example.com/avatar.jpg",
        }
        cached_path = viral_studio_renderer._resolve_or_download_avatar(brand_data)

    assert cached_path is None


def test_generate_header_overlay_burns_avatar_into_overlay(tmp_path, monkeypatch):
    """Header overlay burns avatar image into the PIL output transparent overlay."""
    monkeypatch.setattr(viral_studio_renderer, "_REPO_ROOT", str(tmp_path))

    # Create dummy avatar on disk
    avatar_file = str(tmp_path / "avatar.png")
    img = Image.new("RGBA", (100, 100), color=(255, 0, 0, 255))
    img.save(avatar_file)

    brand = {
        "name": "Overlay Brand",
        "handle": "@overlaybrand",
        "avatar_path": avatar_file,
    }
    template = {
        "width": 1080,
        "height": 1920,
        "avatar_enabled": True,
        "avatar_x": 60,
        "avatar_y": 80,
        "avatar_size": 100,
        "brand_name_color": "#FFFFFF",
        "brand_handle_color": "#AAAAAA",
    }
    output_path = str(tmp_path / "overlay.png")

    meta = viral_studio_renderer.generate_header_overlay(
        brand=brand,
        template=template,
        headline="Confira este achado!",
        output_image_path=output_path,
    )

    assert os.path.isfile(output_path)
    assert meta["output_path"] == output_path
    with Image.open(output_path) as out_img:
        assert out_img.size == (1080, 1920)
