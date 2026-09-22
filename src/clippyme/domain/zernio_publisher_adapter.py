"""zernio_publisher_adapter — Production Adapter for Zernio API.

Satisfies SocialPublisherPort using the existing ZernioClient integration.
Encapsulates all upstream HTTP negotiation, presigned streaming uploads,
SSRF checks, log secret sanitization, and 429 rate-limit error mapping.
"""
from __future__ import annotations

import asyncio
import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from clippyme.domain.errors import ValidationError
from clippyme.domain.social_publisher_port import (
    PublicationJob,
    PublicationReceipt,
    SocialChannel,
    SocialPublisherPort,
)
from clippyme.integrations.social_publisher import (
    DEFAULT_TIMEZONE,
    ZernioClient,
    ZernioError,
)

logger = logging.getLogger("clippyme.zernio_publisher_adapter")


class ZernioPublisherAdapter(SocialPublisherPort):
    """Production adapter integrating Zernio cloud publishing API."""

    def __init__(self, api_key: str, client: Optional[Any] = None, base_url: Optional[str] = None):
        if not api_key and client is None:
            raise ValueError("api_key is required for ZernioPublisherAdapter")
        if client is not None:
            self._client = client
        else:
            kwargs: Dict[str, Any] = {"api_key": api_key}
            if base_url:
                kwargs["base_url"] = base_url
            self._client = ZernioClient(**kwargs)

    async def publish(self, job: PublicationJob) -> PublicationReceipt:
        """Publish immediately to social platforms via Zernio."""
        return await asyncio.to_thread(self._sync_dispatch, job, publish_now=True)

    async def schedule(self, job: PublicationJob) -> PublicationReceipt:
        """Schedule future publication via Zernio."""
        return await asyncio.to_thread(self._sync_dispatch, job, publish_now=False)

    def _sync_dispatch(self, job: PublicationJob, *, publish_now: bool) -> PublicationReceipt:
        """Synchronous worker executing media upload and post creation."""
        video_path = job.effective_media_path
        if not video_path or not os.path.isfile(video_path):
            return PublicationReceipt(
                item_id=job.item_id,
                status="failed",
                error=f"Video file not found: {video_path}",
            )

        try:
            size_bytes = os.path.getsize(video_path)
            if size_bytes == 0:
                return PublicationReceipt(
                    item_id=job.item_id,
                    status="failed",
                    error="Rendered video file is empty (0 bytes)",
                )

            filename = os.path.basename(video_path)
            # 1. Presign upload URL
            presign = self._client.presign_upload(
                filename=filename,
                content_type="video/mp4",
                size_bytes=size_bytes,
            )
            upload_url = presign.get("uploadUrl")
            public_url = presign.get("publicUrl")
            if not upload_url or not public_url:
                raise ZernioError("Invalid presign response from Zernio (missing uploadUrl or publicUrl)")

            # 2. Upload video binary
            self._client.upload_to_presigned(upload_url, video_path, content_type="video/mp4")

            # 3. Create post payload
            media_items = [{"type": "video", "url": public_url}]
            platforms = job.effective_platforms

            response = self._client.create_post(
                content=job.effective_content,
                title=job.title,
                media_items=media_items,
                platforms=platforms,
                scheduled_for=None if publish_now else job.scheduled_for,
                timezone=job.timezone or DEFAULT_TIMEZONE,
                publish_now=publish_now,
                tiktok_settings=job.tiktok_settings,
            )

            # 4. Extract post identifier
            post_obj = response.get("post") if isinstance(response, dict) else None
            if isinstance(post_obj, dict):
                post_id = post_obj.get("_id") or post_obj.get("id")
                status = post_obj.get("status", "published" if publish_now else "scheduled")
                post_url = post_obj.get("url") or post_obj.get("postUrl")
            elif isinstance(response, dict):
                post_id = response.get("_id") or response.get("id")
                status = response.get("status", "published" if publish_now else "scheduled")
                post_url = response.get("url") or response.get("postUrl")
            else:
                post_id = None
                status = "published" if publish_now else "scheduled"
                post_url = None

            now_iso = datetime.now(timezone.utc).isoformat()
            return PublicationReceipt(
                item_id=job.item_id,
                status=status,
                post_id=str(post_id) if post_id else None,
                platform_post_id=str(post_id) if post_id else None,
                scheduled_for=job.scheduled_for if not publish_now else None,
                published_at=now_iso if publish_now else None,
                post_url=post_url,
                raw_response=response if isinstance(response, dict) else {},
            )

        except ZernioError as exc:
            logger.error("Zernio publication error for item %s: %s (code=%s)", job.item_id, exc, exc.status_code)
            if exc.status_code == 429:
                detail = f"Limite diário da API de publicação atingido (HTTP 429): {exc.body or str(exc)}"
                raise ValidationError(detail) from exc
            error_msg = str(exc)
            return PublicationReceipt(
                item_id=job.item_id,
                status="failed",
                error=error_msg,
                raw_response={"status_code": exc.status_code, "body": exc.body},
            )
        except Exception as exc:
            logger.exception("Unexpected error in ZernioPublisherAdapter for item %s: %s", job.item_id, exc)
            return PublicationReceipt(
                item_id=job.item_id,
                status="failed",
                error=str(exc),
            )

    async def cancel(self, external_id: str) -> bool:
        """Cancel a scheduled post in Zernio."""
        def _sync_cancel():
            try:
                self._client._request("DELETE", f"/posts/{external_id}")
                return True
            except ZernioError as exc:
                if exc.status_code == 404:
                    return True
                logger.warning("Failed to cancel post %s in Zernio: %s", external_id, exc)
                return False
            except Exception as exc:
                logger.warning("Error cancelling post %s in Zernio: %s", external_id, exc)
                return False

        return await asyncio.to_thread(_sync_cancel)

    async def get_status(self, external_id: str) -> PublicationReceipt:
        """Fetch post status from Zernio."""
        def _sync_get():
            try:
                res = self._client._request("GET", f"/posts/{external_id}")
                post_obj = res.get("post") if isinstance(res, dict) else res
                status = post_obj.get("status", "unknown") if isinstance(post_obj, dict) else "unknown"
                return PublicationReceipt(
                    item_id="",
                    status=status,
                    post_id=external_id,
                    raw_response=res if isinstance(res, dict) else {},
                )
            except Exception as exc:
                return PublicationReceipt(
                    item_id="",
                    status="failed",
                    error=str(exc),
                )

        return await asyncio.to_thread(_sync_get)

    async def list_accounts(self) -> List[SocialChannel]:
        """Fetch connected accounts from Zernio and map to SocialChannel DTOs."""
        def _sync_list():
            try:
                raw_accounts = self._client.list_accounts()
                channels: List[SocialChannel] = []
                for acc in raw_accounts:
                    if not isinstance(acc, dict):
                        continue
                    acc_id = acc.get("id") or acc.get("_id") or acc.get("accountId")
                    platform = acc.get("platform") or "unknown"
                    name = acc.get("name") or acc.get("username") or acc.get("handle") or str(acc_id)
                    avatar = acc.get("avatar") or acc.get("avatarUrl") or acc.get("profilePicture")
                    if acc_id:
                        channels.append(
                            SocialChannel(
                                id=str(acc_id),
                                platform=str(platform).lower(),
                                name=str(name),
                                connected=acc.get("connected", True),
                                avatar_url=str(avatar) if avatar else None,
                            )
                        )
                return channels
            except Exception as exc:
                logger.warning("Failed to list Zernio accounts: %s", exc)
                return []

        return await asyncio.to_thread(_sync_list)
