"""FastAPI route handlers for Viral Content Studio (Milestone 1).

Covers Brand and Template management endpoints under /api/viral-studio.
Handlers adhere to the thin-handler rule (<25 lines), delegating all I/O to
clippyme.domain.viral_studio_store and validation to viral_studio_schemas.
"""
from __future__ import annotations

import asyncio
import dataclasses
import os
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, File, HTTPException, Request, Response, UploadFile, status

from clippyme.api.viral_studio_schemas import (
    AutoScheduleRequest,
    BatchCreateRequest,
    BatchListResponse,
    BatchResponse,
    BrandChannelBindRequest,
    BrandCreate,
    BrandListResponse,
    BrandPublishRequest,
    BrandResponse,
    BrandUpdate,
    BrandWorkspaceResponse,
    ItemRenderRequest,
    ItemRegenerateCopyRequest,
    PreviewSlotsResponse,
    ScheduleSlotsRequest,
    ScheduledTimelineResponse,
    SlotProjection,
    SocialAccountResponse,
    SocialChannelResponse,
    TemplateCreate,
    TemplateListResponse,
    TemplateResponse,
    TemplateUpdate,
    TestGenerationRequest,
    TestGenerationResponse,
    ViralItem,
    ViralItemUpdate,
    ViralPublishRequest,
    ViralPublishResponse,
    VisualTemplate,
    WorkspaceSummaryResponse,
    DispatchJobAcceptedResponse,
    DispatchJobRecord,
    DispatchQueueResponse,
)
from clippyme.domain import (
    brand_workspace_service,
    viral_studio_copy,
    viral_studio_orchestrator,
    viral_studio_store,
)
from clippyme.domain.publish_dispatch_service import dispatch_service
from clippyme.domain.social_publisher_port import get_social_publisher

router = APIRouter(tags=["viral-studio"])


# ---------------------------------------------------------------------------
# Brand Endpoints
# ---------------------------------------------------------------------------

@router.get("/brands", response_model=BrandListResponse)
async def list_brands():
    """List all configured brand profiles."""
    brands = await asyncio.to_thread(viral_studio_store.list_brands)
    return BrandListResponse(brands=brands, total=len(brands))


@router.get("/brands/{id}", response_model=BrandResponse)
async def get_brand(id: str):
    """Retrieve a single brand profile by ID."""
    brand = await asyncio.to_thread(viral_studio_store.get_brand_or_raise, id)
    return brand


