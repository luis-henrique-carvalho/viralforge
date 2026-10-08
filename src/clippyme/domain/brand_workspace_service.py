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
from datetime import UTC, datetime, timedelta
from typing import Any

from clippyme.domain import viral_studio_store
from clippyme.domain.errors import NotFoundError, ValidationError
from clippyme.domain.social_publisher_port import (
    PublicationJob,
    PublicationReceipt,
    SocialChannel,
    get_social_publisher,
)

logger = logging.getLogger("clippyme.brand_workspace_service")


KNOWN_PROVIDERS = {"postiz", "zernio", "mock"}


def get_brand_active_provider(brand: dict[str, Any]) -> str:
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


def get_brand_customer_id(brand: dict[str, Any], provider_name: str) -> str | None:
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


def get_brand_channel_ids(brand: dict[str, Any], provider_name: str) -> list[str]:
    """Retrieve list of channel IDs bound to this brand on the active provider."""
    profiles = brand.get("publishing_profiles") or {}
    if isinstance(profiles, dict):
        p_data = profiles.get(provider_name) or {}
        if isinstance(p_data, dict) and p_data.get("channel_ids"):
            return [str(cid) for cid in p_data["channel_ids"] if cid]
    if brand.get("channel_ids"):
        return [str(cid) for cid in brand["channel_ids"] if cid]
    return []


async def get_brand_channels(brand_id: str, *, all_available: bool = False) -> list[SocialChannel]:
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
        channel_to_brand: dict[str, tuple[str, str]] = {}
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

        enriched: list[SocialChannel] = []
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
    channel_ids: list[str],
    workspace_id: str | None = None,
) -> dict[str, Any]:
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

    current_profile["linked_at"] = datetime.now(UTC).isoformat()
    profiles[provider_name] = current_profile
    brand_updates: dict[str, Any] = {"publishing_profiles": profiles}

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


async def get_workspace_summary(brand_id: str) -> dict[str, Any]:
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


def get_brand_videos(brand_id: str, status: str | None = None) -> list[dict[str, Any]]:
    """Retrieve video items belonging to a specific brand with optional status filtering."""
    _ = viral_studio_store.get_brand_or_raise(brand_id)
    items = viral_studio_store.get_items_by_brand(brand_id=brand_id, status=status)

    # In-flight dispatch queue enrichment so UI reflects SCHEDULED/PUBLISHED immediately
    try:
        from clippyme.domain.publish_dispatch_service import _load_queue_sync
        queue = _load_queue_sync()
        if queue:
            active_jobs = {}
            for job in queue.values():
                if isinstance(job, dict) and job.get("brand_id") == brand_id:
                    j_status = str(job.get("status") or "").upper()
                    if j_status in ("QUEUED", "UPLOADING", "SCHEDULED", "PUBLISHED"):
                        active_jobs[job.get("item_id")] = job

            if active_jobs:
                enriched = []
                for item in items:
                    i_copy = dict(item)
                    i_id = i_copy.get("id") or i_copy.get("item_id")
                    if i_id in active_jobs:
                        job = active_jobs[i_id]
                        j_status = str(job.get("status") or "").upper()
                        if j_status in ("SCHEDULED", "QUEUED", "UPLOADING"):
                            i_copy["status"] = "SCHEDULED"
                            if job.get("scheduled_for"):
                                i_copy["scheduled_for"] = job.get("scheduled_for")
                        elif j_status == "PUBLISHED":
                            i_copy["status"] = "PUBLISHED"
                    enriched.append(i_copy)
                return enriched
    except Exception:
        pass
    return items


def _validate_item_for_brand(
    brand_id: str,
    item_id: str,
    require_approved: bool = False,
) -> tuple[dict[str, Any], str, str]:
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
    receipts: list[PublicationReceipt],
    scheduled_for: str | None = None,
    publish_now: bool = False,
    channel_ids: list[str] | None = None,
) -> None:
    """Durably record publication receipts and advance item status."""
    now = datetime.now(UTC).isoformat()
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
        # Crucial rule: KEEP APPROVED on publish failure! Never set to FAILED (which is reserved for video render errors)!
        viral_studio_store.update_item(
            item_id=item_id,
            updates={
                "status": "APPROVED",
            },
        )


