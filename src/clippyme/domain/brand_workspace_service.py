"""brand_workspace_service — Deep Domain Service for Brand Workspace & Operations.

Follows /codebase-design and /domain-modeling:
- Sovereign Brand Workspace management (/viral-studio/brands/:brandId)
- Strict multi-brand isolation: validates item.brand_id == brand_id before dispatch
- 1-Click Auto-Scheduling with port.find_next_slot() and local gap-filling fallback
- Schedule Cancellation with atomic local status reversion to APPROVED in batches.json
- Zero database duplication: queries live provider for scheduled posts and metrics on-demand
"""
from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from clippyme.domain.errors import NotFoundError, ValidationError
from clippyme.domain.social_publisher_port import (
    PublicationJob,
    PublicationReceipt,
    SocialChannel,
    get_social_publisher,
)
from clippyme.domain import viral_studio_store

logger = logging.getLogger("clippyme.brand_workspace_service")


async def get_workspace_summary(brand_id: str) -> Dict[str, Any]:
    """Aggregate complete state for the Brand Workspace view."""
    brand = viral_studio_store.get_brand_or_raise(brand_id)
    port = get_social_publisher()

    # 1. Fetch connected channels for this brand (resolving Postiz customer_id if set)
    customer_id = (
        brand.get("publishing_profiles", {})
        .get("postiz", {})
        .get("customer_id")
        or brand_id
    )
    channels = await port.list_accounts(brand_id=customer_id)

    # 2. Query items across batches belonging to this brand
    items = viral_studio_store.get_items_by_brand(brand_id=brand_id)

    total_videos = len(items)
    approved_videos = sum(1 for i in items if str(i.get("status") or "").upper() == "APPROVED")
    scheduled_posts = sum(1 for i in items if str(i.get("status") or "").upper() == "SCHEDULED")
    published_posts = sum(1 for i in items if str(i.get("status") or "").upper() == "PUBLISHED")

    # 3. Retrieve attached template info
    template_id = brand.get("template_id", "classic-affiliate")
    template = viral_studio_store.get_template(template_id)

    # 4. Active provider identifier
    from clippyme.storage.config_store import load_persistent_config
    cfg = load_persistent_config() or {}
    provider_name = os.environ.get("PUBLISHING_PROVIDER") or cfg.get("PUBLISHING_PROVIDER", "postiz")

    return {
        "brand": brand,
        "provider": provider_name,
        "counts": {
            "total_videos": total_videos,
            "approved_videos": approved_videos,
            "scheduled_posts": scheduled_posts,
            "published_posts": published_posts,
        },
        "channels": [
            {
                "id": ch.id,
                "platform": ch.platform,
                "name": ch.name,
                "connected": ch.connected,
                "avatar_url": ch.avatar_url,
            }
            for ch in channels
        ],
        "template": template,
    }


