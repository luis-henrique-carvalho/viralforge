from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from clippyme.domain.discovery.providers.tiktok_playwright import (
    parse_netscape_cookies,
    TikTokPlaywrightWorker,
)
from clippyme.domain.discovery.providers.tiktok_provider import TikTokProvider
from clippyme.domain.discovery.schemas import DiscoveryFilter, PlatformType


def test_parse_netscape_cookies(tmp_path):
    # Nonexistent file
    assert parse_netscape_cookies(str(tmp_path / "missing.txt")) == []

    # Valid cookies file
    cookie_file = tmp_path / "tiktok_cookies.txt"
    cookie_file.write_text(
        "# Netscape HTTP Cookie File\n"
        "# Comment line\n"
        "\n"
        ".tiktok.com\tTRUE\t/\tTRUE\t1790000000\tsessionid\tabc123xyz\n"
        ".tiktok.com\tTRUE\t/\tFALSE\t1790000000\ttt_csrf_token\tcsrf456\n"
    )

    cookies = parse_netscape_cookies(str(cookie_file))
    assert len(cookies) == 2
    assert cookies[0]["name"] == "sessionid"
    assert cookies[0]["value"] == "abc123xyz"
    assert cookies[0]["domain"] == ".tiktok.com"
    assert cookies[0]["secure"] is True
    assert cookies[0]["expires"] == 1790000000
    assert cookies[1]["name"] == "tt_csrf_token"
    assert cookies[1]["secure"] is False


@pytest.mark.asyncio
async def test_tiktok_playwright_worker_extract_items():
    worker = TikTokPlaywrightWorker(chrome_path="/dummy/chrome")

    mock_browser = AsyncMock()
    mock_context = AsyncMock()
    mock_page = MagicMock()
    mock_page.goto = AsyncMock()
    mock_page.evaluate = AsyncMock()
    mock_page.query_selector_all = AsyncMock(return_value=[])

    mock_browser.new_context.return_value = mock_context
    mock_context.new_page.return_value = mock_page

    mock_p = MagicMock()
    mock_p.chromium.launch = AsyncMock(return_value=mock_browser)

    fake_payload = {
        "status_code": 0,
        "item_list": [
            {
                "id": "7556385203803999499",
                "desc": "Fatiador de Cozinha #viral",
                "author": {"uniqueId": "achadinhos", "nickname": "Achadinhos Top"},
                "stats": {"playCount": 100000, "diggCount": 5000, "commentCount": 300, "shareCount": 400},
                "video": {"duration": 30, "cover": "https://img.com/cover.jpg"},
                "createTime": 1759358040,
            }
        ]
    }

    registered_callbacks = []

    def mock_on(event, callback):
        if event == "response":
            registered_callbacks.append(callback)

    mock_page.on = MagicMock(side_effect=mock_on)

    async def mock_goto(*args, **kwargs):
        import json
        mock_resp = MagicMock()
        mock_resp.url = "https://www.tiktok.com/api/search/item/full/?q=test"
        mock_resp.text = AsyncMock(return_value=json.dumps(fake_payload))
        mock_resp.json = AsyncMock(return_value=fake_payload)
        for cb in registered_callbacks:
            cb(mock_resp)

    mock_page.goto.side_effect = mock_goto

    with patch("playwright.async_api.async_playwright") as mock_ap:
        cm = AsyncMock()
        cm.__aenter__.return_value = mock_p
        cm.__aexit__.return_value = None
        mock_ap.return_value = cm

        results = await worker.extract_search_videos("achadinhos", limit=10, timeout_secs=0.5)
        assert len(results) == 1
        assert results[0]["id"] == "7556385203803999499"
        mock_browser.close.assert_awaited_once()


@pytest.mark.asyncio
async def test_tiktok_provider_search_success():
    mock_worker = MagicMock(spec=TikTokPlaywrightWorker)
    mock_worker.extract_search_videos = AsyncMock(
        return_value=[
            {
                "id": "7556385203803999499",
                "desc": "Fatiador de Cozinha #viral",
                "author": {"uniqueId": "achadinhos", "nickname": "Achadinhos Top"},
                "stats": {"playCount": 100000, "diggCount": 5000, "commentCount": 300, "shareCount": 400},
                "video": {"duration": 30, "cover": "https://img.com/cover.jpg"},
                "createTime": 1759358040,
            }
        ]
    )

    provider = TikTokProvider(worker=mock_worker)
    filter_params = DiscoveryFilter(query="achadinhos", limit=5)

    items = await provider.search(filter_params)
    assert len(items) == 1
    item = items[0]
    assert item.id == "7556385203803999499"
    assert item.platform == PlatformType.TIKTOK
    assert item.author_handle == "@achadinhos"
    assert item.author_name == "Achadinhos Top"
    assert item.view_count == 100000
    assert item.like_count == 5000
    assert item.virality_score > 0
    assert item.duration_seconds == 30


@pytest.mark.asyncio
async def test_tiktok_provider_fallback_on_error():
    mock_worker = MagicMock(spec=TikTokPlaywrightWorker)
    mock_worker.extract_search_videos = AsyncMock(side_effect=RuntimeError("Playwright crashed"))

    provider = TikTokProvider(worker=mock_worker)
    with patch.object(provider, "_fallback_tag_search", return_value=[]) as mock_fallback:
        filter_params = DiscoveryFilter(query="achadinhos", limit=5)
        items = await provider.search(filter_params)
        assert items == []
        mock_fallback.assert_called_once()
