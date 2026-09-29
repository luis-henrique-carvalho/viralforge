"""Atomic JSON file persistence for Brands in ViralForge.

Maintains strict domain isolation for Brand entities, channels, schedules, and assets.
Crash-safe storage adhering to ClippyMe standards:
* Atomic writes using sibling temporary files via ``tempfile.mkstemp()`` and ``os.replace()``
* Durability via ``os.fsync()`` on the file descriptor and parent directory descriptor
* Owner-only permissions (0o700 directories, 0o600 files)
* Thread-safe re-entrant lock protecting reads, mutations, and file I/O
* Default seeding of 'vale-o-clique' brand
* Domain error raising (NotFoundError, ConflictError, ValidationError)
"""
from __future__ import annotations

import contextlib
import json
import logging
import os
import pathlib
import re
import tempfile
import threading
import unicodedata
from datetime import UTC, datetime
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from clippyme.domain.errors import ConflictError, NotFoundError, ValidationError

try:
    import fcntl
except ImportError:  # pragma: no cover
    fcntl = None

logger = logging.getLogger("clippyme.brand_store")

SAFE_ASSET_PREFIXES = ("uploads/", "data/")
SAFE_FILENAME_RE = re.compile(r"^[a-zA-Z0-9_.-]+$")

_STORE_LOCK = threading.RLock()

DATA_DIR = os.environ.get("CLIPPYME_VIRAL_STUDIO_DIR") or os.path.join("data", "viral_studio")
BRANDS_FILENAME = "brands.json"

# Test isolation / monkeypatching override
BRANDS_FILE: str | None = None

DEFAULT_BRAND_ID = "vale-o-clique"
DEFAULT_BRAND_DICT: dict[str, Any] = {
    "id": DEFAULT_BRAND_ID,
    "name": "Vale o Clique?",
    "handle": "@valeoclique",
    "niche": "Achadinhos & Utilidades Domésticas",
    "discovery_keywords": ["achadinhos", "shopee", "utilidades", "achados"],
    "avatar_path": None,
    "avatar_url": None,
    "logo_path": None,
    "default_cta": "Confira os achadinhos no link da bio!",
    "default_affiliate_url": "https://amzn.to/valeoclique",
    "template_id": "classic-affiliate",
    "posting_schedule": {
        "frequency": 3,
        "slots": ["10:00", "15:00", "20:00"],
        "timezone": "America/Sao_Paulo",
    },
    "publishing_profiles": {},
    "created_at": "2026-09-01T00:00:00Z",
    "updated_at": "2026-09-01T00:00:00Z",
    "_is_seed": True,
}

DEFAULT_BRAND_SCHEDULE: dict[str, Any] = {
    "frequency": 3,
    "slots": ["10:00", "15:00", "20:00"],
    "timezone": "America/Sao_Paulo",
}


def _slugify(text: str) -> str:
    """Convert arbitrary text to a URL/identifier-safe slug (max 64 chars)."""
    text = unicodedata.normalize("NFKD", str(text)).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[-\s]+", "-", text).strip("-_")[:64].rstrip("-_") or "unnamed"