def get_brand_videos(brand_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve video items belonging to a specific brand with optional status filtering."""
    _ = viral_studio_store.get_brand_or_raise(brand_id)
    return viral_studio_store.get_items_by_brand(brand_id=brand_id, status=status)


def _validate_item_for_brand(
    brand_id: str,
    item_id: str,
    require_approved: bool = False,
) -> tuple[Dict[str, Any], str, str]:
    """Locate and validate item belongs to brand and has rendered media."""
    item, batch_id, batch = viral_studio_store.find_item_batch(item_id)
    item_brand = item.get("brand_id") or batch.get("brand_id")
    if item_brand != brand_id:
        raise ValidationError(
            f"Brand isolation mismatch: video '{item_id}' belongs to brand '{item_brand}', not '{brand_id}'"
        )

    if require_approved:
        item_status = str(item.get("status") or "").upper()
        if item_status != "APPROVED":
            raise ValidationError(
                f"Only APPROVED items can be auto-scheduled (item '{item_id}' is currently '{item_status}')"
            )

    video_path = item.get("rendered_path")
    if not video_path or not os.path.isfile(video_path):
        raise ValidationError(f"Rendered video file not found at path: {video_path}")

    return item, batch_id, str(video_path)


def _record_receipts(
    batch_id: str,
    item_id: str,
    receipts: List[PublicationReceipt],
    scheduled_for: Optional[str] = None,
    publish_now: bool = False,
    channel_ids: Optional[List[str]] = None,
) -> None:
    """Durably record publication receipts and advance item status."""
    now = datetime.now(timezone.utc).isoformat()
    for idx, receipt in enumerate(receipts):
        if receipt.status in ("scheduled", "published"):
            ch_id = (
                channel_ids[idx]
                if channel_ids and idx < len(channel_ids)
                else (receipt.raw_response.get("integrationId") if receipt.raw_response else None)
            )
            record = {
                "id": receipt.post_id or f"post_{item_id}_{receipt.platform_post_id or 'ch'}",
                "post_id": receipt.post_id,
                "channel_id": ch_id,
                "platform_post_id": receipt.platform_post_id,
                "scheduled_for": scheduled_for or receipt.scheduled_for,
                "published_at": receipt.published_at,
                "status": receipt.status,
                "post_url": receipt.post_url,
                "updated_at": now,
            }
            viral_studio_store.append_publication_record(
                batch_id=batch_id,
                item_id=item_id,
                record=record,
            )

    if any(r.status in ("scheduled", "published") for r in receipts):
        viral_studio_store.update_item_status(
            batch_id=batch_id,
            item_id=item_id,
            status="PUBLISHED" if publish_now else "SCHEDULED",
        )


async def auto_schedule_brand_video(
    brand_id: str,
    item_id: str,
    channel_ids: Optional[List[str]] = None,
) -> List[PublicationReceipt]:
    """1-Click auto-schedule an approved video using the next available slot(s)."""
    brand = viral_studio_store.get_brand_or_raise(brand_id)
    item, batch_id, video_path = _validate_item_for_brand(brand_id, item_id, require_approved=True)

    port = get_social_publisher()

    # Determine target channels
    if not channel_ids:
        accounts = await port.list_accounts(brand_id=brand_id)
        channel_ids = [ch.id for ch in accounts if ch.connected]

    if not channel_ids:
        raise ValidationError(f"No connected social channels found for brand '{brand_id}'")

    receipts: List[PublicationReceipt] = []
    timezone_str = brand.get("posting_schedule", {}).get("timezone") or "America/Sao_Paulo"

    for channel_id in channel_ids:
        # 1. Discover slot via provider or local schedule
        slot_dt = await port.find_next_slot(channel_id)
        if slot_dt is None:
            # Fallback to local gap-filling scheduling
            preferred_time = "18:00"
            slots = brand.get("posting_schedule", {}).get("slots", [])
            if slots:
                preferred_time = slots[0]
            avail_slots = viral_studio_store.get_next_available_slots(
                account_id=channel_id,
                count=1,
                preferred_time=preferred_time,
                timezone_str=timezone_str,
            )
            slot_iso = avail_slots[0].isoformat() if hasattr(avail_slots[0], "isoformat") else str(avail_slots[0])
        else:
            slot_iso = slot_dt.isoformat()

        # 2. Build Job
        title = item.get("selected_headline") or item.get("headline") or brand.get("name")
        caption = item.get("caption") or brand.get("default_cta") or ""

        job = PublicationJob(
            item_id=item_id,
            media_path=video_path,
            title=title,
            caption=caption,
            account_id=channel_id,
            scheduled_for=slot_iso,
            timezone=timezone_str,
            publish_now=False,
        )

        # 3. Dispatch to Publisher Port
        receipt = await port.schedule(job)
        receipts.append(receipt)

    # 4. Record receipts and advance status
    _record_receipts(batch_id, item_id, receipts, scheduled_for=None, publish_now=False, channel_ids=channel_ids)
    return receipts


async def publish_brand_video(
    brand_id: str,
    item_id: str,
    channel_ids: List[str],
    scheduled_for: Optional[str] = None,
    publish_now: bool = False,
) -> List[PublicationReceipt]:
    """Publish or schedule video to specified channels."""
    brand = viral_studio_store.get_brand_or_raise(brand_id)
    item, batch_id, video_path = _validate_item_for_brand(brand_id, item_id, require_approved=False)

    if not channel_ids:
        raise ValidationError("At least one target channel ID is required")

    port = get_social_publisher()
    timezone_str = brand.get("posting_schedule", {}).get("timezone", "America/Sao_Paulo")
    title = item.get("selected_headline") or item.get("headline") or brand.get("name")
    caption = item.get("caption") or brand.get("default_cta") or ""

    receipts: List[PublicationReceipt] = []

    for channel_id in channel_ids:
        job = PublicationJob(
            item_id=item_id,
            media_path=video_path,
            title=title,
            caption=caption,
            account_id=channel_id,
            scheduled_for=scheduled_for,
            timezone=timezone_str,
            publish_now=publish_now,
        )

        receipt = await (port.publish(job) if publish_now else port.schedule(job))
        receipts.append(receipt)

    _record_receipts(batch_id, item_id, receipts, scheduled_for=scheduled_for, publish_now=publish_now, channel_ids=channel_ids)
    return receipts


async def cancel_brand_scheduled_post(brand_id: str, post_id: str) -> bool:
    """Cancel scheduled post in provider and atomically revert item status to APPROVED."""
    _ = viral_studio_store.get_brand_or_raise(brand_id)
    port = get_social_publisher()

    # 1. Cancel in provider
    await port.cancel(post_id)

    # 2. Revert local item status to APPROVED and write cancellation audit record
    reverted_item = viral_studio_store.update_item_status_by_post_id(
        post_id=post_id,
        new_status="APPROVED",
    )

    if reverted_item:
        logger.info(
            "Reverted item %s to APPROVED after cancelling post %s",
            reverted_item.get("item_id") or reverted_item.get("id"),
            post_id,
        )
    return True


async def list_brand_scheduled_posts(
    brand_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Query scheduled and published posts for brand from active provider."""
    brand = viral_studio_store.get_brand_or_raise(brand_id)
    port = get_social_publisher()

    customer_id = (
        brand.get("publishing_profiles", {})
        .get("postiz", {})
        .get("customer_id")
        or brand_id
    )

    posts = await port.list_scheduled(
        customer_id=customer_id,
        start_date=start_date or "",
        end_date=end_date or "",
    )

    if not posts:
        items = viral_studio_store.get_items_by_brand(brand_id=brand_id)
        return [
            {
                "id": rec.get("post_id") or rec.get("id"),
                "item_id": item.get("item_id") or item.get("id"),
                "title": item.get("selected_headline") or item.get("headline"),
                "content": item.get("caption"),
                "status": rec.get("status", "scheduled"),
                "scheduled_for": rec.get("scheduled_for"),
                "published_at": rec.get("published_at"),
                "post_url": rec.get("post_url"),
            }
            for item in items
            for rec in item.get("publication_records", [])
        ]

    return posts
