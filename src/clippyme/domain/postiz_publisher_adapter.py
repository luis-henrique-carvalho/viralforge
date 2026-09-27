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
    WorkspaceSummary,
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

            settings = dict(job.extra.get("settings") or {})
            if "post_type" not in settings:
                settings["post_type"] = "post"

            post_res = await self._client.create_post(
                integration_id=str(integration_id),
                content=job.effective_content,
                media_id=media_id,
                media_path=media_path,
                date_iso=date_iso,
                post_type=post_type,
                settings=settings,
            )

            # 4. Map response to domain receipt
            target_res = (
                post_res[0]
                if isinstance(post_res, list) and post_res
                else (post_res if isinstance(post_res, dict) else {})
            )
            post_id = target_res.get("postId") or target_res.get("id")
            state = str(target_res.get("state") or target_res.get("status") or "")
            default_status = "published" if publish_now else "scheduled"
            receipt_status = _map_postiz_status(state, default=default_status)

            return PublicationReceipt(
                item_id=job.item_id,
                status=receipt_status,
                post_id=post_id,
                platform_post_id=target_res.get("releaseId"),
                scheduled_for=job.scheduled_for if not publish_now else None,
                published_at=datetime.now(timezone.utc).isoformat() if receipt_status == "published" else None,
                post_url=target_res.get("releaseURL") or target_res.get("postUrl"),
                error=target_res.get("error"),
                raw_response=target_res if isinstance(target_res, dict) else {},
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

    async def list_accounts(
        self, customer_id: Optional[str] = None, brand_id: Optional[str] = None, **kwargs: Any
    ) -> List[SocialChannel]:
        """Fetch connected SocialChannels from Postiz, extracting customer group metadata."""
        try:
            target_group = customer_id or brand_id
            integrations = await self._client.list_integrations(group_id=target_group)
            channels: List[SocialChannel] = []
            for item in integrations:
                integration_id = item.get("id") or item.get("_id") or ""
                provider = str(item.get("identifier") or item.get("providerIdentifier") or "unknown").lower()
                platform = provider.replace("-standalone", "")
                name = item.get("name") or item.get("profile") or f"{platform}_{integration_id[:6]}"
                handle = item.get("profile") or item.get("name")
                avatar = item.get("picture") or item.get("avatar") or None
                disabled = item.get("disabled", False)

                cust = item.get("customer") or {}
                group_id = str(cust["id"]) if isinstance(cust, dict) and cust.get("id") else None
                group_name = str(cust["name"]) if isinstance(cust, dict) and cust.get("name") else None

                channels.append(
                    SocialChannel(
                        id=str(integration_id),
                        platform=platform,
                        name=str(name),
                        handle=str(handle) if handle else None,
                        connected=not disabled,
                        avatar_url=avatar,
                        provider="postiz",
                        group_id=group_id,
                        group_name=group_name,
                        raw_data=item if isinstance(item, dict) else {},
                    )
                )
            return channels
        except Exception as exc:
            logger.warning("Error listing Postiz integrations: %s", exc)
            return []

    async def list_workspaces(self) -> List[WorkspaceSummary]:
        """Fetch distinct customer groups from Postiz."""
        from clippyme.domain.social_publisher_port import WorkspaceSummary
        try:
            ws_list = await self._client.list_workspaces()
            return [
                WorkspaceSummary(id=item["id"], name=item["name"], provider="postiz")
                for item in ws_list
            ]
        except Exception as exc:
            logger.warning("Error listing Postiz workspaces: %s", exc)
            return []

    async def ensure_brand_workspace(self, brand_name: str, brand_id: str) -> Optional[str]:
        """Check if an existing Postiz group matches the brand name / id."""
        try:
            groups = await self._client.list_workspaces()
            norm_name = str(brand_name or "").strip().lower()
            norm_id = str(brand_id or "").strip().lower()
            for g in groups:
                g_name = str(g.get("name") or "").strip().lower()
                g_id = str(g.get("id") or "").strip().lower()
                if g_name in (norm_name, norm_id) or g_id in (norm_name, norm_id):
                    return str(g["id"])
            return None
        except Exception as exc:
            logger.warning("Error ensuring Postiz group for brand %s: %s", brand_name, exc)
            return None

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
            raw_posts = await self._client.list_posts(
                customer_id=customer_id, start_date=start_date, end_date=end_date
            )
            mapped: List[Dict[str, Any]] = []
            for p in raw_posts:
                if not isinstance(p, dict):
                    continue
                p_id = str(p.get("id") or p.get("_id") or "")
                date_val = p.get("date") or p.get("publishAt") or p.get("scheduledFor")
                status_raw = str(p.get("status") or p.get("type") or "scheduled").lower()
                status = "published" if status_raw in ("now", "published") else "scheduled"

                # Extract content/title and channels
                content = ""
                channel_names = []
                sub_posts = p.get("posts") or []
                if isinstance(sub_posts, list):
                    for sp in sub_posts:
                        if isinstance(sp, dict):
                            integ = sp.get("integration") or {}
                            if isinstance(integ, dict) and (integ.get("name") or integ.get("profile")):
                                channel_names.append(integ.get("name") or integ.get("profile"))
                            vals = sp.get("value") or []
                            if isinstance(vals, list):
                                for v in vals:
                                    if isinstance(v, dict) and v.get("content"):
                                        content = v.get("content")
                                        break

                mapped.append({
                    "id": p_id,
                    "post_id": p_id,
                    "title": content[:60] if content else (f"Post #{p_id[:8]}" if p_id else "Publicação"),
                    "content": content,
                    "status": status,
                    "scheduled_for": date_val,
                    "scheduled_time": date_val,
                    "channels": channel_names,
                    "raw_response": p,
                })
            return mapped
        except Exception as exc:
            logger.warning("Error listing scheduled posts from Postiz: %s", exc)
            return []

    async def get_connect_channel_url(self, brand_id: Optional[str] = None) -> str:
        """Return connect URL for Postiz integrations dashboard."""
        base = self._client.base_url.rstrip("/")
        return f"{base}/settings/integrations"

    async def get_metrics(self, external_id: str) -> Dict[str, Any]:
        """Query engagement metrics for a post from Postiz."""
        try:
            return await self._client.get_metrics(external_id)
        except Exception as exc:
            logger.warning("Error fetching metrics for %s from Postiz: %s", external_id, exc)
            return {}

