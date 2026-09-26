"""Host tests for PostizClient, PostizPublisherAdapter, and factory provider resolution.

Executes 100% in-memory with deterministic mocks (zero network/Docker dependencies).
"""
from __future__ import annotations

import os
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from clippyme.domain.errors import ValidationError
from clippyme.domain.mock_publisher_adapter import MockPublisherAdapter
from clippyme.domain.postiz_publisher_adapter import PostizPublisherAdapter
from clippyme.domain.social_publisher_port import (
    PublicationJob,
    PublicationReceipt,
    SocialChannel,
    get_social_publisher,
    set_social_publisher,
)
from clippyme.domain.zernio_publisher_adapter import ZernioPublisherAdapter
from clippyme.integrations.postiz_client import PostizClient, PostizError


@pytest.fixture(autouse=True)
def cleanup_global_publisher():
    set_social_publisher(None)
    yield
    set_social_publisher(None)


# ─────────────────────────────────────────────────────────────────────────────
# 1. PostizClient Unit Tests
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_postiz_client_upload_file_success(tmp_path):
    video_file = tmp_path / "clip.mp4"
    video_file.write_bytes(b"fake video binary content")

    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.is_error = False
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"id": "med_123", "path": "uploads/clip.mp4"}
    mock_client.request.return_value = mock_resp

    client = PostizClient(base_url="http://test-postiz:4007", api_key="secret-key", client=mock_client)
    res = await client.upload_file(str(video_file))

    assert res["id"] == "med_123"
    assert res["path"] == "uploads/clip.mp4"
    mock_client.request.assert_called_once()
    call_kwargs = mock_client.request.call_args[1]
    assert call_kwargs["method"] == "POST"
    assert "/public/v1/upload" in call_kwargs["url"]


@pytest.mark.asyncio
async def test_postiz_client_upload_file_not_found():
    client = PostizClient(api_key="secret-key")
    with pytest.raises(PostizError) as exc_info:
        await client.upload_file("/non/existent/path/video.mp4")
    assert "file does not exist" in str(exc_info.value)


@pytest.mark.asyncio
async def test_postiz_client_create_post_payload():
    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.is_error = False
    mock_resp.status_code = 201
    mock_resp.json.return_value = {
        "id": "post_789",
        "state": "QUEUE",
        "date": "2026-09-27T18:00:00.000Z",
    }
    mock_client.request.return_value = mock_resp

    client = PostizClient(base_url="http://test-postiz:4007", api_key="key_abc", client=mock_client)
    res = await client.create_post(
        integration_id="int_instagram_1",
        content="Confira este achadinho!",
        media_id="med_123",
        media_path="uploads/clip.mp4",
        date_iso="2026-09-27T18:00:00.000Z",
        post_type="schedule",
    )

    assert res["id"] == "post_789"
    assert res["state"] == "QUEUE"

    call_kwargs = mock_client.request.call_args[1]
    assert call_kwargs["method"] == "POST"
    payload = call_kwargs["json"]
    assert payload["type"] == "schedule"
    assert payload["date"] == "2026-09-27T18:00:00.000Z"
    assert payload["posts"][0]["integration"]["id"] == "int_instagram_1"
    assert payload["posts"][0]["value"][0]["content"] == "Confira este achadinho!"
    assert payload["posts"][0]["value"][0]["image"][0]["id"] == "med_123"


@pytest.mark.asyncio
async def test_postiz_client_find_slot():
    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.is_error = False
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"date": "2026-09-27T21:00:00.000Z"}
    mock_client.request.return_value = mock_resp

    client = PostizClient(client=mock_client)
    slot_dt = await client.find_slot("int_tiktok_9")

    assert slot_dt.year == 2026
    assert slot_dt.month == 9
    assert slot_dt.day == 27
    assert slot_dt.hour == 21
    assert slot_dt.tzinfo is not None


@pytest.mark.asyncio
async def test_postiz_client_list_integrations_and_filter():
    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.is_error = False
    mock_resp.status_code = 200
    mock_resp.json.return_value = [
        {"id": "int_1", "identifier": "instagram", "name": "@achados", "customer": "brand_promo"},
        {"id": "int_2", "identifier": "tiktok", "name": "@achados_tt", "customer": "brand_promo"},
        {"id": "int_3", "identifier": "youtube", "name": "@tech_hub", "customer": "brand_tech"},
    ]
    mock_client.request.return_value = mock_resp

    client = PostizClient(client=mock_client)
    all_ints = await client.list_integrations()
    assert len(all_ints) == 3

    filtered = await client.list_integrations(group_id="brand_promo")
    assert len(filtered) == 2
    assert all(i["customer"] == "brand_promo" for i in filtered)


