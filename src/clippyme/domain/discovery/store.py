"""Atomic JSON file persistence for Discovery Searches (DiscoverySearch and searches_index).

Crash-safe storage adhering to ClippyMe standards:
* Atomic writes using sibling temporary files via ``tempfile.mkstemp()`` and ``os.replace()``
* Durability via ``os.fsync()`` on the file descriptor and parent directory descriptor
* Owner-only permissions (0o700 directories, 0o600 files)
* Single re-entrant lock (``threading.RLock``) protecting reads, mutations, and file I/O
* Domain error handling and fast indexing in ``searches_index.json``
"""
from __future__ import annotations

import contextlib
import json
import logging
import os
import re
import tempfile
import threading
from typing import Any, Dict, List, Optional, Union

from clippyme.domain.discovery.schemas import (
    DiscoveryItem,
    DiscoverySearch,
    DiscoverySearchStatus,
    DiscoverySearchSummary,
    PlatformType,
)
from clippyme.domain.errors import NotFoundError, ValidationError

logger = logging.getLogger("clippyme.discovery_store")

DATA_DIR = os.environ.get("CLIPPYME_DISCOVERY_DIR") or os.path.join("data", "discovery")
INDEX_FILENAME = "searches_index.json"
SAFE_ID_RE = re.compile(r"^[a-zA-Z0-9_-]{1,128}$")

_STORE_LOCK = threading.RLock()


def get_discovery_dir() -> str:
    return DATA_DIR


def set_discovery_dir(directory: str) -> None:
    global DATA_DIR
    DATA_DIR = directory


def get_search_path(search_id: str) -> str:
    clean_id = str(search_id).strip()
    if not SAFE_ID_RE.match(clean_id):
        raise ValidationError(f"Invalid search_id format: {clean_id!r}")
    return os.path.join(get_discovery_dir(), f"{clean_id}.json")


def get_index_path() -> str:
    return os.path.join(get_discovery_dir(), INDEX_FILENAME)


def _atomic_write_json(file_path: str, data: Any) -> None:
    """Durably and atomically replace target JSON file with owner-only (0o600) permissions."""
    directory = os.path.dirname(file_path) or "."
    os.makedirs(directory, mode=0o700, exist_ok=True)
    with contextlib.suppress(OSError):
        os.chmod(directory, 0o700)

    prefix = f".{os.path.basename(file_path)}-"
    fd, tmp_path = tempfile.mkstemp(prefix=prefix, suffix=".tmp", dir=directory)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.flush()
            os.fsync(f.fileno())

        with contextlib.suppress(OSError):
            os.chmod(tmp_path, 0o600)

        os.replace(tmp_path, file_path)
        tmp_path = None

        with contextlib.suppress(OSError):
            os.chmod(file_path, 0o600)

        # Persist directory entry on POSIX filesystems
        try:
            dir_fd = os.open(directory, os.O_RDONLY)
        except OSError:
            dir_fd = None
        if dir_fd is not None:
            try:
                os.fsync(dir_fd)
            except OSError:
                pass
            finally:
                os.close(dir_fd)
    except Exception:
        with contextlib.suppress(OSError):
            os.close(fd)
        raise
    finally:
        if tmp_path and os.path.exists(tmp_path):
            with contextlib.suppress(OSError):
                os.remove(tmp_path)


def _read_json_file(file_path: str) -> Optional[Any]:
    """Read a JSON file; return None if missing or corrupt."""
    if not os.path.exists(file_path):
        return None
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError, TypeError) as exc:
        logger.warning("Error reading %s: %s", file_path, exc)
        return None


def _to_summary_dict(search: Union[DiscoverySearch, Dict[str, Any]]) -> Dict[str, Any]:
    if isinstance(search, DiscoverySearch):
        return {
            "id": search.id,
            "platform": search.platform.value if isinstance(search.platform, PlatformType) else str(search.platform),
            "query": search.query,
            "status": search.status.value if isinstance(search.status, DiscoverySearchStatus) else str(search.status),
            "total_found": search.total_found,
            "created_at": search.created_at,
            "completed_at": search.completed_at,
            "error_message": search.error_message,
        }
    plat = search.get("platform")
    plat_val = plat.value if hasattr(plat, "value") else plat
    stat = search.get("status", DiscoverySearchStatus.QUEUED.value)
    stat_val = stat.value if hasattr(stat, "value") else stat
    return {
        "id": search.get("id"),
        "platform": plat_val,
        "query": search.get("query"),
        "status": stat_val,
        "total_found": search.get("total_found", 0),
        "created_at": search.get("created_at"),
        "completed_at": search.get("completed_at"),
        "error_message": search.get("error_message"),
    }


