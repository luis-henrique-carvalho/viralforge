"""postiz_publisher_adapter — Production Adapter for Postiz API.

Satisfies SocialPublisherPort using the asynchronous PostizClient.
Encapsulates all upstream HTTP communication, multipart media streaming,
error translation, and state mapping (QUEUE -> scheduled, PUBLISHED -> published).
"""
from __future__ import annotations

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
from clippyme.integrations.postiz_client import PostizClient, PostizError

logger = logging.getLogger("clippyme.postiz_publisher_adapter")

_POSTIZ_STATUS_MAP: Dict[str, str] = {
    "PUBLISHED": "published",
    "SUCCESS": "published",
    "ERROR": "failed",
    "FAILED": "failed",
    "QUEUE": "scheduled",
    "PENDING": "scheduled",
    "SCHEDULED": "scheduled",
}


def _map_postiz_status(state: str, default: str = "scheduled") -> str:
    return _POSTIZ_STATUS_MAP.get(state.upper(), default)


class PostizPublisherAdapter(SocialPublisherPort):
    """Production adapter integrating self-hosted Postiz publishing engine."""

    def __init__(
        self,
        base_url: str = "http://localhost:4007",
        api_key: str = "",
        client: Optional[PostizClient] = None,
    ):
        if client is not None:
            self._client = client
        else:
            self._client = PostizClient(base_url=base_url, api_key=api_key)

    async def publish(self, job: PublicationJob) -> PublicationReceipt:
        """Publish a video immediately via Postiz (type="now")."""
        return await self._dispatch(job, publish_now=True)

    async def schedule(self, job: PublicationJob) -> PublicationReceipt:
        """Schedule a video for future publication via Postiz."""
        return await self._dispatch(job, publish_now=False)

    async def _dispatch(self, job: PublicationJob, *, publish_now: bool) -> PublicationReceipt:
        """Upload video and create scheduled or immediate post in Postiz."""
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

            # 1. Upload media binary to Postiz
            upload_res = await self._client.upload_file(video_path)
            media_id = upload_res.get("id")
            media_path = upload_res.get("path")
            if not media_id:
                raise PostizError("Postiz upload did not return a valid media ID")

            # 2. Determine target integration ID
            integration_id = job.account_id
            if not integration_id and job.effective_platforms:
                integration_id = job.effective_platforms[0].get("accountId") or job.effective_platforms[0].get("id")

            if not integration_id:
                return PublicationReceipt(
                    item_id=job.item_id,
                    status="failed",
                    error="No SocialChannel / integration ID provided for Postiz dispatch",
                )

            # 3. Create post
            post_type = "now" if publish_now else "schedule"
            date_iso = None if publish_now else job.scheduled_for
            if not publish_now and not date_iso:
                post_type = "now"

            post_res = await self._client.create_post(
                integration_id=str(integration_id),
                content=job.effective_content,
                media_id=media_id,
                media_path=media_path,
                date_iso=date_iso,
                post_type=post_type,
                settings=job.extra.get("settings"),
            )

            # 4. Map response to domain receipt
            post_id = post_res.get("id") or post_res.get("postId")
            state = str(post_res.get("state") or post_res.get("status") or "")
            default_status = "published" if publish_now else "scheduled"
            receipt_status = _map_postiz_status(state, default=default_status)

            return PublicationReceipt(
                item_id=job.item_id,
                status=receipt_status,
                post_id=post_id,
                platform_post_id=post_res.get("releaseId"),
                scheduled_for=job.scheduled_for if not publish_now else None,
                published_at=datetime.now(timezone.utc).isoformat() if receipt_status == "published" else None,
                post_url=post_res.get("releaseURL") or post_res.get("postUrl"),
                error=post_res.get("error"),
                raw_response=post_res,
            )

        except PostizError as exc:
            logger.error("Postiz dispatch error for item %s: %s", job.item_id, exc)
            return PublicationReceipt(
                item_id=job.item_id,
                status="failed",
                error=str(exc),
            )
        except Exception as exc:
            logger.exception("Unexpected error during Postiz dispatch: %s", exc)
            return PublicationReceipt(
                item_id=job.item_id,
                status="failed",
                error=f"Unexpected error: {exc}",
            )

    async def cancel(self, external_id: str) -> bool:
        """Cancel and delete scheduled post from Postiz."""
        try:
            return await self._client.delete_post(external_id)
        except Exception as exc:
            logger.warning("Failed to cancel post %s in Postiz: %s", external_id, exc)
            return False

    async def get_status(self, external_id: str) -> PublicationReceipt:
        """Fetch post status from Postiz."""
        try:
            post_data = await self._client.get_post(external_id)
            if not post_data:
                return PublicationReceipt(
                    item_id="",
                    status="failed",
                    post_id=external_id,
                    error="Post not found in Postiz",
                )

            state = str(post_data.get("state") or post_data.get("status") or "")
            status = _map_postiz_status(state, default="scheduled")

            return PublicationReceipt(
                item_id="",
                status=status,
                post_id=external_id,
                platform_post_id=post_data.get("releaseId"),
                post_url=post_data.get("releaseURL") or post_data.get("postUrl"),
                error=post_data.get("error"),
                raw_response=post_data,
            )
        except Exception as exc:
            return PublicationReceipt(
                item_id="",
                status="failed",
                post_id=external_id,
                error=str(exc),
            )

    async def list_accounts(self, brand_id: Optional[str] = None) -> List[SocialChannel]:
        """Fetch connected SocialChannels from Postiz, mapping them to domain SocialChannel."""
        try:
            integrations = await self._client.list_integrations(group_id=brand_id)
            channels: List[SocialChannel] = []
            for item in integrations:
                integration_id = item.get("id") or item.get("_id") or ""
                provider = item.get("identifier") or item.get("providerIdentifier") or "unknown"
                name = item.get("name") or item.get("profile") or f"{provider}_{integration_id[:6]}"
                avatar = item.get("picture") or item.get("avatar") or None
                disabled = item.get("disabled", False)

                channels.append(
                    SocialChannel(
                        id=str(integration_id),
                        platform=str(provider).lower(),
                        name=str(name),
                        connected=not disabled,
                        avatar_url=avatar,
                    )
                )
            return channels
        except Exception as exc:
            logger.warning("Error listing Postiz integrations: %s", exc)
            return []

    async def find_next_slot(self, channel_id: str) -> Optional[datetime]:
        """Query Postiz find-slot endpoint for the given integration."""
        try:
            return await self._client.find_slot(channel_id)
        except Exception as exc:
            logger.warning("Error querying Postiz slot for %s: %s", channel_id, exc)
            return None

    async def list_scheduled(
        self, customer_id: str, start_date: str, end_date: str
    ) -> List[Dict[str, Any]]:
        """List scheduled posts in Postiz within the given date window."""
        try:
            return await self._client.list_posts(
                customer_id=customer_id, start_date=start_date, end_date=end_date
            )
        except Exception as exc:
            logger.warning("Error listing scheduled posts from Postiz: %s", exc)
            return []

    async def get_metrics(self, external_id: str) -> Dict[str, Any]:
        """Query engagement metrics for a post from Postiz."""
        try:
            return await self._client.get_metrics(external_id)
        except Exception as exc:
            logger.warning("Error fetching metrics for %s from Postiz: %s", external_id, exc)
            return {}