@pytest.mark.asyncio
async def test_postiz_client_delete_post():
    mock_client = AsyncMock(spec=httpx.AsyncClient)

    # Success 200
    mock_resp_200 = MagicMock(spec=httpx.Response)
    mock_resp_200.is_error = False
    mock_resp_200.status_code = 200
    mock_resp_200.json.return_value = {"success": True}
    mock_client.request.return_value = mock_resp_200

    client = PostizClient(client=mock_client)
    assert await client.delete_post("post_123") is True

    # 404 Not Found returns False
    mock_resp_404 = MagicMock(spec=httpx.Response)
    mock_resp_404.is_error = True
    mock_resp_404.status_code = 404
    mock_resp_404.text = "Not found"
    mock_client.request.return_value = mock_resp_404

    assert await client.delete_post("post_missing") is False


@pytest.mark.asyncio
async def test_postiz_client_error_handling_429():
    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.is_error = True
    mock_resp.status_code = 429
    mock_resp.text = "Too Many Requests - Rate limit exceeded"
    mock_client.request.return_value = mock_resp

    client = PostizClient(client=mock_client)
    with pytest.raises(PostizError) as exc_info:
        await client.list_posts()
    assert exc_info.value.status_code == 429
    assert "Rate limit exceeded" in str(exc_info.value)


# ─────────────────────────────────────────────────────────────────────────────
# 2. PostizPublisherAdapter Unit Tests
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_postiz_publisher_adapter_schedule(tmp_path):
    video_file = tmp_path / "valid_render.mp4"
    video_file.write_bytes(b"sample video bytes")

    mock_client = AsyncMock(spec=PostizClient)
    mock_client.upload_file.return_value = {"id": "med_abc", "path": "uploads/valid_render.mp4"}
    mock_client.create_post.return_value = {
        "id": "post_sched_100",
        "state": "QUEUE",
        "date": "2026-09-28T15:00:00Z",
    }

    adapter = PostizPublisherAdapter(client=mock_client)
    job = PublicationJob(
        item_id="item-vf-1",
        media_path=str(video_file),
        title="Super Achadinho",
        caption="Descricao da oferta",
        platform="instagram",
        account_id="int_insta_88",
        scheduled_for="2026-09-28T15:00:00Z",
    )

    receipt = await adapter.schedule(job)
    assert receipt.item_id == "item-vf-1"
    assert receipt.status == "scheduled"
    assert receipt.post_id == "post_sched_100"
    assert receipt.scheduled_for == "2026-09-28T15:00:00Z"

    mock_client.upload_file.assert_called_once_with(str(video_file))
    mock_client.create_post.assert_called_once_with(
        integration_id="int_insta_88",
        content="Descricao da oferta",
        media_id="med_abc",
        media_path="uploads/valid_render.mp4",
        date_iso="2026-09-28T15:00:00Z",
        post_type="schedule",
        settings=None,
    )


@pytest.mark.asyncio
async def test_postiz_publisher_adapter_publish_now(tmp_path):
    video_file = tmp_path / "valid_render.mp4"
    video_file.write_bytes(b"sample video bytes")

    mock_client = AsyncMock(spec=PostizClient)
    mock_client.upload_file.return_value = {"id": "med_abc", "path": "uploads/valid_render.mp4"}
    mock_client.create_post.return_value = {
        "id": "post_pub_200",
        "state": "PUBLISHED",
        "releaseId": "rel_tt_555",
        "releaseURL": "https://tiktok.com/@user/video/555",
    }

    adapter = PostizPublisherAdapter(client=mock_client)
    job = PublicationJob(
        item_id="item-vf-2",
        media_path=str(video_file),
        title="Viral TikTok",
        caption="Comente QUERO",
        platform="tiktok",
        account_id="int_tt_99",
        publish_now=True,
    )

    receipt = await adapter.publish(job)
    assert receipt.item_id == "item-vf-2"
    assert receipt.status == "published"
    assert receipt.post_id == "post_pub_200"
    assert receipt.platform_post_id == "rel_tt_555"
    assert receipt.post_url == "https://tiktok.com/@user/video/555"


