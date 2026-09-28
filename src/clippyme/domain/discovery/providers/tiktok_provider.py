from __future__ import annotations

import asyncio
import logging
import time
from typing import Any, Dict, List, Optional

from ..base import DiscoveryProvider
from ..schemas import DiscoveryFilter, DiscoveryItem, PlatformType
from ..scoring import calculate_virality_score, calculate_engagement_rate, calculate_view_velocity
from .tiktok_playwright import TikTokPlaywrightWorker
from clippyme.domain.cookie_resolver import resolve_platform_cookies

logger = logging.getLogger("clippyme.discovery.tiktok")


class TikTokProvider(DiscoveryProvider):
    """Provedor de busca e descoberta de vídeos do TikTok via Playwright Headless com fallback."""

    def __init__(self, worker: Optional[TikTokPlaywrightWorker] = None):
        self.worker = worker or TikTokPlaywrightWorker()

    @property
    def platform(self) -> PlatformType:
        return PlatformType.TIKTOK

    def _map_raw_to_item(self, raw: Dict[str, Any], now: int) -> Optional[DiscoveryItem]:
        """Converte dicionário de vídeo bruto da API do TikTok para DiscoveryItem padronizado."""
        try:
            video_id = str(raw.get("id") or "").strip()
            if not video_id:
                return None

            desc = raw.get("desc") or f"TikTok Video {video_id}"
            author = raw.get("author") or {}
            nickname = author.get("nickname") or "TikTok Creator"
            unique_id = author.get("uniqueId") or "creator"
            author_handle = f"@{unique_id.lstrip('@')}"

            stats = raw.get("stats") or raw.get("statsV2") or {}
            views = int(stats.get("playCount") or 0)
            likes = int(stats.get("diggCount") or 0)
            comments = int(stats.get("commentCount") or 0)
            shares = int(stats.get("shareCount") or 0)

            video_info = raw.get("video") or {}
            duration = int(video_info.get("duration") or 0)
            cover = video_info.get("cover") or video_info.get("dynamicCover") or raw.get("thumbnail")

            create_time = raw.get("createTime")
            published_ts = int(create_time) if create_time and str(create_time).isdigit() else None

            virality = calculate_virality_score(
                platform=PlatformType.TIKTOK,
                views=views,
                likes=likes,
                comments=comments,
                shares=shares,
                published_timestamp=published_ts,
                current_timestamp=now,
            )

            engagement = calculate_engagement_rate(PlatformType.TIKTOK, views, likes, comments, shares)
            velocity = calculate_view_velocity(views, published_ts, now)
            video_url = f"https://www.tiktok.com/{author_handle}/video/{video_id}"

            return DiscoveryItem(
                id=video_id,
                platform=PlatformType.TIKTOK,
                url=video_url,
                title=desc[:120],
                description=desc,
                author_name=nickname,
                author_handle=author_handle,
                published_timestamp=published_ts,
                thumbnail_url=cover,
                duration_seconds=duration if duration > 0 else None,
                view_count=views,
                like_count=likes,
                comment_count=comments,
                share_count=shares,
                virality_score=virality,
                engagement_rate=engagement,
                view_velocity=velocity,
            )
        except Exception as exc:
            logger.debug("Falha ao mapear item bruto do TikTok: %s", exc)
            return None

    def _fallback_tag_search(self, query: str, limit: int, now: int) -> List[DiscoveryItem]:
        """Fallback secundário via extração de tag com yt-dlp."""
        clean_tag = query.strip().lstrip("#").replace(" ", "")
        items: List[DiscoveryItem] = []
        try:
            import yt_dlp
            tag_url = f"https://www.tiktok.com/tag/{clean_tag}"
            ydl_opts: Dict[str, Any] = {
                "extract_flat": True,
                "quiet": True,
                "no_warnings": True,
                "skip_download": True,
                "playlistend": limit,
            }
            cookies_path = resolve_platform_cookies("tiktok")
            if cookies_path:
                ydl_opts["cookiefile"] = cookies_path

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(tag_url, download=False)
                if info and "entries" in info:
                    for entry in info["entries"]:
                        if not entry:
                            continue
                        vid = entry.get("id")
                        if not vid:
                            continue
                        uploader = entry.get("uploader") or entry.get("channel") or "TikTok Creator"
                        uploader_id = entry.get("uploader_id") or uploader
                        views = int(entry.get("view_count") or 0)
                        likes = int(entry.get("like_count") or 0)
                        comments = int(entry.get("comment_count") or 0)
                        shares = int(entry.get("repost_count") or 0)
                        ts = entry.get("timestamp")
                        title = entry.get("title") or f"TikTok Video {vid}"

                        item = DiscoveryItem(
                            id=vid,
                            platform=PlatformType.TIKTOK,
                            url=entry.get("url") or f"https://www.tiktok.com/@user/video/{vid}",
                            title=title[:120],
                            description=title,
                            author_name=uploader,
                            author_handle=f"@{str(uploader_id).lstrip('@')}",
                            published_timestamp=ts,
                            thumbnail_url=entry.get("thumbnail"),
                            view_count=views,
                            like_count=likes,
                            comment_count=comments,
                            share_count=shares,
                            virality_score=calculate_virality_score(PlatformType.TIKTOK, views, likes, comments, shares, ts, now),
                            engagement_rate=calculate_engagement_rate(PlatformType.TIKTOK, views, likes, comments, shares),
                            view_velocity=calculate_view_velocity(views, ts, now),
                        )
                        items.append(item)
        except Exception as exc:
            logger.debug("Fallback tag yt-dlp falhou: %s", exc)

        return items

    def _search_sync(self, query: str, limit: int = 20) -> List[DiscoveryItem]:
        """Método síncrono para fallback e compatibilidade de testes."""
        now = int(time.time())
        return self._fallback_tag_search(query, limit, now)

    async def search(self, filter_params: DiscoveryFilter) -> List[DiscoveryItem]:
        """Executa busca de vídeos do TikTok por palavra-chave."""
        cookies_path = resolve_platform_cookies("tiktok")
        now = int(time.time())

        # 1. Tenta extração via Playwright
        try:
            raw_items = await self.worker.extract_search_videos(
                query=filter_params.query,
                limit=filter_params.limit,
                cookies_path=cookies_path,
            )
            if raw_items:
                items: List[DiscoveryItem] = []
                for raw in raw_items:
                    item = self._map_raw_to_item(raw, now)
                    if item:
                        items.append(item)
                if items:
                    return items
        except Exception as exc:
            logger.warning("Falha na busca Playwright do TikTok: %s", exc)

        # 2. Fallback síncrono para busca de tag via yt-dlp em thread separada
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._fallback_tag_search, filter_params.query, filter_params.limit, now)

    async def health_check(self) -> bool:
        return True