@router.post("/brands", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
async def create_brand(payload: BrandCreate):
    """Create and persist a new brand profile."""
    brand = await asyncio.to_thread(viral_studio_store.create_brand, payload)
    return brand


@router.patch("/brands/{id}", response_model=BrandResponse)
async def update_brand(id: str, payload: BrandUpdate):
    """Partially update an existing brand profile."""
    brand = await asyncio.to_thread(viral_studio_store.update_brand, id, payload)
    return brand


@router.post("/brands/{id}/avatar", response_model=BrandResponse)
async def upload_brand_avatar(id: str, file: UploadFile = File(...)):
    """Upload and attach a custom avatar image to a brand profile."""
    import os
    brand = await asyncio.to_thread(viral_studio_store.get_brand_or_raise, id)
    ext = os.path.splitext(file.filename or "")[1] or ".png"
    upload_dir = os.path.join("data", "uploads", "brands")
    os.makedirs(upload_dir, exist_ok=True)
    target_path = os.path.join(upload_dir, f"{id}_avatar{ext}")

    content = await file.read()
    with open(target_path, "wb") as f:
        f.write(content)

    updated = await asyncio.to_thread(
        viral_studio_store.update_brand,
        id,
        BrandUpdate(avatar_path=target_path),
    )
    return updated


# ---------------------------------------------------------------------------
# Brand Workspace & Channels Endpoints
# ---------------------------------------------------------------------------

@router.get("/publishing/workspaces", response_model=List[WorkspaceSummaryResponse])
async def list_publishing_workspaces(provider: Optional[str] = None):
    """List available workspaces or customer groups from the active publishing provider."""
    cfg = viral_studio_store.get_active_publishing_provider() if hasattr(viral_studio_store, "get_active_publishing_provider") else "postiz"
    provider_name = provider or os.environ.get("PUBLISHING_PROVIDER") or cfg or "postiz"
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


@router.get("/brands/{id}/workspace", response_model=BrandWorkspaceResponse)
async def get_brand_workspace(id: str):
    """Retrieve complete workspace state for a brand."""
    data = await brand_workspace_service.get_workspace_summary(id)
    return BrandWorkspaceResponse(**data)


@router.get("/brands/{id}/channels", response_model=List[SocialChannelResponse])
async def list_brand_channels(id: str):
    """List social media channels bound to this brand from its active provider."""
    channels = await brand_workspace_service.get_brand_channels(id, all_available=False)
    brand = viral_studio_store.get_brand_or_raise(id)
    provider_name = brand_workspace_service.get_brand_active_provider(brand)
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


@router.get("/brands/{id}/channels/available", response_model=List[SocialChannelResponse])
async def list_available_brand_channels(id: str):
    """List all accounts authenticated in the active provider available for binding to this brand."""
    channels = await brand_workspace_service.get_brand_channels(id, all_available=True)
    brand = viral_studio_store.get_brand_or_raise(id)
    provider_name = brand_workspace_service.get_brand_active_provider(brand)
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


@router.post("/brands/{id}/channels/bind", response_model=BrandResponse)
async def bind_brand_channels(id: str, req: BrandChannelBindRequest):
    """Bind selected channel IDs and optionally a workspace_id to this brand."""
    updated = await brand_workspace_service.bind_brand_channels(
        brand_id=id,
        channel_ids=req.channel_ids,
        workspace_id=req.workspace_id,
    )
    return BrandResponse(**updated)


@router.post("/brands/{id}/channels/connect-url")
async def get_brand_channel_connect_url(id: str):
    """Get channel connection URL for the active publisher provider."""
    brand = viral_studio_store.get_brand_or_raise(id)
    provider_name = brand_workspace_service.get_brand_active_provider(brand)
    publisher = get_social_publisher(provider=provider_name)
    customer_id = brand_workspace_service.get_brand_customer_id(brand, provider_name)
    url = await publisher.get_connect_channel_url(brand_id=customer_id or id)
    return {"url": url}


@router.get("/brands/{id}/videos", response_model=List[ViralItem])
async def get_brand_videos(id: str, status: Optional[str] = None):
    """List all video items belonging to a brand across batches."""
    items = await asyncio.to_thread(brand_workspace_service.get_brand_videos, id, status=status)
    return [ViralItem(**item) for item in items]


async def _handle_brand_dispatch(
    brand_id: str,
    item_id: str,
    channel_ids: Optional[List[str]],
    scheduled_for: Optional[str],
    publish_now: bool,
    is_sync: bool,
    response: Response,
) -> Dict[str, Any]:
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
    "/brands/{id}/auto-schedule",
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
    "/brands/{id}/publish",
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


@router.get("/publishing/queue", response_model=DispatchQueueResponse)
async def list_publishing_queue(
    brand_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
):
    """List persistent dispatch queue jobs and publication audit logs."""
    jobs = await asyncio.to_thread(dispatch_service.list_dispatches, brand_id=brand_id, status=status, limit=limit)
    active = sum(1 for j in jobs if j.status in ("QUEUED", "UPLOADING"))
    failed = sum(1 for j in jobs if j.status in ("FAILED", "PARTIAL_FAILED"))
    return DispatchQueueResponse(
        jobs=[DispatchJobRecord(**j.to_dict()) for j in jobs],
        total=len(jobs),
        active_count=active,
        failed_count=failed,
    )


@router.post("/publishing/queue/retry/{job_id}", status_code=status.HTTP_202_ACCEPTED)
async def retry_publishing_dispatch(job_id: str):
    """1-Click retry a failed dispatch job without re-rendering media."""
    job = await dispatch_service.retry_dispatch(job_id)
    return {
        "success": True,
        "job_id": job.job_id,
        "item_id": job.item_id,
        "status": job.status,
        "message": "Envio re-enfileirado com sucesso",
    }


@router.post("/brands/{id}/schedule-slots", response_model=BrandResponse)
async def update_brand_schedule_slots(id: str, payload: ScheduleSlotsRequest):
    """Update preferred posting schedule slots, timezone, and frequency for a brand."""
    brand = await asyncio.to_thread(
        viral_studio_store.update_brand_schedule,
        brand_id=id,
        slots=payload.slots,
        timezone=payload.timezone,
        frequency=payload.frequency,
    )
    return BrandResponse(**brand)


@router.get("/brands/{id}/scheduled", response_model=ScheduledTimelineResponse)
async def list_brand_scheduled(
    id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    """List scheduled and published posts timeline for a brand."""
    posts = await brand_workspace_service.list_brand_scheduled_posts(
        brand_id=id,
        start_date=start_date,
        end_date=end_date,
    )
    return ScheduledTimelineResponse(brand_id=id, posts=posts, total=len(posts))


@router.delete("/brands/{id}/scheduled/{post_id}")
async def cancel_brand_scheduled(id: str, post_id: str):
    """Cancel a scheduled post in provider and revert item status to APPROVED."""
    success = await brand_workspace_service.cancel_brand_scheduled_post(brand_id=id, post_id=post_id)
    return {"success": success, "post_id": post_id}


@router.post("/brands/{id}/scheduled/{post_id}/publish-now", status_code=status.HTTP_202_ACCEPTED)
async def publish_brand_scheduled_now(id: str, post_id: str):
    """Trigger immediate publication of a scheduled post."""
    result = await brand_workspace_service.publish_brand_scheduled_now(brand_id=id, post_id=post_id)
    return result


# ---------------------------------------------------------------------------
# Template Endpoints
# ---------------------------------------------------------------------------

@router.get("/templates", response_model=TemplateListResponse)
async def list_templates():
    """List all visual composition templates."""
    templates = await asyncio.to_thread(viral_studio_store.list_templates)
    return TemplateListResponse(templates=templates, total=len(templates))


@router.get("/templates/{id}", response_model=TemplateResponse)
async def get_template(id: str):
    """Retrieve a single visual template by ID."""
    template = await asyncio.to_thread(viral_studio_store.get_template_or_raise, id)
    return template


@router.post("/templates", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(payload: TemplateCreate):
    """Create and persist a new visual template."""
    template = await asyncio.to_thread(viral_studio_store.create_template, payload)
    return template


@router.patch("/templates/{id}", response_model=TemplateResponse)
async def update_template(id: str, payload: TemplateUpdate):
    """Partially update an existing visual template."""
    template = await asyncio.to_thread(viral_studio_store.update_template, id, payload)
    return template


@router.put("/templates/{id}", response_model=TemplateResponse)
async def replace_template(id: str, payload: TemplateCreate):
    """Fully replace an existing visual template."""
    payload_dict = payload.model_dump(exclude_unset=True)
    payload_dict["id"] = id
    tmpl = VisualTemplate.model_validate(payload_dict)
    saved = await asyncio.to_thread(viral_studio_store.save_template, tmpl)
    return saved


@router.delete("/templates/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(id: str):
    """Delete a custom visual template (system templates are protected)."""
    await asyncio.to_thread(viral_studio_store.delete_template, id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/templates/{id}/duplicate", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def duplicate_template(id: str):
    """Duplicate an existing template creating a new custom copy."""
    duplicated = await asyncio.to_thread(viral_studio_store.duplicate_template, id)
    return duplicated


@router.post("/templates/reset-defaults", response_model=TemplateListResponse)
async def reset_default_templates():
    """Reset the 4 default factory templates to their canonical definitions."""
    templates = await asyncio.to_thread(viral_studio_store.reset_default_templates)
    return TemplateListResponse(templates=templates, total=len(templates))


@router.post("/templates/test-generation", response_model=TestGenerationResponse)
async def test_template_generation(payload: TestGenerationRequest):
    """Execute real-time test AI copy generation with a template and sample context."""
    template = payload.template
    if template is None and payload.template_id:
        template = await asyncio.to_thread(viral_studio_store.get_template_or_raise, payload.template_id)
    if template is None:
        from clippyme.api.viral_studio_schemas import DEFAULT_TEMPLATE
        template = DEFAULT_TEMPLATE

    brand = None
    if payload.brand_id:
        brand = await asyncio.to_thread(viral_studio_store.get_brand, payload.brand_id)

    copy_data, telemetry = await viral_studio_copy.test_copy_generation(
        template=template,
        brand=brand,
        sample_transcript=payload.sample_transcript,
        sample_title=payload.sample_title,
        model=payload.model,
    )

    return TestGenerationResponse(
        generated_copy=copy_data,
        prompt=telemetry.get("prompt", ""),
        raw_response=telemetry.get("raw_response", ""),
        telemetry=telemetry,
    )


@router.post("/templates/{id}/extra-image", response_model=TemplateResponse)
async def upload_template_extra_image(id: str, file: UploadFile = File(...)):
    """Upload and attach a footer overlay image to a template."""
    import os
    template = await asyncio.to_thread(viral_studio_store.get_template_or_raise, id)
    ext = os.path.splitext(file.filename or "")[1] or ".png"
    upload_dir = os.path.join("data", "uploads", "templates")
    os.makedirs(upload_dir, exist_ok=True)
    target_path = os.path.join(upload_dir, f"{id}_extra{ext}")

    content = await file.read()
    with open(target_path, "wb") as f:
        f.write(content)

    updated = await asyncio.to_thread(
        viral_studio_store.update_template,
        id,
        TemplateUpdate(
            extra_image_path=target_path,
            extra_image_url=f"/uploads/templates/{id}_extra{ext}",
            extra_image_enabled=True,
            extra_image_template_type="custom_upload",
        ),
    )
    return updated


# ---------------------------------------------------------------------------
# Batch & Item Endpoints
# ---------------------------------------------------------------------------

@router.get("/batches", response_model=BatchListResponse)
async def list_batches():
    """List all batches."""
    batches = await asyncio.to_thread(viral_studio_store.list_batches)
    return BatchListResponse(batches=batches, total=len(batches))


@router.get("/batches/{id}", response_model=BatchResponse)
async def get_batch(id: str):
    """Retrieve a single batch with all item statuses."""
    batch = await asyncio.to_thread(viral_studio_store.get_batch_or_raise, id)
    return batch


@router.post(
    "/batches",
    response_model=BatchResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        202: {"model": BatchResponse, "description": "Batch accepted for background processing"},
    },
)
async def create_batch(
    payload: BatchCreateRequest,
    request: Request,
    response: Response,
):
    """Create and persist a new batch of items, enqueuing them in PENDING state."""
    batch = await asyncio.to_thread(viral_studio_store.create_batch, payload)
    # The Viral Studio work uses the same durable worker, concurrency limit and
    # journal as ordinary jobs.  Import lazily to avoid the app/router cycle.
    from clippyme.api import app as app_module
    await viral_studio_orchestrator.enqueue_batch(
        batch,
        jobs=app_module.jobs,
        job_queue=app_module.job_queue,
        on_change=app_module.persist_jobs,
    )
    is_async = (
        request.headers.get("Prefer") == "respond-async"
        or request.query_params.get("async") == "true"
        or (request.headers.get("X-Gemini-Key") and request.query_params.get("async") != "false")
    )
    if is_async:
        response.status_code = status.HTTP_202_ACCEPTED
    else:
        response.status_code = status.HTTP_201_CREATED
    return batch


@router.post("/batches/{id}/cancel", response_model=BatchResponse)
async def cancel_batch(id: str):
    """Cancel all active processing items in a batch."""
    from clippyme.api import app as app_module
    return await viral_studio_orchestrator.cancel_viral_batch(id, jobs=app_module.jobs)


@router.get("/items/{id}", response_model=ViralItem)
async def get_item(id: str):
    """Retrieve details and processing status of a single viral item."""
    item = await asyncio.to_thread(viral_studio_store.get_item_or_raise, id)
    return item


@router.patch("/items/{id}", response_model=ViralItem)
async def update_item(id: str, payload: ViralItemUpdate):
    """Update commercial copy, product code, link, or manual headline for an item."""
    item = await asyncio.to_thread(viral_studio_store.update_item, id, payload)
    return item


@router.post("/items/{id}/regenerate-copy", response_model=ViralItem)
async def regenerate_item_copy(id: str, payload: ItemRegenerateCopyRequest = None):
    """Regenerate AI commercial copy and headlines for an item."""
    model = payload.model if payload else None
    manual_instructions = payload.manual_instructions if payload else None
    item = await viral_studio_orchestrator.regenerate_item_copy(
        id,
        model=model,
        manual_instructions=manual_instructions,
    )
    return item


@router.post("/items/{id}/render", response_model=ViralItem, status_code=status.HTTP_202_ACCEPTED)
async def render_item(id: str, payload: ItemRenderRequest):
    """Queue a fast re-render through the shared durable job worker."""
    if payload.template_id:
        await asyncio.to_thread(viral_studio_store.get_template_or_raise, payload.template_id)
    from clippyme.api import app as app_module
    await viral_studio_orchestrator.enqueue_item(
        id, jobs=app_module.jobs, job_queue=app_module.job_queue,
        on_change=app_module.persist_jobs, rerender=True, headline=payload.headline,
        template_id=payload.template_id, watermark=payload.watermark,
    )
    return await asyncio.to_thread(viral_studio_store.get_item_or_raise, id)


@router.post("/items/{id}/approve", response_model=ViralItem)
async def approve_item(id: str):
    """Approve a rendered item for social publishing."""
    item = await asyncio.to_thread(viral_studio_orchestrator.approve_item, id)
    return item


@router.post("/items/{id}/retry", response_model=ViralItem)
async def retry_item(id: str):
    """Retry processing a failed or interrupted item."""
    item = await viral_studio_orchestrator.retry_item(id)
    from clippyme.api import app as app_module
    await viral_studio_orchestrator.enqueue_item(
        id,
        jobs=app_module.jobs,
        job_queue=app_module.job_queue,
        on_change=app_module.persist_jobs,
    )
    return await asyncio.to_thread(viral_studio_store.get_item_or_raise, id)


@router.post("/items/{id}/cancel", response_model=ViralItem)
async def cancel_item(id: str):
    """Cancel an in-progress viral item processing and terminate its subprocess."""
    from clippyme.api import app as app_module
    return await viral_studio_orchestrator.cancel_viral_item(id, jobs=app_module.jobs)


@router.get("/publishing/preview-slots", response_model=PreviewSlotsResponse)
async def preview_publish_slots(
    account_id: Optional[str] = None,
    channel_id: Optional[str] = None,
    brand_id: Optional[str] = None,
    count: int = 1,
    start_date: Optional[str] = None,
    preferred_time: str = "18:00",
    timezone: str = "America/Sao_Paulo",
    slots: Optional[str] = None,
):
    """Calculate and project collision-free schedule slots for an account/brand."""
    effective_acc_id = account_id or channel_id or "default"

    # If brand_id is provided and slots/preferred_time not overridden, load brand posting schedule
    brand_slots_list = None
    brand_tz = timezone
    if brand_id:
        brand = viral_studio_store.get_brand(brand_id)
        if brand:
            brand_sched = brand.get("posting_schedule") or {}
            if not slots and preferred_time == "18:00" and brand_sched.get("slots"):
                brand_slots_list = brand_sched.get("slots")
            if timezone == "America/Sao_Paulo" and brand_sched.get("timezone"):
                brand_tz = brand_sched.get("timezone")

    if slots:
        brand_slots_list = [s.strip() for s in slots.split(",") if s.strip()]

    calculated_slots = await asyncio.to_thread(
        viral_studio_store.get_next_available_slots,
        account_id=effective_acc_id,
        brand_id=brand_id,
        count=count,
        preferred_time=preferred_time,
        slots=brand_slots_list,
        start_date=start_date,
        timezone_str=brand_tz,
    )
    projections = [
        SlotProjection(
            index=idx + 1,
            datetime=slot.isoformat(),
            formatted=slot.strftime("%d/%m às %H:%M"),
        )
        for idx, slot in enumerate(calculated_slots)
    ]
    return PreviewSlotsResponse(
        account_id=effective_acc_id,
        count=len(projections),
        last_scheduled_slot=projections[-1].datetime if projections else None,
        projected_slots=projections,
    )


@router.get("/publishing/accounts", response_model=List[SocialChannelResponse])
async def list_publishing_accounts():
    """List authenticated social channels available for publishing."""
    publisher = get_social_publisher()
    accounts = await publisher.list_accounts()
    return [
        SocialChannelResponse(
            id=acc.id,
            name=acc.name,
            platform=acc.platform,
            avatar_url=acc.avatar_url,
            connected=acc.connected,
        )
        for acc in accounts
    ]


@router.get("/publications/{id}/metrics")
async def get_publication_metrics(id: str):
    """Retrieve live performance metrics for a published post."""
    publisher = get_social_publisher()
    metrics = await publisher.get_metrics(id)
    return {"post_id": id, "metrics": metrics}


@router.post("/publish", response_model=ViralPublishResponse)
async def publish_items(payload: ViralPublishRequest):
    """Publish one or more approved items via Zernio integration."""
    res = await viral_studio_orchestrator.publish_viral_items(
        item_ids=payload.item_ids,
        platforms=[platform.model_dump(exclude_none=True) for platform in payload.platforms],
        schedule_mode=payload.schedule_mode,
        scheduled_for=payload.scheduled_for,
        timezone=payload.timezone,
        start_date=payload.start_date,
    )
    return res


@router.post("/publishing/{item_id}/cancel", response_model=ViralItem)
async def cancel_item_publishing(item_id: str):
    """Cancel a scheduled publication and safely revert item to APPROVED."""
    return await viral_studio_orchestrator.cancel_item_schedule(item_id)

