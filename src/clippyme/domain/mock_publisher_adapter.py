"""mock_publisher_adapter — Deterministic in-memory adapter for SocialPublisherPort.

Adheres to the Two Adapters Rule (/codebase-design):
Provides an immediate, 100% deterministic, zero-network adapter for offline execution,
unit tests, CI/CD pipelines, and local development without requiring external credentials.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from clippyme.domain.social_publisher_port import (
    PublicationJob,
    PublicationReceipt,
    SocialChannel,
    SocialPublisherPort,
)


class MockPublisherAdapter(SocialPublisherPort):
    """In-memory test double satisfying the SocialPublisherPort contract."""

    def __init__(self, simulate_failure: bool = False, failure_error: Optional[str] = None):
        self.simulate_failure = simulate_failure
        self.failure_error = failure_error or "Simulated publisher failure"
        self._posts: Dict[str, Dict[str, Any]] = {}
        self._accounts: List[SocialChannel] = [
            SocialChannel(
                id="mock_tiktok_01",
                platform="tiktok",
                name="@achadinhos_virais",
                connected=True,
                avatar_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
            ),
            SocialChannel(
                id="mock_instagram_01",
                platform="instagram",
                name="@valeoclique.promos",
                connected=True,
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
            ),
            SocialChannel(
                id="mock_youtube_01",
                platform="youtube",
                name="Achados em 1 Minuto",
                connected=True,
                avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
            ),
        ]

    async def publish(self, job: PublicationJob) -> PublicationReceipt:
        """Simulate immediate publication."""
        if self.simulate_failure:
            return PublicationReceipt(
                item_id=job.item_id,
                status="failed",
                error=self.failure_error,
            )

        post_id = f"mock_post_{uuid.uuid4().hex[:8]}"
        now_iso = datetime.now(timezone.utc).isoformat()
        platform = (job.platform or (job.effective_platforms[0]["platform"] if job.effective_platforms else "tiktok")).lower()
        platform_post_id = f"ext_{post_id}"
        post_url = f"https://mock-{platform}.com/p/{post_id}"

        record = {
            "post_id": post_id,
            "platform_post_id": platform_post_id,
            "item_id": job.item_id,
            "status": "published",
            "published_at": now_iso,
            "post_url": post_url,
            "job": job,
        }
        self._posts[post_id] = record

        return PublicationReceipt(
            item_id=job.item_id,
            status="published",
            post_id=post_id,
            platform_post_id=platform_post_id,
            published_at=now_iso,
            post_url=post_url,
            raw_response={"mock": True, "created_at": now_iso},
        )

    async def schedule(self, job: PublicationJob) -> PublicationReceipt:
        """Simulate scheduling for a future slot."""
        if self.simulate_failure:
            return PublicationReceipt(
                item_id=job.item_id,
                status="failed",
                error=self.failure_error,
            )

        post_id = f"mock_post_{uuid.uuid4().hex[:8]}"
        sched_time = job.scheduled_for or datetime.now(timezone.utc).isoformat()
        platform = (job.platform or (job.effective_platforms[0]["platform"] if job.effective_platforms else "tiktok")).lower()
        post_url = f"https://mock-{platform}.com/p/{post_id}"

        record = {
            "post_id": post_id,
            "platform_post_id": f"ext_{post_id}",
            "item_id": job.item_id,
            "status": "scheduled",
            "scheduled_for": sched_time,
            "post_url": post_url,
            "job": job,
        }
        self._posts[post_id] = record

        return PublicationReceipt(
            item_id=job.item_id,
            status="scheduled",
            post_id=post_id,
            platform_post_id=f"ext_{post_id}",
            scheduled_for=sched_time,
            post_url=post_url,
            raw_response={"mock": True, "scheduled_for": sched_time},
        )

    async def cancel(self, external_id: str) -> bool:
        """Simulate cancelling an external scheduled post."""
        if external_id in self._posts:
            self._posts[external_id]["status"] = "cancelled"
            return True
        return False

    async def get_status(self, external_id: str) -> PublicationReceipt:
        """Retrieve simulated status."""
        record = self._posts.get(external_id)
        if not record:
            return PublicationReceipt(
                item_id="",
                status="failed",
                error="Post not found in mock store",
            )
        return PublicationReceipt(
            item_id=record.get("item_id", ""),
            status=record.get("status", "unknown"),
            post_id=record.get("post_id"),
            platform_post_id=record.get("platform_post_id"),
            scheduled_for=record.get("scheduled_for"),
            published_at=record.get("published_at"),
            post_url=record.get("post_url"),
        )

    async def list_accounts(self) -> List[SocialChannel]:
        """Return available mock channels."""
        return list(self._accounts)
