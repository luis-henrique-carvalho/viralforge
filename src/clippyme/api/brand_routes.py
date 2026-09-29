"""FastAPI router for Brand Management & Sovereign Workspaces in ViralForge.

Covers Brand profiles, Social Channels, Publishing slots, and Workspace state.
"""
from __future__ import annotations

import asyncio
import contextlib
import dataclasses
import logging
import os
import tempfile
from typing import Any

from fastapi import APIRouter, File, Request, Response, UploadFile, status

from clippyme.api.brand_schemas import (
    AutoScheduleRequest,
    BrandChannelBindRequest,
    BrandCreate,
    BrandListResponse,
    BrandPublishRequest,
    BrandResponse,
    BrandUpdate,
    BrandWorkspaceResponse,
    ScheduledTimelineResponse,
    ScheduleSlotsRequest,
    SocialChannelResponse,
    WorkspaceSummaryResponse,
)
from clippyme.api.viral_studio_schemas import (
    DispatchJobAcceptedResponse,
    ViralItem,
)
from clippyme.domain import brand_store, brand_workspace_service
from clippyme.domain.publish_dispatch_service import dispatch_service
from clippyme.domain.social_publisher_port import get_social_publisher

logger = logging.getLogger("clippyme.api.brand_routes")

router = APIRouter(tags=["brands"])


@router.get("", response_model=BrandListResponse)
@router.get("/", response_model=BrandListResponse, include_in_schema=False)
async def list_brands():
    """List all configured brand profiles."""
    brands = await asyncio.to_thread(brand_store.list_brands)
    return BrandListResponse(brands=brands, total=len(brands))


@router.get("/publishing/workspaces", response_model=list[WorkspaceSummaryResponse])
async def list_publishing_workspaces(provider: str | None = None):
    """List available workspaces or customer groups from the active publishing provider."""
    provider_name = provider or os.environ.get("PUBLISHING_PROVIDER") or "postiz"
    publisher = get_social_publisher(provider=provider_name)
    workspaces = await publisher.list_workspaces()
    return [
        WorkspaceSummaryResponse(
            id=ws.id,
            name=ws.name,
            provider=ws.provider,
        )
        for ws in workspaces
    ]


@router.get("/{id}", response_model=BrandResponse)
async def get_brand(id: str):
    """Retrieve a single brand profile by ID."""
    brand = await asyncio.to_thread(brand_store.get_brand_or_raise, id)
    return brand


