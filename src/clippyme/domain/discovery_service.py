"""Discovery Service facade module for multi-platform viral video discovery.

Provides search, ranking, virality scoring, and continuous pagination across
TikTok, Instagram, and YouTube.
"""
from __future__ import annotations

from clippyme.domain.discovery import (
    DiscoveryFilter,
    DiscoveryItem,
    DiscoveryProvider,
    DiscoveryResult,
    DiscoveryService,
    PlatformType,
    SortOrder,
    calculate_engagement_rate,
    calculate_freshness_decay,
    calculate_view_velocity,
    calculate_virality_score,
    get_discovery_service,
)

__all__ = [
    "DiscoveryFilter",
    "DiscoveryItem",
    "DiscoveryProvider",
    "DiscoveryResult",
    "DiscoveryService",
    "PlatformType",
    "SortOrder",
    "calculate_engagement_rate",
    "calculate_freshness_decay",
    "calculate_view_velocity",
    "calculate_virality_score",
    "get_discovery_service",
]