def _load_index_locked() -> Dict[str, Dict[str, Any]]:
    index_data = _read_json_file(get_index_path())
    if isinstance(index_data, dict):
        return index_data
    if isinstance(index_data, list):
        # Migrating list-based index if any
        return {item["id"]: item for item in index_data if isinstance(item, dict) and "id" in item}
    return {}


def _update_index_locked(search: Union[DiscoverySearch, Dict[str, Any]]) -> None:
    index = _load_index_locked()
    summary = _to_summary_dict(search)
    sid = summary["id"]
    index[sid] = summary
    _atomic_write_json(get_index_path(), index)


def _remove_from_index_locked(search_id: str) -> None:
    index = _load_index_locked()
    if search_id in index:
        del index[search_id]
        _atomic_write_json(get_index_path(), index)


def save_search(search: Union[DiscoverySearch, Dict[str, Any]]) -> DiscoverySearch:
    """Save or update a DiscoverySearch atomically and refresh the index."""
    if isinstance(search, dict):
        search_obj = DiscoverySearch.model_validate(search)
    else:
        search_obj = search

    search_id = search_obj.id
    if not search_id or not str(search_id).strip():
        raise ValidationError("search_id is required")

    with _STORE_LOCK:
        file_path = get_search_path(search_id)
        _atomic_write_json(file_path, search_obj.model_dump(mode="json"))
        _update_index_locked(search_obj)
        return search_obj


def get_search(search_id: str) -> Optional[DiscoverySearch]:
    """Retrieve a DiscoverySearch by ID, returning None if not found."""
    if not search_id:
        return None
    with _STORE_LOCK:
        try:
            file_path = get_search_path(search_id)
        except ValidationError:
            return None

        data = _read_json_file(file_path)
        if not data or not isinstance(data, dict):
            return None
        return DiscoverySearch.model_validate(data)


def get_search_or_raise(search_id: str) -> DiscoverySearch:
    """Retrieve a DiscoverySearch by ID or raise NotFoundError."""
    search = get_search(search_id)
    if search is None:
        raise NotFoundError(f"Discovery search not found: {search_id}")
    return search


def list_searches(limit: int = 50) -> List[DiscoverySearchSummary]:
    """List recent DiscoverySearches ordered by creation timestamp descending."""
    with _STORE_LOCK:
        index = _load_index_locked()
        summaries: List[DiscoverySearchSummary] = []
        for item in index.values():
            try:
                summaries.append(DiscoverySearchSummary.model_validate(item))
            except Exception as exc:
                logger.warning("Invalid search summary in index: %s", exc)

        # Sort descending by created_at
        summaries.sort(key=lambda s: s.created_at or "", reverse=True)
        return summaries[:limit]


def delete_search(search_id: str) -> bool:
    """Delete a DiscoverySearch and remove it from the index."""
    if not search_id:
        raise ValidationError("search_id is required")
    with _STORE_LOCK:
        file_path = get_search_path(search_id)
        deleted = False
        if os.path.exists(file_path):
            with contextlib.suppress(OSError):
                os.remove(file_path)
                deleted = True
        _remove_from_index_locked(search_id)
        return deleted


def mark_imported_status(items: List[DiscoveryItem]) -> List[DiscoveryItem]:
    """Cross-reference DiscoveryItems with existing ViralStudio batches to flag imported items."""
    if not items:
        return items

    from clippyme.domain.viral_studio_store import list_batches

    try:
        batches = list_batches()
    except Exception as exc:
        logger.warning("Could not load batches to mark imported status: %s", exc)
        return items

    imported_urls_to_batch: Dict[str, str] = {}
    for batch in batches:
        batch_id = batch.get("batch_id") or batch.get("id", "")
        for item in batch.get("items", []):
            url = item.get("source_url")
            if url and str(url).strip():
                clean_url = str(url).strip()
                if clean_url not in imported_urls_to_batch:
                    imported_urls_to_batch[clean_url] = batch_id

    enriched_items: List[DiscoveryItem] = []
    for item in items:
        clean_url = (item.url or "").strip()
        if clean_url in imported_urls_to_batch:
            item_dict = item.model_dump()
            item_dict["already_imported"] = True
            item_dict["imported_batch_id"] = imported_urls_to_batch[clean_url]
            enriched_items.append(DiscoveryItem.model_validate(item_dict))
        else:
            enriched_items.append(item)

    return enriched_items


def reset_discovery_store() -> None:
    """Clear all stored discovery files (for test isolation)."""
    with _STORE_LOCK:
        directory = get_discovery_dir()
        if os.path.exists(directory):
            for fname in os.listdir(directory):
                fpath = os.path.join(directory, fname)
                if os.path.isfile(fpath):
                    with contextlib.suppress(OSError):
                        os.remove(fpath)
