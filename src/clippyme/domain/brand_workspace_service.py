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


KNOWN_PROVIDERS = {"postiz", "zernio", "mock"}


def get_brand_active_provider(brand: Dict[str, Any]) -> str:
    """Resolve the active publishing provider for a brand.

    Precedence:
    1. A profile in brand["publishing_profiles"] with `active: True` matching a known provider.
    2. The known provider profile with the most recent `linked_at` ISO timestamp.
    3. The first known provider key in brand["publishing_profiles"].
    4. Global default publishing provider from persistent config / env.
    """
    profiles = brand.get("publishing_profiles") or {}
    if isinstance(profiles, dict) and profiles:
        for provider_name, profile_data in profiles.items():
            clean_name = str(provider_name).strip().lower()
            if clean_name in KNOWN_PROVIDERS and isinstance(profile_data, dict) and profile_data.get("active") is True:
                return clean_name

        sorted_profiles = []
        for provider_name, profile_data in profiles.items():
            clean_name = str(provider_name).strip().lower()
            if clean_name in KNOWN_PROVIDERS and isinstance(profile_data, dict):
                linked_at = profile_data.get("linked_at") or ""
                sorted_profiles.append((linked_at, clean_name))
        if sorted_profiles:
            sorted_profiles.sort(key=lambda x: x[0], reverse=True)
            if sorted_profiles[0][1]:
                return sorted_profiles[0][1]

        for k in profiles.keys():
            clean_name = str(k).strip().lower()
            if clean_name in KNOWN_PROVIDERS:
                return clean_name

    from clippyme.storage.config_store import load_persistent_config
    cfg = load_persistent_config() or {}
    return (os.environ.get("PUBLISHING_PROVIDER") or cfg.get("PUBLISHING_PROVIDER", "postiz")).strip().lower()


def get_brand_customer_id(brand: Dict[str, Any], provider_name: str) -> Optional[str]:
    """Resolve customer/workspace identifier for a brand on a specific provider."""
    profiles = brand.get("publishing_profiles") or {}
    profile_data = profiles.get(provider_name) if isinstance(profiles, dict) else None
    if isinstance(profile_data, dict):
        cid = str(
            profile_data.get("customer_id")
            or profile_data.get("workspace_id")
            or ""
        ).strip()
        if cid and cid.lower() not in ("auto", "none", "default"):
            return cid
    return None


async def get_brand_channels(brand_id: str, *, all_available: bool = False) -> List[SocialChannel]:
    """Retrieve social channels for a brand from its active publisher provider.

    If all_available is True:
        Returns all accounts authenticated in the active provider, annotated with
        group metadata and cross-brand binding info (for the selection modal).
    If all_available is False:
        Returns only the accounts bound to this specific brand (by channel_ids or workspace_id).
    """
    brand = viral_studio_store.get_brand_or_raise(brand_id)
    provider_name = get_brand_active_provider(brand)
    port = get_social_publisher(provider=provider_name)

    if all_available:
        all_accounts = await port.list_accounts(customer_id=None)
        all_brands = viral_studio_store.list_brands()
        channel_to_brand: Dict[str, tuple[str, str]] = {}
        for b in all_brands:
            b_id = str(b.get("id") or "")
            b_name = str(b.get("name") or b_id)
            if b_id == brand_id:
                continue
            b_profiles = b.get("publishing_profiles") or {}
            for _, p_data in (b_profiles.items() if isinstance(b_profiles, dict) else []):
                if isinstance(p_data, dict):
                    for cid in p_data.get("channel_ids") or []:
                        channel_to_brand[str(cid)] = (b_id, b_name)

        enriched: List[SocialChannel] = []
        for ch in all_accounts:
            bound_b_id, bound_b_name = channel_to_brand.get(str(ch.id), (None, None))
            enriched.append(
                SocialChannel(
                    id=ch.id,
                    platform=ch.platform,
                    name=ch.name,
                    handle=ch.handle,
                    connected=ch.connected,
                    avatar_url=ch.avatar_url,
                    provider=ch.provider,
                    group_id=ch.group_id,
                    group_name=ch.group_name,
                    bound_to_brand_id=bound_b_id,
                    bound_to_brand_name=bound_b_name,
                    raw_data=ch.raw_data,
                )
            )
        return enriched

    profiles = brand.get("publishing_profiles") or {}
    profile_data = profiles.get(provider_name) if isinstance(profiles, dict) else {}
    if not isinstance(profile_data, dict):
        profile_data = {}

    channel_ids = [str(cid).strip() for cid in (profile_data.get("channel_ids") or []) if str(cid).strip()]
    workspace_id = get_brand_customer_id(brand, provider_name)

    if channel_ids:
        all_channels = await port.list_accounts(customer_id=None)
        return [ch for ch in all_channels if str(ch.id) in channel_ids]

    if workspace_id:
        return await port.list_accounts(customer_id=workspace_id)

    return []


