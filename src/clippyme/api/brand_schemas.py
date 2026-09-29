"""Pydantic request and response schemas for Brand domain in ViralForge.

Covers Brand models, Social Channels, Workspace summaries, and Scheduling schemas.
"""
from __future__ import annotations

import re
import unicodedata
import uuid
from datetime import UTC, datetime
from typing import Any
from urllib.parse import urlparse

from pydantic import BaseModel, Field, field_validator, model_validator

from clippyme.api.schemas import _reject_internal_host
from clippyme.domain.errors import ValidationError as DomainValidationError
from clippyme.domain.viral_studio_store import (
    validate_safe_asset_path as _store_validate_asset_path,
)

HEX_COLOR_RE = re.compile(r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$")
SLUG_RE = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")
HANDLE_CHARS_RE = re.compile(r"^[a-zA-Z0-9._-]+$")


def slugify(text: str) -> str:
    """Convert arbitrary text to a URL/identifier-safe slug."""
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[-\s]+", "-", text).strip("-_") or "unnamed"


def validate_affiliate_url(v: str | None) -> str | None:
    """Validate that affiliate URL is a public HTTP/HTTPS URL."""
    if v is None:
        return None
    raw = v.strip()
    if not raw:
        return None
    parsed = urlparse(raw)
    if parsed.scheme.lower() not in ("http", "https"):
        raise ValueError("URL must use http or https")
    if not parsed.hostname:
        raise ValueError("URL has no host")
    _reject_internal_host(parsed.hostname.lower())
    return raw


def validate_safe_asset_path(v: str | None) -> str | None:
    """Validate that asset path does not contain path traversal characters or absolute paths."""
    try:
        return _store_validate_asset_path(v)
    except DomainValidationError as exc:
        raise ValueError(exc.detail) from exc


# ============================================================================
# Brand Schemas
# ============================================================================

class SocialChannelBinding(BaseModel):
    account_id: str = Field(..., min_length=1, max_length=128)
    name: str | None = Field(None, max_length=128)
    platform: str = Field(..., max_length=64)
    avatar_url: str | None = Field(None, max_length=1024)
    handle: str | None = Field(None, max_length=128)


class BrandBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    handle: str = Field(..., min_length=1, max_length=60)
    niche: str | None = Field(None, max_length=150)
    discovery_keywords: list[str] = Field(default_factory=list)
    avatar_path: str | None = Field(None, max_length=512)
    avatar_url: str | None = Field(None, max_length=1024)
    logo_path: str | None = Field(None, max_length=512)
    default_cta: str = Field("Confira os achadinhos no link da bio!", max_length=500)
    default_affiliate_url: str | None = Field(None, max_length=2048)
    template_id: str = Field("classic-affiliate", max_length=64, pattern=r"^[a-zA-Z0-9_-]+$")
    posting_schedule: dict[str, Any] | None = Field(
        default_factory=lambda: {
            "frequency": 3,
            "slots": ["10:00", "15:00", "20:00"],
            "timezone": "America/Sao_Paulo",
        }
    )
    publishing_profiles: dict[str, Any] = Field(default_factory=dict)

    @field_validator("posting_schedule", mode="before")
    @classmethod
    def _default_posting_schedule(cls, v: Any) -> dict[str, Any] | None:
        if v is None:
            return {
                "frequency": 3,
                "slots": ["10:00", "15:00", "20:00"],
                "timezone": "America/Sao_Paulo",
            }
        return v

    @field_validator("name")
    @classmethod
    def _clean_name(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("Brand name must not be blank")
        return v

    @field_validator("handle")
    @classmethod
    def _clean_handle(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("Handle must not be blank")
        clean = v.lstrip("@")
        if not clean:
            raise ValueError("Handle must contain characters after '@'")
        if not HANDLE_CHARS_RE.match(clean):
            raise ValueError("Handle contains invalid characters (allowed: letters, numbers, dot, underscore, dash)")
        return f"@{clean}"

    @field_validator("default_affiliate_url")
    @classmethod
    def _check_affiliate_url(cls, v: str | None) -> str | None:
        return validate_affiliate_url(v)

    @field_validator("avatar_path", "logo_path")
    @classmethod
    def _check_asset_path(cls, v: str | None) -> str | None:
        return validate_safe_asset_path(v)

    @field_validator("publishing_profiles")
    @classmethod
    def _check_publishing_profiles(cls, v: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(v, dict):
            raise TypeError("publishing_profiles must be an object/dict")
        if len(v) > 16:
            raise ValueError("Too many publishing profiles (maximum 16)")
        for key in v:
            if not isinstance(key, str) or not key.strip():
                raise ValueError("publishing_profiles keys must be non-empty strings")
        return v


class Brand(BrandBase):
    id: str = Field(..., min_length=1, max_length=64, pattern=r"^[a-zA-Z0-9_-]+$")
    created_at: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())


class BrandCreate(BaseModel):
    id: str | None = Field(None, max_length=64, pattern=r"^[a-zA-Z0-9_-]+$")
    name: str = Field(..., min_length=1, max_length=100)
    handle: str = Field(..., min_length=1, max_length=60)
    niche: str | None = Field(None, max_length=150)
    discovery_keywords: list[str] = Field(default_factory=list)
    avatar_path: str | None = Field(None, max_length=512)
    avatar_url: str | None = Field(None, max_length=1024)
    logo_path: str | None = Field(None, max_length=512)
    default_cta: str = Field("Confira os achadinhos no link da bio!", max_length=500)
    default_affiliate_url: str | None = Field(None, max_length=2048)
    template_id: str = Field("classic-affiliate", max_length=64, pattern=r"^[a-zA-Z0-9_-]+$")
    posting_schedule: dict[str, Any] | None = None
    publishing_profiles: dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="before")
    @classmethod
    def _auto_generate_id(cls, values: Any) -> Any:
        if isinstance(values, dict):
            raw_id = values.get("id")
            if not raw_id or (isinstance(raw_id, str) and not raw_id.strip()):
                name = values.get("name")
                if isinstance(name, str) and name.strip():
                    values["id"] = slugify(name)[:64].rstrip("-_") or "unnamed"
        return values

    @field_validator("name")
    @classmethod
    def _clean_name(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("Brand name must not be blank")
        return v

    @field_validator("handle")
    @classmethod
    def _clean_handle(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("Handle must not be blank")
        clean = v.lstrip("@")
        if not clean:
            raise ValueError("Handle must contain characters after '@'")
        if not HANDLE_CHARS_RE.match(clean):
            raise ValueError("Handle contains invalid characters (allowed: letters, numbers, dot, underscore, dash)")
        return f"@{clean}"

    @field_validator("default_affiliate_url")
    @classmethod
    def _check_affiliate_url(cls, v: str | None) -> str | None:
        return validate_affiliate_url(v)

    @field_validator("avatar_path", "logo_path")
    @classmethod
    def _check_asset_path(cls, v: str | None) -> str | None:
        return validate_safe_asset_path(v)

    @field_validator("publishing_profiles")
    @classmethod
    def _check_publishing_profiles(cls, v: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(v, dict):
            raise TypeError("publishing_profiles must be an object/dict")
        if len(v) > 16:
            raise ValueError("Too many publishing profiles (maximum 16)")
        for key in v:
            if not isinstance(key, str) or not key.strip():
                raise ValueError("publishing_profiles keys must be non-empty strings")
        return v


class BrandUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    handle: str | None = Field(None, min_length=1, max_length=60)
    niche: str | None = Field(None, max_length=150)
    discovery_keywords: list[str] | None = None
    avatar_path: str | None = Field(None, max_length=512)
    avatar_url: str | None = Field(None, max_length=1024)
    logo_path: str | None = Field(None, max_length=512)
    default_cta: str | None = Field(None, max_length=500)
    default_affiliate_url: str | None = Field(None, max_length=2048)
    template_id: str | None = Field(None, max_length=64, pattern=r"^[a-zA-Z0-9_-]+$")
    posting_schedule: dict[str, Any] | None = None
    publishing_profiles: dict[str, Any] | None = None

    @field_validator("name")
    @classmethod
    def _clean_name(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip()
        if not v:
            raise ValueError("Brand name must not be blank")
        return v

    @field_validator("handle")
    @classmethod
    def _clean_handle(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip()
        if not v:
            raise ValueError("Handle must not be blank")
        clean = v.lstrip("@")
        if not clean:
            raise ValueError("Handle must contain characters after '@'")
        if not HANDLE_CHARS_RE.match(clean):
            raise ValueError("Handle contains invalid characters (allowed: letters, numbers, dot, underscore, dash)")
        return f"@{clean}"

    @field_validator("default_affiliate_url")
    @classmethod
    def _check_affiliate_url(cls, v: str | None) -> str | None:
        return validate_affiliate_url(v)

    @field_validator("avatar_path", "logo_path")
    @classmethod
    def _check_asset_path(cls, v: str | None) -> str | None:
        return validate_safe_asset_path(v)

    @field_validator("publishing_profiles")
    @classmethod
    def _check_publishing_profiles(cls, v: dict[str, Any] | None) -> dict[str, Any] | None:
        if v is None:
            return None
        if not isinstance(v, dict):
            raise TypeError("publishing_profiles must be an object/dict")
        if len(v) > 16:
            raise ValueError("Too many publishing profiles (maximum 16)")
        for key in v:
            if not isinstance(key, str) or not key.strip():
                raise ValueError("publishing_profiles keys must be non-empty strings")
        return v


class BrandResponse(Brand):
    """Response model for a single brand."""


class BrandListResponse(BaseModel):
    """Response model for listing brands."""
    brands: list[Brand] = Field(default_factory=list)
    total: int = 0

    @model_validator(mode="before")
    @classmethod
    def _set_total(cls, values: Any) -> Any:
        if isinstance(values, dict) and "total" not in values and "brands" in values and isinstance(values["brands"], list):
            values["total"] = len(values["brands"])
        return values


# ============================================================================
# Brand Workspace & Scheduling Schemas
# ============================================================================

class BrandWorkspaceCounts(BaseModel):
    total_videos: int = 0
    approved_videos: int = 0
    scheduled_posts: int = 0
    published_posts: int = 0


class BrandSocialChannel(BaseModel):
    id: str
    platform: str
    name: str
    connected: bool = True
    avatar_url: str | None = None


class BrandWorkspaceResponse(BaseModel):
    brand: Brand
    provider: str = "postiz"
    counts: BrandWorkspaceCounts
    channels: list[BrandSocialChannel] = Field(default_factory=list)
    template: dict[str, Any] | None = None


class AutoScheduleRequest(BaseModel):
    item_id: str
    channel_ids: list[str] | None = None


class BrandPublishRequest(BaseModel):
    item_id: str
    channel_ids: list[str] = Field(..., min_length=1)
    scheduled_for: str | None = None
    publish_now: bool = False


class ScheduleSlotsRequest(BaseModel):
    slots: list[str] = Field(..., min_length=1)
    timezone: str = "America/Sao_Paulo"
    frequency: int | None = None


class ScheduledTimelinePost(BaseModel):
    id: str
    post_id: str | None = None
    brand_id: str | None = None
    item_id: str | None = None
    job_id: str | None = None
    platform: str | None = None
    channel_id: str | None = None
    channel_name: str | None = None
    channel_handle: str | None = None
    channel_avatar_url: str | None = None
    channels: list[str] = Field(default_factory=list)
    provider: str | None = "postiz"
    provider_url: str | None = None
    provider_post_url: str | None = None
    title: str | None = None
    content: str | None = None
    status: str = "scheduled"
    scheduled_for: str | None = None
    scheduled_time: str | None = None
    published_at: str | None = None
    post_url: str | None = None
    external_url: str | None = None
    thumbnail_url: str | None = None
    error: str | None = None
    metrics: dict[str, Any] = Field(default_factory=dict)
    raw_response: dict[str, Any] | None = None

    @model_validator(mode="before")
    @classmethod
    def _normalize_timeline_post(cls, data: Any) -> Any:
        if isinstance(data, dict):
            d = dict(data)
            p_id = str(d.get("id") or d.get("post_id") or d.get("_id") or "")
            if not p_id or p_id == "None":
                p_id = f"post_{d.get('item_id', 'unknown')}_{uuid.uuid4().hex[:8]}"
            d["id"] = p_id
            d["post_id"] = p_id

            if not d.get("status"):
                d["status"] = "scheduled"

            s_time = d.get("scheduled_for") or d.get("scheduled_time") or d.get("date") or d.get("publishAt")
            if s_time:
                d["scheduled_for"] = str(s_time)
                d["scheduled_time"] = str(s_time)
            url = d.get("post_url") or d.get("external_url") or d.get("url")
            if url:
                d["post_url"] = str(url)
                d["external_url"] = str(url)
            if "channels" not in d or not d["channels"]:
                chs = []
                if d.get("channel_id"):
                    chs.append(str(d["channel_id"]))
                elif d.get("platform"):
                    chs.append(str(d["platform"]))
                if d.get("channel_name") and d["channel_name"] not in chs:
                    chs.append(str(d["channel_name"]))
                d["channels"] = chs
            return d
        return data


class ScheduledTimelineResponse(BaseModel):
    brand_id: str | None = None
    posts: list[ScheduledTimelinePost] = Field(default_factory=list)
    total: int = 0


class SocialChannelResponse(BaseModel):
    id: str
    name: str
    platform: str
    avatar_url: str | None = None
    handle: str | None = None
    connected: bool = True
    provider: str | None = None
    group_id: str | None = None
    group_name: str | None = None
    bound_to_brand_id: str | None = None
    bound_to_brand_name: str | None = None


class WorkspaceSummaryResponse(BaseModel):
    id: str
    name: str
    provider: str


class BrandChannelBindRequest(BaseModel):
    channel_ids: list[str] = Field(default_factory=list)
    workspace_id: str | None = None


# Backward compatibility aliases
SocialAccountResponse = SocialChannelResponse
ScheduleSlotsUpdateRequest = ScheduleSlotsRequest
BrandCreateRequest = BrandCreate
BrandUpdateRequest = BrandUpdate
BrandAutoScheduleRequest = AutoScheduleRequest
BrandAutoScheduleResponse = dict[str, Any]
BrandPublishResponse = dict[str, Any]