@router.post("", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=BrandResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_brand(payload: BrandCreate):
    """Create and persist a new brand profile."""
    brand = await asyncio.to_thread(brand_store.create_brand, payload)
    return brand


@router.patch("/{id}", response_model=BrandResponse)
async def update_brand(id: str, payload: BrandUpdate):
    """Partially update an existing brand profile."""
    brand = await asyncio.to_thread(brand_store.update_brand, id, payload)
    return brand


def _save_avatar_file(path: str, data: bytes) -> None:
    parent_dir = os.path.dirname(os.path.abspath(path))
    os.makedirs(parent_dir, mode=0o700, exist_ok=True)
    fd, temp_path = tempfile.mkstemp(dir=parent_dir, prefix=".tmp_avatar_", suffix=".tmp")
    try:
        try:
            os.fchmod(fd, 0o600)
        except (AttributeError, OSError):
            pass
        with os.fdopen(fd, "wb") as f:
            f.write(data)
            f.flush()
            os.fsync(f.fileno())
        os.replace(temp_path, path)
    except Exception:
        with contextlib.suppress(OSError):
            os.unlink(temp_path)
        raise


def _to_social_channel_responses(
    channels: list[Any],
    provider_name: str,
) -> list[SocialChannelResponse]:
    return [
        SocialChannelResponse(
            id=ch.id,
            name=ch.name,
            platform=ch.platform,
            avatar_url=ch.avatar_url,
            handle=ch.handle,
            connected=ch.connected,
            provider=provider_name,
            group_id=ch.group_id,
            group_name=ch.group_name,
            bound_to_brand_id=ch.bound_to_brand_id,
            bound_to_brand_name=ch.bound_to_brand_name,
        )
        for ch in channels
    ]


@router.post("/{id}/avatar", response_model=BrandResponse)
async def upload_brand_avatar(id: str, file: UploadFile = File(...)):
    """Upload and attach a custom avatar image to a brand profile."""
    await asyncio.to_thread(brand_store.get_brand_or_raise, id)
    ext = os.path.splitext(file.filename or "")[1] or ".png"
    upload_dir = os.path.join("data", "uploads", "brands")
    target_path = os.path.join(upload_dir, f"{id}_avatar{ext}")

    content = await file.read()
    await asyncio.to_thread(_save_avatar_file, target_path, content)

    updated = await asyncio.to_thread(
        brand_store.update_brand,
        id,
        BrandUpdate(avatar_path=target_path),
    )
    return updated


@router.get("/{id}/workspace", response_model=BrandWorkspaceResponse)
async def get_brand_workspace(id: str):
    """Retrieve complete workspace state for a brand."""
    data = await brand_workspace_service.get_workspace_summary(id)
    return BrandWorkspaceResponse(**data)


@router.get("/{id}/channels", response_model=list[SocialChannelResponse])
async def list_brand_channels(id: str):
    """List social media channels bound to this brand from its active provider."""
    channels = await brand_workspace_service.get_brand_channels(id, all_available=False)
    brand = brand_store.get_brand_or_raise(id)
    provider_name = brand_workspace_service.get_brand_active_provider(brand)
    return _to_social_channel_responses(channels, provider_name)


@router.get("/{id}/channels/available", response_model=list[SocialChannelResponse])
async def list_available_brand_channels(id: str):
    """List all accounts authenticated in the active provider available for binding to this brand."""
    channels = await brand_workspace_service.get_brand_channels(id, all_available=True)
    brand = brand_store.get_brand_or_raise(id)
    provider_name = brand_workspace_service.get_brand_active_provider(brand)
    return _to_social_channel_responses(channels, provider_name)


@router.post("/{id}/channels/bind", response_model=BrandResponse)
async def bind_brand_channels(id: str, req: BrandChannelBindRequest):
    """Bind selected channel IDs and optionally a workspace_id to this brand."""
    updated = await brand_workspace_service.bind_brand_channels(
        brand_id=id,
        channel_ids=req.channel_ids,
        workspace_id=req.workspace_id,
    )
    return BrandResponse(**updated)


@router.post("/{id}/channels/connect-url")
async def get_brand_channel_connect_url(id: str):
    """Get channel connection URL for the active publisher provider."""
    brand = brand_store.get_brand_or_raise(id)
    provider_name = brand_workspace_service.get_brand_active_provider(brand)
    publisher = get_social_publisher(provider=provider_name)
    customer_id = brand_workspace_service.get_brand_customer_id(brand, provider_name)
    url = await publisher.get_connect_channel_url(brand_id=customer_id or id)
    return {"url": url}


@router.get("/{id}/videos", response_model=list[ViralItem])
async def get_brand_videos(id: str, status: str | None = None):
    """List all video items belonging to a brand across batches."""
    items = await asyncio.to_thread(brand_workspace_service.get_brand_videos, id, status=status)
    return [ViralItem(**item) for item in items]


async def _handle_brand_dispatch(
    brand_id: str,
    item_id: str,
    channel_ids: list[str] | None,
    scheduled_for: str | None,
    publish_now: bool,
    is_sync: bool,
    response: Response,
) -> dict[str, Any]:
    """Internal helper to dispatch or schedule a video synchronously or via async queue."""
    if is_sync:
        if not publish_now and not scheduled_for:
            receipts = await brand_workspace_service.auto_schedule_brand_video(
                brand_id=brand_id,
                item_id=item_id,
                channel_ids=channel_ids,
            )
        else:
            receipts = await brand_workspace_service.publish_brand_video(
                brand_id=brand_id,
                item_id=item_id,
                channel_ids=channel_ids or [],
                scheduled_for=scheduled_for,
                publish_now=publish_now,
            )
        return {
            "success": True,
            "job_id": None,
            "item_id": item_id,
            "brand_id": brand_id,
            "status": "PUBLISHED" if publish_now else "SCHEDULED",
            "scheduled_for": scheduled_for,
            "channels_count": len(channel_ids or receipts),
            "receipts": [dataclasses.asdict(r) for r in receipts],
        }

    job = await dispatch_service.enqueue_dispatch(
        brand_id=brand_id,
        item_id=item_id,
        channel_ids=channel_ids,
        scheduled_for=scheduled_for,
        publish_now=publish_now,
    )
    response.status_code = status.HTTP_202_ACCEPTED
    return {
        "success": True,
        "job_id": job.job_id,
        "item_id": item_id,
        "brand_id": brand_id,
        "status": job.status,
        "scheduled_for": job.scheduled_for,
        "channels_count": len(job.channel_ids),
        "receipts": [],
    }


@router.post(
    "/{id}/auto-schedule",
    response_model=DispatchJobAcceptedResponse,
)
async def auto_schedule_video(id: str, payload: AutoScheduleRequest, request: Request, response: Response):
    """1-Click auto-schedule an approved video into next available slot(s) via async dispatch queue."""
    return await _handle_brand_dispatch(
        brand_id=id,
        item_id=payload.item_id,
        channel_ids=payload.channel_ids,
        scheduled_for=None,
        publish_now=False,
        is_sync=request.query_params.get("sync") == "true",
        response=response,
    )


@router.post(
    "/{id}/publish",
    response_model=DispatchJobAcceptedResponse,
)
async def publish_brand_video(id: str, payload: BrandPublishRequest, request: Request, response: Response):
    """Publish or schedule a brand video to target channels via async dispatch queue."""
    return await _handle_brand_dispatch(
        brand_id=id,
        item_id=payload.item_id,
        channel_ids=payload.channel_ids,
        scheduled_for=payload.scheduled_for,
        publish_now=payload.publish_now,
        is_sync=request.query_params.get("sync") == "true",
        response=response,
    )


@router.post("/{id}/schedule-slots", response_model=BrandResponse)
async def update_brand_schedule_slots(id: str, payload: ScheduleSlotsRequest):
    """Update preferred posting schedule slots, timezone, and frequency for a brand."""
    brand = await asyncio.to_thread(
        brand_store.update_brand_schedule,
        brand_id=id,
        slots=payload.slots,
        timezone=payload.timezone,
        frequency=payload.frequency,
    )
    return BrandResponse(**brand)


@router.get("/{id}/scheduled", response_model=ScheduledTimelineResponse)
async def list_brand_scheduled(
    id: str,
    start_date: str | None = None,
    end_date: str | None = None,
):
    """List scheduled and published posts timeline for a brand."""
    posts = await brand_workspace_service.list_brand_scheduled_posts(
        brand_id=id,
        start_date=start_date,
        end_date=end_date,
    )
    return ScheduledTimelineResponse(brand_id=id, posts=posts, total=len(posts))


@router.delete("/{id}/scheduled/{post_id}")
async def cancel_brand_scheduled(id: str, post_id: str):
    """Cancel a scheduled post in provider and revert item status to APPROVED."""
    success = await brand_workspace_service.cancel_brand_scheduled_post(brand_id=id, post_id=post_id)
    return {"success": success, "post_id": post_id}


@router.post("/{id}/scheduled/{post_id}/publish-now", status_code=status.HTTP_202_ACCEPTED)
async def publish_brand_scheduled_now(id: str, post_id: str):
    """Trigger immediate publication of a scheduled post."""
    result = await brand_workspace_service.publish_brand_scheduled_now(brand_id=id, post_id=post_id)
    return result