def validate_safe_asset_path(v: str | None) -> str | None:
    """Validate that asset path is safe: no absolute paths, no traversal, allowed prefix or filename."""
    if v is None:
        return None
    raw = str(v).strip()
    if not raw:
        return None

    if "\0" in raw or "%00" in raw.lower():
        raise ValidationError("Null bytes are not permitted in asset paths")

    if (
        raw.startswith(("/", "\\"))
        or pathlib.PurePosixPath(raw).is_absolute()
        or pathlib.PureWindowsPath(raw).is_absolute()
        or os.path.isabs(raw)
        or bool(re.match(r"^[a-zA-Z]:", raw))
        or bool(re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", raw))
    ):
        raise ValidationError("Absolute paths are not permitted in asset paths")

    normalized = raw.replace("\\", "/")
    parts = [p for p in normalized.split("/") if p]

    if ".." in parts:
        raise ValidationError("Path traversal ('..') is not permitted in asset paths")

    for part in parts:
        if part.startswith(".") and part != ".":
            raise ValidationError("Hidden files or directories are not permitted in asset paths")

    if normalized.startswith(SAFE_ASSET_PREFIXES):
        if normalized.endswith("/"):
            raise ValidationError("Asset path cannot be a directory")
        return normalized
    if "/" not in normalized:
        if not SAFE_FILENAME_RE.match(normalized) or normalized in (".", ".."):
            raise ValidationError("Invalid asset filename")
        return normalized
    raise ValidationError(
        f"Asset path must start with an allowed prefix ({SAFE_ASSET_PREFIXES!r}) or be a relative filename"
    )


def _to_dict(obj: Any) -> dict[str, Any]:
    if hasattr(obj, "model_dump"):
        return obj.model_dump(exclude_unset=False)
    if hasattr(obj, "dict"):
        return obj.dict()
    if isinstance(obj, dict):
        return dict(obj)
    raise ValidationError(f"Expected dict or Pydantic model, got {type(obj).__name__}")


def _utcnow_iso() -> str:
    return datetime.now(UTC).isoformat()


def set_store_dir(directory: str) -> None:
    global DATA_DIR, BRANDS_FILE
    DATA_DIR = directory
    BRANDS_FILE = None


def reset_store() -> None:
    global DATA_DIR, BRANDS_FILE
    DATA_DIR = os.environ.get("CLIPPYME_VIRAL_STUDIO_DIR") or os.path.join("data", "viral_studio")
    BRANDS_FILE = None


def get_brands_path() -> str:
    if BRANDS_FILE:
        return BRANDS_FILE
    try:
        import clippyme.domain.viral_studio_store as _vstore
        if getattr(_vstore, "BRANDS_FILE", None):
            return _vstore.BRANDS_FILE
    except ImportError:
        pass
    override = os.environ.get("CLIPPYME_VIRAL_STUDIO_BRANDS_FILE")
    if override:
        return override
    try:
        import clippyme.domain.viral_studio_store as _vstore
        dir_path = getattr(_vstore, "DATA_DIR", None) or DATA_DIR
    except ImportError:
        dir_path = DATA_DIR
    return os.path.join(dir_path, BRANDS_FILENAME)


def _ensure_dir(path: str) -> None:
    parent = os.path.dirname(os.path.abspath(path))
    os.makedirs(parent, mode=0o700, exist_ok=True)
    try:
        os.chmod(parent, 0o700)
    except OSError:
        pass


def _read_json_file(path: str) -> dict[str, Any]:
    if not os.path.exists(path):
        return {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, dict) else {}
    except Exception as exc:
        logger.warning("Corrupted or unreadable json file %s: %s; starting empty", path, exc)
        return {}


def _atomic_write_json(path: str, data: Any) -> None:
    _ensure_dir(path)
    parent_dir = os.path.dirname(os.path.abspath(path))
    temp_fd, temp_path = tempfile.mkstemp(dir=parent_dir, prefix=".tmp_", suffix=".tmp", text=True)
    try:
        try:
            os.fchmod(temp_fd, 0o600)
        except (AttributeError, OSError):
            pass

        with os.fdopen(temp_fd, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.flush()
            os.fsync(f.fileno())

        os.replace(temp_path, path)

        if hasattr(os, "O_DIRECTORY"):
            try:
                dir_fd = os.open(parent_dir, os.O_RDONLY | os.O_DIRECTORY)
                try:
                    os.fsync(dir_fd)
                finally:
                    os.close(dir_fd)
            except OSError:
                pass
    except Exception:
        with contextlib.suppress(OSError):
            os.unlink(temp_path)
        raise


def _load_brands_locked() -> dict[str, dict[str, Any]]:
    path = get_brands_path()
    brands = _read_json_file(path)
    if not brands:
        brands = {DEFAULT_BRAND_ID: dict(DEFAULT_BRAND_DICT)}
        _atomic_write_json(path, brands)
    return brands


def list_brands() -> list[dict[str, Any]]:
    with _STORE_LOCK:
        brands = _load_brands_locked()
        res = []
        for b in brands.values():
            item = dict(b)
            item.pop("_is_seed", None)
            res.append(item)
        return sorted(res, key=lambda b: (b.get("name") or b.get("id", "")).lower())


def get_brand(brand_id: str) -> dict[str, Any] | None:
    if not brand_id:
        return None
    with _STORE_LOCK:
        brands = _load_brands_locked()
        brand = brands.get(brand_id)
        if not brand:
            return None
        res = dict(brand)
        res.pop("_is_seed", None)
        if not res.get("posting_schedule"):
            res["posting_schedule"] = dict(DEFAULT_BRAND_SCHEDULE)
        return res


def get_brand_or_raise(brand_id: str) -> dict[str, Any]:
    brand = get_brand(brand_id)
    if brand is None:
        raise NotFoundError(f"Brand not found: {brand_id}")
    return brand


def create_brand(brand: dict[str, Any] | Any) -> dict[str, Any]:
    data = _to_dict(brand)
    brand_id = data.get("id")
    if not brand_id or (isinstance(brand_id, str) and not brand_id.strip()):
        name = data.get("name")
        if not name or (isinstance(name, str) and not name.strip()):
            raise ValidationError("Brand id or name is required")
        brand_id = _slugify(name)
        data["id"] = brand_id

    if "avatar_path" in data and data["avatar_path"] is not None:
        data["avatar_path"] = validate_safe_asset_path(data["avatar_path"])
    if "logo_path" in data and data["logo_path"] is not None:
        data["logo_path"] = validate_safe_asset_path(data["logo_path"])

    data.setdefault("posting_schedule", dict(DEFAULT_BRAND_SCHEDULE))

    with _STORE_LOCK:
        brands = _load_brands_locked()
        if brand_id in brands:
            existing = brands[brand_id]
            if not existing.get("_is_seed"):
                raise ConflictError(f"Brand already exists: {brand_id}")

        now = _utcnow_iso()
        data.setdefault("created_at", now)
        data["updated_at"] = now
        data.pop("_is_seed", None)

        brands[brand_id] = data
        _atomic_write_json(get_brands_path(), brands)
        return dict(data)


def update_brand(brand_id: str, updates: dict[str, Any] | Any) -> dict[str, Any]:
    if not brand_id:
        raise ValidationError("Brand id is required")
    patch = _to_dict(updates)

    if "avatar_path" in patch and patch["avatar_path"] is not None:
        patch["avatar_path"] = validate_safe_asset_path(patch["avatar_path"])
    if "logo_path" in patch and patch["logo_path"] is not None:
        patch["logo_path"] = validate_safe_asset_path(patch["logo_path"])

    with _STORE_LOCK:
        brands = _load_brands_locked()
        if brand_id not in brands:
            raise NotFoundError(f"Brand not found: {brand_id}")

        existing = brands[brand_id]
        for k, v in patch.items():
            if k in ("id", "created_at", "_is_seed"):
                continue
            if v is not None:
                existing[k] = v

        existing["updated_at"] = _utcnow_iso()
        existing.pop("_is_seed", None)
        brands[brand_id] = existing
        _atomic_write_json(get_brands_path(), brands)
        return dict(existing)


def save_brand(brand: dict[str, Any] | Any) -> dict[str, Any]:
    data = _to_dict(brand)
    brand_id = data.get("id")
    if not brand_id or (isinstance(brand_id, str) and not brand_id.strip()):
        name = data.get("name")
        if not name or (isinstance(name, str) and not name.strip()):
            raise ValidationError("Brand id or name is required")
        brand_id = _slugify(name)
        data["id"] = brand_id

    if "avatar_path" in data and data["avatar_path"] is not None:
        data["avatar_path"] = validate_safe_asset_path(data["avatar_path"])
    if "logo_path" in data and data["logo_path"] is not None:
        data["logo_path"] = validate_safe_asset_path(data["logo_path"])

    with _STORE_LOCK:
        brands = _load_brands_locked()
        now = _utcnow_iso()
        if brand_id in brands:
            data.setdefault("created_at", brands[brand_id].get("created_at", now))
        else:
            data.setdefault("created_at", now)
        data["updated_at"] = now
        data.pop("_is_seed", None)

        brands[brand_id] = data
        _atomic_write_json(get_brands_path(), brands)
        return dict(data)


def delete_brand(brand_id: str) -> bool:
    if not brand_id:
        raise ValidationError("Brand id is required")
    with _STORE_LOCK:
        brands = _load_brands_locked()
        if brand_id not in brands:
            raise NotFoundError(f"Brand not found: {brand_id}")
        del brands[brand_id]
        _atomic_write_json(get_brands_path(), brands)
        return True


def update_brand_schedule(
    brand_id: str,
    slots: list[str],
    timezone: str = "America/Sao_Paulo",
    frequency: int | None = None,
) -> dict[str, Any]:
    if not brand_id:
        raise ValidationError("Brand id is required")
    if not slots:
        raise ValidationError("At least one time slot is required")

    try:
        ZoneInfo(timezone)
    except (ZoneInfoNotFoundError, ValueError) as exc:
        raise ValidationError(f"Invalid timezone: {timezone}") from exc

    cleaned_slots: list[str] = []
    time_re = re.compile(r"^([01]?\d|2[0-3]):[0-5]\d$")
    for s in slots:
        s_clean = str(s).strip()
        if not time_re.match(s_clean):
            raise ValidationError(f"Invalid slot time format (expected HH:MM): {s}")
        if len(s_clean) == 4 and s_clean[1] == ":":
            s_clean = f"0{s_clean}"
        cleaned_slots.append(s_clean)

    cleaned_slots = sorted(list(set(cleaned_slots)))

    freq = int(frequency) if frequency and frequency > 0 else len(cleaned_slots)

    schedule_payload = {
        "frequency": freq,
        "slots": cleaned_slots,
        "timezone": timezone,
    }

    return update_brand(brand_id, {"posting_schedule": schedule_payload})
