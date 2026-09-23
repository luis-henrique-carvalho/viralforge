"""FastAPI route handlers for Viral Content Studio (Milestone 1).

Covers Brand and Template management endpoints under /api/viral-studio.
Handlers adhere to the thin-handler rule (<25 lines), delegating all I/O to
clippyme.domain.viral_studio_store and validation to viral_studio_schemas.
"""
from __future__ import annotations

import asyncio
from typing import List, Optional

from fastapi import APIRouter, File, HTTPException, Request, Response, UploadFile, status

from clippyme.api.viral_studio_schemas import (
    BatchCreateRequest,
    BatchListResponse,
    BatchResponse,
    BrandCreate,
    BrandListResponse,
    BrandResponse,
    BrandUpdate,
    ItemRenderRequest,
    ItemRegenerateCopyRequest,
    PreviewSlotsResponse,
    SlotProjection,
    SocialAccountResponse,
    TemplateCreate,
    TemplateListResponse,
    TemplateResponse,
    TemplateUpdate,
    TestGenerationRequest,
    TestGenerationResponse,
    VisualTemplate,
    ViralItem,
    ViralItemUpdate,
    ViralPublishRequest,
    ViralPublishResponse,
)
from clippyme.domain import viral_studio_copy, viral_studio_orchestrator, viral_studio_store

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


@router.get("/publishing/preview-slots", response_model=PreviewSlotsResponse)
async def preview_publish_slots(
    account_id: Optional[str] = None,
    channel_id: Optional[str] = None,
    count: int = 1,
    start_date: Optional[str] = None,
    preferred_time: str = "18:00",
    timezone: str = "America/Sao_Paulo",
):
    """Calculate and project collision-free schedule slots for an account."""
    effective_acc_id = account_id or channel_id or "default"
    slots = await asyncio.to_thread(
        viral_studio_store.get_next_available_slots,
        account_id=effective_acc_id,
        count=count,
        preferred_time=preferred_time,
        start_date=start_date,
        timezone_str=timezone,
    )
    projections = [
        SlotProjection(
            index=idx + 1,
            datetime=slot.isoformat(),
            formatted=slot.strftime("%d/%m às %H:%M"),
        )
        for idx, slot in enumerate(slots)
    ]
    return PreviewSlotsResponse(
        account_id=effective_acc_id,
        count=len(projections),
        last_scheduled_slot=projections[-1].datetime if projections else None,
        projected_slots=projections,
    )


@router.get("/publishing/accounts", response_model=List[SocialAccountResponse])
async def list_publishing_accounts():
    """List authenticated social channels available for publishing."""
    from clippyme.domain.social_publisher_port import get_social_publisher

    publisher = get_social_publisher()
    accounts = await publisher.list_accounts()
    return [
        SocialAccountResponse(
            id=acc.id,
            name=acc.name,
            platform=acc.platform,
            avatar_url=acc.avatar_url,
            connected=acc.connected,
        )
        for acc in accounts
    ]


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