async def auto_schedule_brand_video(
    brand_id: str,
    item_id: str,
    channel_ids: list[str] | None = None,
) -> list[PublicationReceipt]:
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
    slots_list = posting_schedule.get("slots") or viral_studio_store.DEFAULT_BRAND_SCHEDULE["slots"]
    timezone_str = posting_schedule.get("timezone") or viral_studio_store.DEFAULT_BRAND_SCHEDULE["timezone"]

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
        now_tz = datetime.now(UTC)
        slot_iso = (now_tz + timedelta(days=1)).replace(hour=18, minute=0, second=0, microsecond=0).isoformat()

    title = (
        (item.get("ai_copy") or {}).get("social_title")
        or item.get("social_title")
        or item.get("selected_headline")
        or item.get("headline")
        or brand.get("name")
    )
    caption = item.get("caption") or brand.get("default_cta") or ""

    receipts: list[PublicationReceipt] = []

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
    channel_ids: list[str],
    scheduled_for: str | None = None,
    publish_now: bool = False,
) -> list[PublicationReceipt]:
    """Publish or schedule video to specified channels with failure isolation."""
    brand = viral_studio_store.get_brand_or_raise(brand_id)
    item, batch_id, video_path = _validate_item_for_brand(brand_id, item_id, require_approved=False)

    if not channel_ids:
        raise ValidationError("At least one target channel ID is required")

    provider_name = get_brand_active_provider(brand)
    port = get_social_publisher(provider=provider_name)
    timezone_str = brand.get("posting_schedule", {}).get("timezone", "America/Sao_Paulo")
    title = (
        (item.get("ai_copy") or {}).get("social_title")
        or item.get("social_title")
        or item.get("selected_headline")
        or item.get("headline")
        or brand.get("name")
    )
    caption = item.get("caption") or brand.get("default_cta") or ""

    receipts: list[PublicationReceipt] = []

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
    """Cancel scheduled post in provider and/or dispatch queue, and atomically revert item status to APPROVED."""
    brand = viral_studio_store.get_brand_or_raise(brand_id)
    provider_name = get_brand_active_provider(brand)
    port = get_social_publisher(provider=provider_name)

    from clippyme.domain.publish_dispatch_service import (
        _load_queue_sync,
        _save_queue_sync,
    )
    queue = _load_queue_sync()

    # 1. If post_id is an in-flight / queued dispatch job (e.g. job_pub_...)
    is_dispatch_job = post_id in queue or post_id.startswith("job_")
    if is_dispatch_job:
        job_data = queue.get(post_id)
        if job_data:
            job_data["status"] = "CANCELLED"
            job_data["updated_at"] = datetime.now(UTC).isoformat()
            queue[post_id] = job_data
            _save_queue_sync(queue)

            # Revert underlying item to APPROVED
            item_id = job_data.get("item_id")
            if item_id:
                try:
                    _, batch_id, _ = viral_studio_store.find_item_batch(item_id)
                    viral_studio_store.update_item_status(batch_id, item_id, "APPROVED")
                except Exception:
                    pass
        return True

    # 2. Cancel in external provider (Postiz / Zernio)
    try:
        await port.cancel(post_id)
    except Exception as exc:
        logger.warning("Provider cancel failed for post %s: %s", post_id, exc)

    # 3. Revert local item status to APPROVED and write cancellation audit record
    reverted_item = viral_studio_store.update_item_status_by_post_id(
        post_id=post_id,
        new_status="APPROVED",
    )

    # Also check if any in-flight dispatch record matches this post_id or item_id and mark CANCELLED
    modified_queue = False
    for j_id, j_val in queue.items():
        if (
            j_val.get("post_id") == post_id
            or j_id == post_id
            or (reverted_item and j_val.get("item_id") == (reverted_item.get("item_id") or reverted_item.get("id")))
        ):
            j_val["status"] = "CANCELLED"
            j_val["updated_at"] = datetime.now(UTC).isoformat()
            modified_queue = True
    if modified_queue:
        _save_queue_sync(queue)

    if reverted_item:
        logger.info(
            "Reverted item %s to APPROVED after cancelling post %s",
            reverted_item.get("item_id") or reverted_item.get("id"),
            post_id,
        )
    return True