async def bind_brand_channels(
    brand_id: str,
    channel_ids: List[str],
    workspace_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Bind specific channel IDs and optionally a workspace_id to the brand's active provider profile.
    
    Enforces 1:1 Exclusive Channel Ownership: Any selected channel is automatically
    unbound from other brands across the system.
    """
    brand = viral_studio_store.get_brand_or_raise(brand_id)
    provider_name = get_brand_active_provider(brand)
    port = get_social_publisher(provider=provider_name)

    # 1. Enforce 1:1 Exclusive Channel Ownership across all brands
    target_channel_set = set(str(cid).strip() for cid in channel_ids if str(cid).strip())
    if target_channel_set:
        all_brands = viral_studio_store.list_brands()
        for other_b in all_brands:
            other_id = str(other_b.get("id") or "")
            if other_id == brand_id:
                continue
            other_profiles = dict(other_b.get("publishing_profiles") or {})
            changed = False
            for p_key, p_val in other_profiles.items():
                if isinstance(p_val, dict):
                    existing_cids = p_val.get("channel_ids") or []
                    filtered_cids = [cid for cid in existing_cids if str(cid).strip() not in target_channel_set]
                    if len(filtered_cids) != len(existing_cids):
                        p_val["channel_ids"] = filtered_cids
                        changed = True
            if changed:
                viral_studio_store.update_brand(other_id, {"publishing_profiles": other_profiles})

    # 2. Update current brand's profile
    profiles = dict(brand.get("publishing_profiles") or {})
    current_profile = dict(profiles.get(provider_name) or {})

    current_profile["active"] = True
    current_profile["channel_ids"] = list(channel_ids)

    # 3. Ensure workspace / profile on provider
    clean_req_ws = str(workspace_id).strip() if workspace_id else ""
    if clean_req_ws and clean_req_ws.lower() not in ("none", "auto"):
        current_profile["workspace_id"] = clean_req_ws
        current_profile["customer_id"] = clean_req_ws
    elif not current_profile.get("workspace_id") or str(current_profile.get("workspace_id")).lower() in ("auto", "none", ""):
        try:
            ensured_ws = await port.ensure_brand_workspace(
                brand_name=brand.get("name", brand_id),
                brand_id=brand_id,
            )
            if ensured_ws:
                current_profile["workspace_id"] = ensured_ws
                current_profile["customer_id"] = ensured_ws
        except Exception as exc:
            logger.warning("Auto workspace ensure failed for brand %s: %s", brand_id, exc)

    # 4. Move / assign channels to the provider workspace (e.g. Zernio profile)
    final_ws = current_profile.get("workspace_id")
    if final_ws and str(final_ws).lower() not in ("none", "auto", ""):
        for ch_id in channel_ids:
            try:
                await port.assign_channel_to_workspace(channel_id=str(ch_id), workspace_id=str(final_ws))
            except Exception as exc:
                logger.warning("Failed assigning channel %s to workspace %s: %s", ch_id, final_ws, exc)

    current_profile["linked_at"] = datetime.now(timezone.utc).isoformat()
    profiles[provider_name] = current_profile
    brand_updates: Dict[str, Any] = {"publishing_profiles": profiles}

    # If brand doesn't have an avatar_url or avatar_path, inherit from the first bound channel with an avatar
    if not brand.get("avatar_path") and not (brand.get("avatar_url") or "").strip():
        try:
            ch_list = await port.list_accounts(customer_id=None)
            for ch in ch_list:
                if str(ch.id) in target_channel_set and ch.avatar_url:
                    brand_updates["avatar_url"] = ch.avatar_url
                    break
        except Exception as exc:
            logger.debug("Could not auto-inherit channel avatar on bind: %s", exc)

    return viral_studio_store.update_brand(brand_id, brand_updates)


async def get_workspace_summary(brand_id: str) -> Dict[str, Any]:
    """Aggregate complete state for the Brand Workspace view."""
    brand = viral_studio_store.get_brand_or_raise(brand_id)
    provider_name = get_brand_active_provider(brand)

    # 1. Fetch connected channels for this brand on its active provider
    channels = await get_brand_channels(brand_id, all_available=False)

    # Auto-populate brand avatar_url if missing and a connected channel has an avatar
    if not brand.get("avatar_path") and not (brand.get("avatar_url") or "").strip() and channels:
        for ch in channels:
            if ch.avatar_url:
                brand = viral_studio_store.update_brand(brand_id, {"avatar_url": ch.avatar_url})
                break

    # 2. Query items across batches belonging to this brand
    items = viral_studio_store.get_items_by_brand(brand_id=brand_id)

    total_videos = len(items)
    approved_videos = sum(1 for i in items if str(i.get("status") or "").upper() == "APPROVED")
    scheduled_posts = sum(1 for i in items if str(i.get("status") or "").upper() == "SCHEDULED")
    published_posts = sum(1 for i in items if str(i.get("status") or "").upper() == "PUBLISHED")

    # 3. Retrieve attached template info
    template_id = brand.get("template_id", "classic-affiliate")
    template = viral_studio_store.get_template(template_id)

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
                "handle": ch.handle,
                "group_id": ch.group_id,
                "group_name": ch.group_name,
                "provider": ch.provider,
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
        ch_id = (
            channel_ids[idx]
            if channel_ids and idx < len(channel_ids)
            else (receipt.raw_response.get("integrationId") if receipt.raw_response else None)
        )
        record = {
            "id": receipt.post_id or f"post_{item_id}_{receipt.platform_post_id or ch_id or idx}",
            "post_id": receipt.post_id,
            "channel_id": ch_id,
            "platform_post_id": receipt.platform_post_id,
            "scheduled_for": scheduled_for or receipt.scheduled_for,
            "published_at": receipt.published_at,
            "status": receipt.status,
            "post_url": receipt.post_url,
            "error": receipt.error,
            "updated_at": now,
        }
        viral_studio_store.append_publication_record(
            batch_id=batch_id,
            item_id=item_id,
            record=record,
        )

    if any(r.status in ("scheduled", "published") for r in receipts):
        viral_studio_store.update_item(
            item_id=item_id,
            updates={
                "status": "PUBLISHED" if publish_now else "SCHEDULED",
                "scheduled_for": scheduled_for if not publish_now else None,
            },
        )
    elif all(r.status == "failed" for r in receipts) and receipts:
        viral_studio_store.update_item_status(
            batch_id=batch_id,
            item_id=item_id,
            status="FAILED",
        )


async def auto_schedule_brand_video(
    brand_id: str,
    item_id: str,
    channel_ids: Optional[List[str]] = None,
) -> List[PublicationReceipt]:
    """1-Click auto-schedule an approved video using the brand's posting schedule and next available slot.

    Enforces:
    - Domain Authority: ViralForge calculates scheduled_for timestamp from brand posting schedule.
    - Multi-slot daily traversal: uses brand.posting_schedule slots & timezone.
    - Omnichannel Synchronized Publication: all brand channels are scheduled for the exact same slot.
    - Publication Failure Isolation: partial successes are saved; failed channels are recorded with error.
    """
    brand = viral_studio_store.get_brand_or_raise(brand_id)
    item, batch_id, video_path = _validate_item_for_brand(brand_id, item_id, require_approved=True)

    provider_name = get_brand_active_provider(brand)
    port = get_social_publisher(provider=provider_name)

    # Determine target channels
    if not channel_ids:
        accounts = await get_brand_channels(brand_id, all_available=False)
        channel_ids = [ch.id for ch in accounts if ch.connected]

    if not channel_ids:
        raise ValidationError(f"No connected social channels found for brand '{brand_id}'")

    # 1. Resolve posting schedule and calculate synchronized slot
    posting_schedule = brand.get("posting_schedule") or {}
    slots_list = posting_schedule.get("slots") or ["18:00"]
    timezone_str = posting_schedule.get("timezone") or "America/Sao_Paulo"

    primary_acc = channel_ids[0] if channel_ids else None
    avail_slots = viral_studio_store.get_next_available_slots(
        account_id=primary_acc,
        brand_id=brand_id,
        count=1,
        slots=slots_list,
        timezone_str=timezone_str,
    )

    if avail_slots:
        slot_iso = avail_slots[0].isoformat()
    else:
        now_tz = datetime.now(timezone.utc)
        slot_iso = (now_tz + timedelta(days=1)).replace(hour=18, minute=0, second=0, microsecond=0).isoformat()

    title = item.get("selected_headline") or item.get("headline") or brand.get("name")
    caption = item.get("caption") or brand.get("default_cta") or ""

    receipts: List[PublicationReceipt] = []

    # 2. Dispatch to Publisher Port for each channel (Omnichannel with Failure Isolation)
    for channel_id in channel_ids:
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
        try:
            receipt = await port.schedule(job)
            receipts.append(receipt)
        except Exception as exc:
            logger.error("Failed auto-scheduling item %s on channel %s: %s", item_id, channel_id, exc)
            receipts.append(
                PublicationReceipt(
                    item_id=item_id,
                    status="failed",
                    post_id=None,
                    scheduled_for=slot_iso,
                    error=str(exc),
                    raw_response={"error": str(exc)},
                )
            )

    # 3. Record receipts and update item status
    _record_receipts(batch_id, item_id, receipts, scheduled_for=slot_iso, publish_now=False, channel_ids=channel_ids)
    return receipts


async def publish_brand_video(
    brand_id: str,
    item_id: str,
    channel_ids: List[str],
    scheduled_for: Optional[str] = None,
    publish_now: bool = False,
) -> List[PublicationReceipt]:
    """Publish or schedule video to specified channels with failure isolation."""
    brand = viral_studio_store.get_brand_or_raise(brand_id)
    item, batch_id, video_path = _validate_item_for_brand(brand_id, item_id, require_approved=False)

    if not channel_ids:
        raise ValidationError("At least one target channel ID is required")

    provider_name = get_brand_active_provider(brand)
    port = get_social_publisher(provider=provider_name)
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
        try:
            receipt = await (port.publish(job) if publish_now else port.schedule(job))
            receipts.append(receipt)
        except Exception as exc:
            logger.error("Failed publishing/scheduling item %s on channel %s: %s", item_id, channel_id, exc)
            receipts.append(
                PublicationReceipt(
                    item_id=item_id,
                    status="failed",
                    post_id=None,
                    scheduled_for=scheduled_for,
                    error=str(exc),
                    raw_response={"error": str(exc)},
                )
            )

    _record_receipts(batch_id, item_id, receipts, scheduled_for=scheduled_for, publish_now=publish_now, channel_ids=channel_ids)
    return receipts


async def cancel_brand_scheduled_post(brand_id: str, post_id: str) -> bool:
    """Cancel scheduled post in provider and atomically revert item status to APPROVED."""
    brand = viral_studio_store.get_brand_or_raise(brand_id)
    provider_name = get_brand_active_provider(brand)
    port = get_social_publisher(provider=provider_name)

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
    provider_name = get_brand_active_provider(brand)
    port = get_social_publisher(provider=provider_name)
    customer_id = get_brand_customer_id(brand, provider_name)

    posts = await port.list_scheduled(
        customer_id=customer_id,
        start_date=start_date or "",
        end_date=end_date or "",
    )

    if not posts:
        items = viral_studio_store.get_items_by_brand(brand_id=brand_id)
        result_posts = []
        for item in items:
            for rec in item.get("publication_records", []):
                rec_status = str(rec.get("status", "")).lower()
                if rec_status in ("cancelled", "canceled"):
                    continue
                p_id = str(rec.get("post_id") or rec.get("id") or f"post_{item.get('item_id', 'unknown')}")
                sched = rec.get("scheduled_for") or rec.get("scheduled_time")
                result_posts.append({
                    "id": p_id,
                    "post_id": p_id,
                    "brand_id": brand_id,
                    "item_id": item.get("item_id") or item.get("id"),
                    "title": item.get("selected_headline") or item.get("headline") or "Publicação",
                    "content": item.get("caption") or "",
                    "status": rec.get("status", "scheduled"),
                    "scheduled_for": sched,
                    "scheduled_time": sched,
                    "published_at": rec.get("published_at"),
                    "post_url": rec.get("post_url") or rec.get("external_url"),
                    "external_url": rec.get("post_url") or rec.get("external_url"),
                    "channels": [rec.get("channel_id")] if rec.get("channel_id") else [],
                })
        return result_posts

    # When provider returns posts, ensure brand_id and filter cancelled
    filtered = []
    for p in posts:
        if isinstance(p, dict):
            if str(p.get("status", "")).lower() in ("cancelled", "canceled"):
                continue
            p_copy = dict(p)
            p_copy.setdefault("brand_id", brand_id)
            filtered.append(p_copy)
    return filtered