@pytest.mark.asyncio
async def test_postiz_publisher_adapter_handles_rate_limit(tmp_path):
    video_file = tmp_path / "video.mp4"
    video_file.write_bytes(b"content")

    mock_client = AsyncMock(spec=PostizClient)
    mock_client.upload_file.side_effect = PostizError(
        "Rate limit exceeded", status_code=429, body="Hourly quota reached"
    )

    adapter = PostizPublisherAdapter(client=mock_client)
    job = PublicationJob(
        item_id="item-429",
        media_path=str(video_file),
        caption="Promo",
        account_id="int_1",
        publish_now=True,
    )

    with pytest.raises(ValidationError) as exc_info:
        await adapter.publish(job)

    assert "429" in str(exc_info.value)
    assert "rate limit" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_postiz_publisher_adapter_list_accounts():
    mock_client = AsyncMock(spec=PostizClient)
    mock_client.list_integrations.return_value = [
        {
            "id": "postiz_int_1",
            "identifier": "tiktok",
            "name": "@achadostop",
            "picture": "https://avatar.cdn/tt.png",
            "disabled": False,
        },
        {
            "id": "postiz_int_2",
            "identifier": "instagram",
            "name": "@achadosinsta",
            "picture": None,
            "disabled": True,
        },
    ]

    adapter = PostizPublisherAdapter(client=mock_client)
    channels = await adapter.list_accounts(brand_id="brand_1")

    assert len(channels) == 2
    assert channels[0].id == "postiz_int_1"
    assert channels[0].platform == "tiktok"
    assert channels[0].name == "@achadostop"
    assert channels[0].connected is True
    assert channels[0].avatar_url == "https://avatar.cdn/tt.png"

    assert channels[1].id == "postiz_int_2"
    assert channels[1].platform == "instagram"
    assert channels[1].connected is False


@pytest.mark.asyncio
async def test_postiz_publisher_adapter_cancel_and_slot():
    mock_client = AsyncMock(spec=PostizClient)
    mock_client.delete_post.return_value = True
    mock_client.find_slot.return_value = datetime(2026, 9, 29, 18, 0, tzinfo=timezone.utc)

    adapter = PostizPublisherAdapter(client=mock_client)

    assert await adapter.cancel("post_to_delete") is True
    mock_client.delete_post.assert_called_once_with("post_to_delete")

    slot = await adapter.find_next_slot("int_1")
    assert slot == datetime(2026, 9, 29, 18, 0, tzinfo=timezone.utc)


# ─────────────────────────────────────────────────────────────────────────────
# 3. Factory Provider Resolution Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_get_social_publisher_resolution(monkeypatch):
    monkeypatch.delenv("ZERNIO_API_KEY", raising=False)
    monkeypatch.delenv("POSTIZ_API_KEY", raising=False)
    monkeypatch.delenv("MOCK_PUBLISHER", raising=False)
    monkeypatch.delenv("PUBLISHING_PROVIDER", raising=False)
    monkeypatch.setattr("clippyme.storage.config_store.load_persistent_config", lambda: {})
    monkeypatch.setattr("clippyme.storage.config_store.load_zernio_config", lambda: {})

    # 1. Default with no keys -> Mock fallback
    pub_default = get_social_publisher()
    assert isinstance(pub_default, MockPublisherAdapter)

    # 2. Explicit provider="postiz"
    pub_postiz = get_social_publisher(provider="postiz")
    assert isinstance(pub_postiz, PostizPublisherAdapter)

    # 3. Explicit provider="zernio"
    pub_zernio = get_social_publisher(provider="zernio")
    assert isinstance(pub_zernio, ZernioPublisherAdapter)

    # 4. Explicit provider="mock"
    pub_mock = get_social_publisher(provider="mock")
    assert isinstance(pub_mock, MockPublisherAdapter)

    # 5. POSTIZ_API_KEY set in env -> resolves to PostizPublisherAdapter
    monkeypatch.setenv("POSTIZ_API_KEY", "postiz_secret_key_123")
    pub_postiz_env = get_social_publisher()
    assert isinstance(pub_postiz_env, PostizPublisherAdapter)

    # 6. MOCK_PUBLISHER=1 overrides POSTIZ_API_KEY
    monkeypatch.setenv("MOCK_PUBLISHER", "1")
    pub_forced_mock = get_social_publisher()
    assert isinstance(pub_forced_mock, MockPublisherAdapter)