def _enrich_post_metadata(
    post: dict[str, Any],
    channel_map: dict[str, SocialChannel],
    provider_name: str,
) -> dict[str, Any]:
    """Populate platform, channel metadata, thumbnail and URLs on a scheduled post."""
    p = dict(post)
    ch_id = p.get("channel_id")
    raw_integ = (p.get("raw_response") or {}).get("integration") or {}
    raw_ch_id = raw_integ.get("id") if isinstance(raw_integ, dict) else None

    matched_ch = channel_map.get(str(ch_id)) or channel_map.get(str(raw_ch_id))
    if not matched_ch and p.get("channels"):
        for c in p["channels"]:
            if str(c) in channel_map:
                matched_ch = channel_map[str(c)]
                break

    if matched_ch:
        p["channel_name"] = matched_ch.name
        p["channel_handle"] = matched_ch.handle
        p["channel_avatar_url"] = matched_ch.avatar_url
        p["platform"] = matched_ch.platform
    elif not p.get("platform"):
        p["platform"] = "postiz" if provider_name == "postiz" else "social"

    post_id = p.get("post_id") or p.get("id")
    p.setdefault("provider", provider_name)
    if provider_name == "postiz":
        from clippyme.storage.config_store import load_persistent_config
        cfg = load_persistent_config() or {}
        default_postiz_url = (
            os.environ.get("POSTIZ_PUBLIC_URL")
            or cfg.get("POSTIZ_PUBLIC_URL")
            or "http://localhost:4007"
        ).rstrip("/")
        provider_target = p.get("provider_post_url")
        if not provider_target or provider_target.endswith("/posts"):
            if post_id:
                provider_target = f"{default_postiz_url}/p/{post_id}?share=true"
            else:
                provider_target = f"{default_postiz_url}/launches"
        if "postiz:5000" in provider_target:
            provider_target = provider_target.replace("http://postiz:5000", default_postiz_url)
        p["provider_url"] = provider_target
        p["provider_post_url"] = provider_target
    elif provider_name == "zernio":
        p.setdefault("provider_url", "https://zernio.com/posts")
    item_id = p.get("item_id")
    matched_item = None
    batch_id = None

    if post_id:
        item_match = viral_studio_store.find_item_by_post_id(str(post_id))
        if item_match:
            matched_item, batch_id, _ = item_match
            item_id = matched_item.get("id") or matched_item.get("item_id")
            p["item_id"] = item_id

    if not matched_item and item_id:
        try:
            matched_item, batch_id, _ = viral_studio_store.find_item_batch(item_id)
        except Exception:
            pass

    if matched_item and batch_id and item_id:
        video_title = (
            (matched_item.get("ai_copy") or {}).get("social_title")
            or matched_item.get("social_title")
            or matched_item.get("selected_headline")
            or matched_item.get("headline")
            or matched_item.get("title")
        )
        if video_title:
            p["title"] = video_title
        if matched_item.get("caption") and not p.get("content"):
            p["content"] = matched_item.get("caption")
        if not p.get("thumbnail_url"):
            p["thumbnail_url"] = f"/videos/viral_studio/{batch_id}/{item_id}/rendered_thumbnail.jpg"
        if not p.get("video_url"):
            p["video_url"] = f"/videos/viral_studio/{batch_id}/{item_id}/rendered.mp4"

    return p


def _get_active_queue_posts(
    brand_id: str,
    channel_map: dict[str, SocialChannel],
    provider_name: str,
) -> list[dict[str, Any]]:
    """Retrieve in-flight QUEUED or UPLOADING dispatch jobs converted to timeline posts."""
    from clippyme.domain.publish_dispatch_service import dispatch_service
    active_records = dispatch_service.list_dispatch_records(brand_id=brand_id)
    active_jobs = [j for j in active_records if str(j.status).upper() in ("QUEUED", "UPLOADING")]
    
    result = []
    for job in active_jobs:
        primary_cid = job.channel_ids[0] if job.channel_ids else None
        ch = channel_map.get(str(primary_cid)) if primary_cid else None
        
        post_dict = {
            "id": job.job_id,
            "post_id": job.job_id,
            "job_id": job.job_id,
            "brand_id": brand_id,
            "item_id": job.item_id,
            "title": job.title or "Publicação",
            "content": job.caption or "",
            "status": str(job.status).upper(),
            "scheduled_for": job.scheduled_for,
            "scheduled_time": job.scheduled_for,
            "published_at": None,
            "post_url": None,
            "external_url": None,
            "thumbnail_url": job.thumbnail_url,
            "provider": job.provider or provider_name,
            "channel_id": primary_cid,
            "channels": job.channel_ids,
            "channel_name": ch.name if ch else (job.channel_names[0] if job.channel_names else None),
            "channel_handle": ch.handle if ch else None,
            "channel_avatar_url": ch.avatar_url if ch else None,
            "platform": ch.platform if ch else ("postiz" if job.provider == "postiz" else "social"),
            "metrics": {},
            "raw_response": None,
        }
        result.append(post_dict)
    return result


