"""social_publisher_port — Abstract Domain Port for Social Media Publishing.

Follows Hexagonal Architecture (Ports & Adapters) and /codebase-design principles:
- Small, stable interface: publish(), schedule(), cancel(), get_status(), list_accounts()
- Deep implementations hidden in concrete adapters (ZernioPublisherAdapter, MockPublisherAdapter)
- Pure, immutable DTOs (PublicationJob, PublicationReceipt, SocialChannel)
- Two Adapters Rule: production adapter + deterministic in-memory mock adapter
"""
from __future__ import annotations

import os
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


@dataclass(frozen=True)
class PublicationJob:
    """Immutable input DTO for a social publication or scheduling request."""
    item_id: str
    video_path: Optional[str] = None
    media_path: Optional[str] = None
    content: Optional[str] = None
    caption: Optional[str] = None
    title: Optional[str] = None
    platform: Optional[str] = None
    account_id: Optional[str] = None
    platforms: List[Dict[str, Any]] = field(default_factory=list)
    platform_specific_data: Optional[Dict[str, Any]] = None
    scheduled_for: Optional[str] = None
    timezone: str = "America/Sao_Paulo"
    publish_now: bool = False
    tiktok_settings: Optional[Dict[str, Any]] = None
    extra: Dict[str, Any] = field(default_factory=dict)

    @property
    def effective_media_path(self) -> str:
        return self.video_path or self.media_path or ""

    @property
    def effective_content(self) -> str:
        return self.content or self.caption or ""

    @property
    def effective_platforms(self) -> List[Dict[str, Any]]:
        if self.platforms:
            return self.platforms
        if self.platform or self.account_id:
            p_data: Dict[str, Any] = {
                "platform": self.platform or "tiktok",
                "accountId": self.account_id,
            }
            if self.platform_specific_data:
                p_data["platformSpecificData"] = self.platform_specific_data
            return [p_data]
        return []


@dataclass(frozen=True)
class PublicationReceipt:
    """Immutable receipt returned by the publisher port upon dispatch or query."""
    item_id: str
    status: str  # "scheduled" | "published" | "failed" | "cancelled"
    post_id: Optional[str] = None
    platform_post_id: Optional[str] = None
    scheduled_for: Optional[str] = None
    published_at: Optional[str] = None
    post_url: Optional[str] = None
    error: Optional[str] = None
    raw_response: Optional[Dict[str, Any]] = None


@dataclass(frozen=True)
class SocialChannel:
    """Connected social account channel exposed to the UI and scheduling router."""
    id: str
    platform: str  # "tiktok" | "instagram" | "youtube"
    name: str
    connected: bool = True
    avatar_url: Optional[str] = None


class SocialPublisherPort(ABC):
    """Abstract port defining capabilities required of any social media distribution provider."""

    @abstractmethod
    async def publish(self, job: PublicationJob) -> PublicationReceipt:
        """Publish a video immediately to configured social platforms."""
        ...

    @abstractmethod
    async def schedule(self, job: PublicationJob) -> PublicationReceipt:
        """Schedule a video for future publication at the timestamp specified in job."""
        ...

    @abstractmethod
    async def cancel(self, external_id: str) -> bool:
        """Cancel a previously scheduled publication on the external provider."""
        ...

    @abstractmethod
    async def get_status(self, external_id: str) -> PublicationReceipt:
        """Check status of a publication by its external post ID."""
        ...

    async def list_accounts(self) -> List[SocialChannel]:
        """List active connected accounts available for posting."""
        return []


_GLOBAL_PUBLISHER: Optional[SocialPublisherPort] = None


def set_social_publisher(publisher: Optional[SocialPublisherPort]) -> None:
    """Set global active publisher instance (used for dependency injection and tests)."""
    global _GLOBAL_PUBLISHER
    _GLOBAL_PUBLISHER = publisher


def get_social_publisher(provider: Optional[str] = None) -> SocialPublisherPort:
    """Resolve and instantiate the active SocialPublisherPort adapter.

    Resolution strategy:
    1. If _GLOBAL_PUBLISHER is set and provider is None, return it.
    2. If MOCK_PUBLISHER=1 or provider == 'mock', return MockPublisherAdapter.
    3. If provider == 'zernio' or Zernio API key is set, return ZernioPublisherAdapter.
    4. Fallback to MockPublisherAdapter for offline execution.
    """
    global _GLOBAL_PUBLISHER
    if _GLOBAL_PUBLISHER is not None and provider is None:
        return _GLOBAL_PUBLISHER

    use_mock = (
        provider == "mock"
        or os.environ.get("MOCK_PUBLISHER", "").strip().lower() in ("1", "true", "yes")
    )
    if use_mock:
        from clippyme.domain.mock_publisher_adapter import MockPublisherAdapter
        return MockPublisherAdapter()

    # Check Zernio configuration
    from clippyme.storage.config_store import load_zernio_config
    zernio_cfg = load_zernio_config() or {}
    api_key = (
        os.environ.get("ZERNIO_API_KEY")
        or zernio_cfg.get("api_key")
        or ""
    ).strip()

    if (api_key or provider == "zernio") and provider != "mock":
        from clippyme.domain.zernio_publisher_adapter import ZernioPublisherAdapter
        return ZernioPublisherAdapter(api_key=api_key or "dummy_zernio_key")

    # Safe deterministic offline fallback
    from clippyme.domain.mock_publisher_adapter import MockPublisherAdapter
    return MockPublisherAdapter()

