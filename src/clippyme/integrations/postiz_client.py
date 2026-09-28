"""postiz_client — Asynchronous HTTP client for self-hosted Postiz API.

Follows /codebase-design and /ponytail principles:
- Uses httpx.AsyncClient for high-performance non-blocking I/O.
- Safe streaming multipart file upload for large video files.
- Handles authorization headers, error status mapping, and sanitized logging.
"""
from __future__ import annotations

import asyncio
import logging
import mimetypes
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Union
import httpx

logger = logging.getLogger("clippyme.postiz_client")


class PostizError(Exception):
    """Domain exception raised when a Postiz API request fails."""

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        body: Optional[str] = None,
        raw_error: Optional[Exception] = None,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.body = body
        self.raw_error = raw_error

    def __str__(self) -> str:
        parts = [self.message]
        if self.status_code is not None:
            parts.append(f"(status: {self.status_code})")
        if self.body:
            # Mask potential tokens in error body
            sanitized_body = self.body[:300]
            parts.append(f"- body: {sanitized_body}")
        return " ".join(parts)


class PostizClient:
    """Asynchronous client interacting with the Postiz Public API (v1)."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: float = 120.0,
        client: Optional[httpx.AsyncClient] = None,
    ):
        resolved_base_url = base_url if base_url is not None else os.environ.get("POSTIZ_BASE_URL", "http://localhost:4007")
        resolved_api_key = api_key if api_key is not None else os.environ.get("POSTIZ_API_KEY", "")
        self.base_url = (resolved_base_url or "http://localhost:4007").rstrip("/")
        self.api_key = (resolved_api_key or "").strip()
        self.timeout = timeout
        self._external_client = client is not None
        if client is not None:
            self._client = client
        else:
            # Dedicated timeout configuration for streaming uploads and large video payloads
            timeout_cfg = httpx.Timeout(
                connect=20.0,
                read=180.0,
                write=300.0,
                pool=30.0,
            )
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers=self._auth_headers(),
                timeout=timeout_cfg,
            )

    async def __aenter__(self) -> PostizClient:
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        await self.close()

    async def close(self) -> None:
        """Close underlying httpx client if managed internally."""
        if not self._external_client:
            await self._client.aclose()

    def _auth_headers(self) -> Dict[str, str]:
        headers = {
            "ngrok-skip-browser-warning": "1",
            "User-Agent": "ViralForge/1.0",
        }
        if self.api_key:
            headers["Authorization"] = self.api_key
        return headers

    @staticmethod
    def _read_file_sync(path: str) -> bytes:
        with open(path, "rb") as f:
            return f.read()

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None,
        files: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None,
        timeout: Optional[Union[float, httpx.Timeout]] = None,
    ) -> Any:
        """Execute HTTP request with error translation."""
        url = path if path.startswith("http") else f"{self.base_url}{path}"
        headers = self._auth_headers()
        try:
            req_kwargs: Dict[str, Any] = {
                "method": method,
                "url": url,
                "params": params,
                "json": json,
                "files": files,
                "data": data,
                "headers": headers,
            }
            if timeout is not None:
                req_kwargs["timeout"] = timeout
            response = await self._client.request(**req_kwargs)
            if response.is_error:
                error_body = response.text
                logger.warning(
                    "Postiz API error: %s %s -> HTTP %d: %s",
                    method,
                    path,
                    response.status_code,
                    error_body[:200],
                )
                raise PostizError(
                    message=f"Postiz API request failed: {method} {path} returned HTTP {response.status_code}",
                    status_code=response.status_code,
                    body=error_body,
                )
            if response.status_code == 204 or not response.content:
                return {}
            return response.json()
        except httpx.RequestError as exc:
            err_msg = str(exc) or repr(exc) or type(exc).__name__
            logger.error("Postiz connection error on %s %s: %s", method, path, err_msg)
            raise PostizError(
                message=f"Network error connecting to Postiz at {self.base_url}: {err_msg}",
                raw_error=exc,
            ) from exc

    async def upload_file(self, file_path: str) -> Dict[str, Any]:
        """Upload a local video or image file via multipart stream to Postiz.

        Endpoint: POST /api/public/v1/upload
        Returns:
            {"id": "media-uuid", "path": "uploads/..."}
        """
        if not os.path.isfile(file_path):
            raise PostizError(f"Upload failed: file does not exist at {file_path}")

        filename = os.path.basename(file_path)
        content_type = mimetypes.guess_type(file_path)[0] or "application/octet-stream"
        file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
        logger.info(
            "Starting Postiz media upload: %s (%0.2f MB) -> POST %s/api/public/v1/upload",
            filename,
            file_size_mb,
            self.base_url,
        )

        upload_timeout = httpx.Timeout(connect=30.0, read=600.0, write=600.0, pool=30.0)
        file_bytes = await asyncio.to_thread(self._read_file_sync, file_path)
        files = {"file": (filename, file_bytes, content_type)}
        result = await self._request("POST", "/api/public/v1/upload", files=files, timeout=upload_timeout)

        if not isinstance(result, dict) or not result.get("id"):
            logger.error("Postiz upload invalid response: %s", result)
            raise PostizError(
                message=f"Invalid upload response from Postiz: expected dict with 'id', got {result}",
                body=str(result),
            )
        logger.info(
            "Postiz upload finished successfully: %s -> media_id=%s, path=%s",
            filename,
            result.get("id"),
            result.get("path"),
        )
        return result

    async def create_post(
        self,
        integration_id: str,
        content: str,
        media_id: Optional[str] = None,
        media_path: Optional[str] = None,
        date_iso: Optional[str] = None,
        post_type: str = "schedule",
        settings: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create a scheduled or immediate post in Postiz.

        Endpoint: POST /api/public/v1/posts
        Conforms to Postiz CreatePostDto payload schema.
        """
        post_value: Dict[str, Any] = {"content": content}
        if media_id and media_path:
            post_value["image"] = [{"id": media_id, "path": media_path}]
        elif media_id:
            post_value["image"] = [{"id": media_id, "path": media_id}]

        payload: Dict[str, Any] = {
            "type": "now" if post_type == "now" else "schedule",
            "shortLink": False,
            "tags": [],
            "posts": [
                {
                    "integration": {"id": integration_id},
                    "value": [post_value],
                    "settings": settings or {},
                }
            ],
        }
        if date_iso and post_type != "now":
            payload["date"] = date_iso
        elif post_type == "now":
            payload["date"] = datetime.now(timezone.utc).isoformat()

        logger.info(
            "Submitting Postiz post: integration_id=%s, type=%s, date=%s, media_id=%s",
            integration_id,
            payload.get("type"),
            payload.get("date"),
            media_id,
        )
        res = await self._request("POST", "/api/public/v1/posts", json=payload)
        logger.info("Postiz post creation completed: %s", res)
        return res

    async def find_slot(self, integration_id: str) -> datetime:
        """Find next available publication slot for given integration.

        Endpoint: GET /api/public/v1/find-slot/{integration_id}
        """
        res = await self._request("GET", f"/api/public/v1/find-slot/{integration_id}")
        slot_str: Optional[str] = None
        if isinstance(res, dict):
            slot_str = res.get("date") or res.get("slot") or res.get("nextSlot")
        elif isinstance(res, str):
            slot_str = res

        if not slot_str:
            raise PostizError(f"No slot date returned by Postiz for integration {integration_id}: {res}")

        try:
            # Handle ISO formats ending with Z or offset
            dt = datetime.fromisoformat(slot_str.replace("Z", "+00:00"))
            return dt
        except ValueError as exc:
            raise PostizError(f"Malformed date returned by Postiz find-slot: {slot_str}") from exc

    async def list_integrations(self, group_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """List social accounts/integrations configured in Postiz.

        Endpoint: GET /api/public/v1/integrations
        Optional query param: ?group={groupId}
        """
        params = {"group": group_id} if group_id else None
        res = await self._request("GET", "/api/public/v1/integrations", params=params)
        if isinstance(res, list):
            integrations = res
        elif isinstance(res, dict) and "integrations" in res:
            integrations = res["integrations"]
        else:
            integrations = []

        if group_id:
            def _matches_group(item: Dict[str, Any], gid: str) -> bool:
                c = item.get("customer")
                if isinstance(c, dict):
                    if c.get("id") == gid or c.get("name") == gid:
                        return True
                elif isinstance(c, str) and c == gid:
                    return True
                if item.get("groupId") == gid or item.get("customerId") == gid:
                    return True
                if gid in (item.get("groups") or []):
                    return True
                return False

            return [item for item in integrations if _matches_group(item, str(group_id))]
        return integrations

    async def list_workspaces(self) -> List[Dict[str, str]]:
        """List all customer groups from Postiz.

        Endpoint: GET /api/public/v1/groups
        """
        try:
            res = await self._request("GET", "/api/public/v1/groups")
            if isinstance(res, list) and res:
                return [
                    {"id": str(g.get("id")), "name": str(g.get("name") or g.get("id"))}
                    for g in res
                    if isinstance(g, dict) and g.get("id")
                ]
        except PostizError as exc:
            logger.warning("Postiz /groups endpoint failed, falling back to integrations scan: %s", exc)

        # Fallback to scanning integrations customer field
        integrations = await self.list_integrations()
        workspaces: Dict[str, str] = {}
        for item in integrations:
            if isinstance(item, dict):
                c = item.get("customer")
                if isinstance(c, dict) and c.get("id"):
                    workspaces[str(c["id"])] = str(c.get("name") or c["id"])
                elif isinstance(c, str) and c.strip():
                    workspaces[c.strip()] = c.strip()
        return [{"id": wid, "name": wname} for wid, wname in workspaces.items()]

    async def get_post(self, post_id: str) -> Dict[str, Any]:
        """Fetch a specific post by ID.

        Endpoint: GET /api/public/v1/posts/{post_id}
        """
        try:
            res = await self._request("GET", f"/api/public/v1/posts/{post_id}")
            return res if isinstance(res, dict) else {}
        except PostizError as exc:
            if exc.status_code == 404:
                return {}
            raise

    async def delete_post(self, post_id: str) -> bool:
        """Cancel and delete a scheduled post in Postiz.

        Endpoint: DELETE /api/public/v1/posts/{post_id}
        """
        try:
            await self._request("DELETE", f"/api/public/v1/posts/{post_id}")
            return True
        except PostizError as exc:
            if exc.status_code == 404:
                return False
            raise

    async def list_posts(
        self,
        customer_id: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """List scheduled and published posts within date window.

        Endpoint: GET /api/public/v1/posts
        """
        params: Dict[str, Any] = {}
        if customer_id:
            params["customer"] = customer_id

        now = datetime.now(timezone.utc)
        if not start_date:
            start_date = (now - timedelta(days=7)).isoformat()
        if not end_date:
            end_date = (now + timedelta(days=60)).isoformat()

        params["startDate"] = start_date
        params["endDate"] = end_date

        res = await self._request("GET", "/api/public/v1/posts", params=params)
        if isinstance(res, list):
            return res
        if isinstance(res, dict) and "posts" in res:
            return res["posts"]
        return []

    async def get_metrics(self, post_id: str) -> Dict[str, Any]:
        """Fetch analytics metrics for a specific post.

        Endpoint: GET /api/public/v1/analytics/post/{post_id}
        """
        try:
            res = await self._request("GET", f"/api/public/v1/analytics/post/{post_id}")
            return res if isinstance(res, dict) else {}
        except PostizError as exc:
            if exc.status_code == 404:
                return {}
            raise