async def list_brand_scheduled_posts(
    brand_id: str,
    start_date: str | None = None,
    end_date: str | None = None,
) -> list[dict[str, Any]]:
    """Query scheduled and published posts for brand from active provider."""
    brand = viral_studio_store.get_brand_or_raise(brand_id)
    provider_name = get_brand_active_provider(brand)
    port = get_social_publisher(provider=provider_name)
    customer_id = get_brand_customer_id(brand, provider_name)

    all_channels = await get_brand_channels(brand_id, all_available=True)
    channel_map = {str(ch.id): ch for ch in all_channels}

    active_queue_posts = _get_active_queue_posts(brand_id, channel_map, provider_name)
    active_item_ids = {p.get("item_id") for p in active_queue_posts if p.get("item_id")}

    posts = await port.list_scheduled(
        customer_id=customer_id,
        start_date=start_date or "",
        end_date=end_date or "",
    )

    if not posts:
        items = viral_studio_store.get_items_by_brand(brand_id=brand_id)
        result_posts = []
        for item in items:
            item_id = item.get("item_id") or item.get("id")
            if item_id in active_item_ids:
                continue
            item_status = str(item.get("status") or "").upper()
            if item_status not in ("SCHEDULED", "PUBLISHED"):
                continue

            valid_recs = [
                r for r in item.get("publication_records", [])
                if str(r.get("status", "")).lower() in ("scheduled", "published")
            ]
            rec = valid_recs[-1] if valid_recs else {}
            p_id = str(rec.get("post_id") or rec.get("id") or f"post_{item_id or 'unknown'}")
            sched = rec.get("scheduled_for") or rec.get("scheduled_time") or item.get("scheduled_for")
            raw_post = {
                "id": p_id,
                "post_id": p_id,
                "brand_id": brand_id,
                "item_id": item_id,
                "title": (
                    (item.get("ai_copy") or {}).get("social_title")
                    or item.get("social_title")
                    or item.get("selected_headline")
                    or item.get("headline")
                    or "Publicação"
                ),
                "content": item.get("caption") or "",
                "status": "published" if item_status == "PUBLISHED" else "scheduled",
                "scheduled_for": sched,
                "scheduled_time": sched,
                "published_at": rec.get("published_at"),
                "post_url": rec.get("post_url") or rec.get("external_url"),
                "external_url": rec.get("post_url") or rec.get("external_url"),
                "channels": [rec.get("channel_id")] if rec.get("channel_id") else [],
                "channel_id": rec.get("channel_id"),
            }
            result_posts.append(_enrich_post_metadata(raw_post, channel_map, provider_name))
        return active_queue_posts + result_posts

    # When provider returns posts, ensure brand_id, isolate by brand channels, and filter cancelled
    brand_channel_ids = set(get_brand_channel_ids(brand, provider_name))
    filtered = []
    for p in posts:
        if isinstance(p, dict):
            if str(p.get("status", "")).lower() in ("cancelled", "canceled"):
                continue
            ch_id = p.get("channel_id")
            raw_integ = (p.get("raw_response") or {}).get("integration") or {}
            raw_ch_id = raw_integ.get("id") if isinstance(raw_integ, dict) else None
            
            # Brand isolation: only include posts matching the brand's connected channels
            if brand_channel_ids:
                matches_ch = (ch_id and str(ch_id) in brand_channel_ids) or (raw_ch_id and str(raw_ch_id) in brand_channel_ids)
                if not matches_ch and (ch_id or raw_ch_id):
                    continue

            p_copy = dict(p)
            p_copy.setdefault("brand_id", brand_id)
            enriched = _enrich_post_metadata(p_copy, channel_map, provider_name)
            filtered.append(enriched)

    # Ensure any local scheduled/published item from the store not already in filtered/active is included
    seen_item_ids = {
        p.get("item_id") for p in (active_queue_posts + filtered) if p.get("item_id")
    }
    seen_post_ids = {
        str(p.get("id")) for p in (active_queue_posts + filtered) if p.get("id")
    } | {
        str(p.get("post_id")) for p in (active_queue_posts + filtered) if p.get("post_id")
    }

    local_items = viral_studio_store.get_items_by_brand(brand_id=brand_id)
    for item in local_items:
        i_id = item.get("item_id") or item.get("id")
        i_status = str(item.get("status") or "").upper()
        if i_status in ("SCHEDULED", "PUBLISHED") and i_id not in seen_item_ids:
            valid_recs = [
                r for r in item.get("publication_records", [])
                if str(r.get("status", "")).lower() in ("scheduled", "published")
            ]
            rec = valid_recs[-1] if valid_recs else {}
            p_id = str(rec.get("post_id") or rec.get("id") or f"post_{i_id}")
            if p_id in seen_post_ids:
                continue
            sched = rec.get("scheduled_for") or rec.get("scheduled_time") or item.get("scheduled_for")
            raw_post = {
                "id": p_id,
                "post_id": p_id,
                "brand_id": brand_id,
                "item_id": i_id,
                "title": (
                    (item.get("ai_copy") or {}).get("social_title")
                    or item.get("social_title")
                    or item.get("selected_headline")
                    or item.get("headline")
                    or item.get("title")
                    or "Publicação"
                ),
                "content": item.get("caption") or "",
                "status": "published" if i_status == "PUBLISHED" else "scheduled",
                "scheduled_for": sched,
                "scheduled_time": sched,
                "published_at": rec.get("published_at"),
                "post_url": rec.get("post_url") or rec.get("external_url"),
                "external_url": rec.get("post_url") or rec.get("external_url"),
                "channels": [rec.get("channel_id")] if rec.get("channel_id") else [],
                "channel_id": rec.get("channel_id"),
            }
            filtered.append(_enrich_post_metadata(raw_post, channel_map, provider_name))

    return active_queue_posts + filtered


