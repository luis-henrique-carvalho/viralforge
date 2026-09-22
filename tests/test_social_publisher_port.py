"""Host tests for SocialPublisherPort, MockPublisherAdapter, and ZernioPublisherAdapter."""
from unittest.mock import MagicMock

import pytest

from clippyme.domain.errors import ValidationError
from clippyme.domain.mock_publisher_adapter import MockPublisherAdapter
from clippyme.domain.social_publisher_port import (
    PublicationJob,
    get_social_publisher,
    set_social_publisher,
)
from clippyme.domain.zernio_publisher_adapter import ZernioPublisherAdapter
from clippyme.integrations.social_publisher import ZernioError


@pytest.fixture(autouse=True)
def cleanup_publisher():
    set_social_publisher(None)
    yield
    set_social_publisher(None)


@pytest.mark.asyncio
async def test_mock_publisher_publish_and_schedule():
    adapter = MockPublisherAdapter()
    job = PublicationJob(
        item_id="item-123",
        media_path="/tmp/video.mp4",
        title="Achadinho Teste",
        caption="Veja isso!",
        platform="tiktok",
        account_id="acc-1",
        publish_now=True,
    )

    # Publish
    receipt = await adapter.publish(job)
    assert receipt.item_id == "item-123"
    assert receipt.status == "published"
    assert receipt.post_id.startswith("mock_post_")
    assert receipt.published_at is not None
    assert "tiktok" in receipt.post_url

    # Status
    status_receipt = await adapter.get_status(receipt.post_id)
    assert status_receipt.status == "published"

    # Schedule
    sched_job = PublicationJob(
        item_id="item-456",
        media_path="/tmp/video2.mp4",
        title="Outro Achadinho",
        caption="Imperdível!",
        platform="instagram",
        account_id="acc-2",
        scheduled_for="2026-09-25T18:00:00-03:00",
        publish_now=False,
    )
    sched_receipt = await adapter.schedule(sched_job)
    assert sched_receipt.status == "scheduled"
    assert sched_receipt.scheduled_for == "2026-09-25T18:00:00-03:00"

    # Cancel
    cancelled = await adapter.cancel(sched_receipt.post_id)
    assert cancelled is True

    status_cancelled = await adapter.get_status(sched_receipt.post_id)
    assert status_cancelled.status == "cancelled"

    # Cancel non-existent
    assert await adapter.cancel("non_existent_id") is False


@pytest.mark.asyncio
async def test_mock_publisher_list_accounts():
    adapter = MockPublisherAdapter()
    accounts = await adapter.list_accounts()
    assert len(accounts) >= 3
    platforms = {acc.platform for acc in accounts}
    assert "tiktok" in platforms
    assert "instagram" in platforms
    assert "youtube" in platforms


def test_publisher_factory_resolution(monkeypatch):
    monkeypatch.delenv("ZERNIO_API_KEY", raising=False)
    monkeypatch.delenv("MOCK_PUBLISHER", raising=False)

    # Defaults to Mock when no key is set
    pub = get_social_publisher()
    assert isinstance(pub, MockPublisherAdapter)

    # Explicit mock
    pub_mock = get_social_publisher(provider="mock")
    assert isinstance(pub_mock, MockPublisherAdapter)

    # Env MOCK_PUBLISHER=1
    monkeypatch.setenv("MOCK_PUBLISHER", "1")
    monkeypatch.setenv("ZERNIO_API_KEY", "test-key")
    pub_env = get_social_publisher()
    assert isinstance(pub_env, MockPublisherAdapter)

    # Zernio with key
    monkeypatch.setenv("MOCK_PUBLISHER", "0")
    pub_zernio = get_social_publisher(provider="zernio")
    assert isinstance(pub_zernio, ZernioPublisherAdapter)


@pytest.mark.asyncio
async def test_zernio_publisher_adapter_dispatch(tmp_path):
    video_file = tmp_path / "test_video.mp4"
    video_file.write_bytes(b"dummy video content")

    mock_client = MagicMock()
    mock_client.presign_upload.return_value = {
        "uploadUrl": "https://zernio.com/upload/signed",
        "publicUrl": "https://cdn.zernio.com/videos/v1.mp4",
    }
    mock_client.create_post.return_value = {
        "post": {
            "id": "zernio_post_999",
            "status": "scheduled",
            "platforms": [{"platformPostId": "tt_123"}],
        }
    }

    adapter = ZernioPublisherAdapter(api_key="test_key", client=mock_client)

    job = PublicationJob(
        item_id="item-zernio",
        media_path=str(video_file),
        title="Achado Zernio",
        caption="Descricao",
        platform="tiktok",
        account_id="acc-tt",
        scheduled_for="2026-09-25T18:00:00-03:00",
        publish_now=False,
    )

    receipt = await adapter.schedule(job)
    assert receipt.post_id == "zernio_post_999"
    assert receipt.status == "scheduled"
    mock_client.presign_upload.assert_called_once()
    mock_client.upload_to_presigned.assert_called_once_with(
        "https://zernio.com/upload/signed", str(video_file), content_type="video/mp4"
    )
    mock_client.create_post.assert_called_once()


@pytest.mark.asyncio
async def test_zernio_publisher_adapter_handles_429(tmp_path):
    video_file = tmp_path / "test_video.mp4"
    video_file.write_bytes(b"dummy video content")

    mock_client = MagicMock()
    mock_client.presign_upload.side_effect = ZernioError(
        "Daily limit reached", status_code=429, body="You exceeded 10 posts per day"
    )

    adapter = ZernioPublisherAdapter(api_key="test_key", client=mock_client)

    job = PublicationJob(
        item_id="item-429",
        media_path=str(video_file),
        title="Achado",
        caption="Descricao",
        platform="tiktok",
        account_id="acc-tt",
        publish_now=True,
    )

    with pytest.raises(ValidationError) as exc_info:
        await adapter.publish(job)

    assert "429" in str(exc_info.value)
    assert "Daily limit" in str(exc_info.value) or "exceeded 10 posts" in str(exc_info.value)