async def publish_brand_scheduled_now(brand_id: str, post_id: str) -> dict[str, Any]:
    """Trigger immediate publication of a scheduled post."""
    brand = viral_studio_store.get_brand_or_raise(brand_id)
    provider_name = get_brand_active_provider(brand)
    port = get_social_publisher(provider=provider_name)

    item_id: str | None = None
    channel_ids: list[str] = []

    from clippyme.domain.publish_dispatch_service import dispatch_service
    queue_jobs = dispatch_service.list_dispatch_records(brand_id=brand_id)
    for j in queue_jobs:
        if j.job_id == post_id or j.item_id == post_id:
            item_id = j.item_id
            channel_ids = j.channel_ids
            break

    if not item_id:
        items = viral_studio_store.get_items_by_brand(brand_id=brand_id)
        for it in items:
            it_id = str(it.get("item_id") or it.get("id") or "")
            if it_id == post_id:
                item_id = it_id
                channel_ids = [r.get("channel_id") for r in it.get("publication_records", []) if r.get("channel_id")]
                break
            for rec in it.get("publication_records", []):
                if str(rec.get("post_id") or rec.get("id") or "") == str(post_id):
                    item_id = it_id
                    ch = rec.get("channel_id")
                    if ch:
                        channel_ids.append(str(ch))
                    break
            if item_id:
                break

    if not item_id:
        scheduled = await list_brand_scheduled_posts(brand_id)
        for sp in scheduled:
            if str(sp.get("id") or sp.get("post_id") or "") == str(post_id):
                item_id = sp.get("item_id")
                if sp.get("channel_id"):
                    channel_ids = [str(sp["channel_id"])]
                elif sp.get("channels"):
                    channel_ids = [str(c) for c in sp["channels"]]
                break

    if not item_id:
        raise NotFoundError(f"Scheduled post or item '{post_id}' not found for brand '{brand_id}'")

    try:
        await port.cancel(post_id)
    except Exception as exc:
        logger.debug("Failed cancelling scheduled post before publish_now (non-fatal): %s", exc)

    job = await dispatch_service.enqueue_publish(
        brand_id=brand_id,
        item_id=item_id,
        channel_ids=channel_ids or None,
    )
    return {
        "success": True,
        "job_id": job.job_id,
        "item_id": item_id,
        "post_id": post_id,
        "status": job.status,
        "message": "Publicação imediata disparada com sucesso",
    }
