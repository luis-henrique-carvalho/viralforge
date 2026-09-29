"""Atomic JSON file persistence for Viral Content Studio (Brands, Templates, Batches).

Crash-safe storage adhering to ClippyMe standards:
* Atomic writes using sibling temporary files via ``tempfile.mkstemp()`` and ``os.replace()``
* Durability via ``os.fsync()`` on the file descriptor and parent directory descriptor
* Owner-only permissions (0o700 directories, 0o600 files)
* Single re-entrant lock (``threading.RLock``) protecting reads, mutations, and file I/O
* Default seeding of 'vale-o-clique' brand and 'classic-affiliate' template
* Domain error raising (NotFoundError, ConflictError, ValidationError) mapped by API layer
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
import uuid
from datetime import date, datetime, time, timedelta, timezone
from typing import Any, Dict, List, Optional, Union
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from clippyme.domain.errors import ConflictError, NotFoundError, ValidationError

try:
    import fcntl
except ImportError:  # pragma: no cover - exercised on Windows
    fcntl = None

logger = logging.getLogger("clippyme.viral_studio_store")

SAFE_ASSET_PREFIXES = ("uploads/", "data/")
SAFE_FILENAME_RE = re.compile(r"^[a-zA-Z0-9_.-]+$")
SAFE_ID_RE = re.compile(r"^[a-zA-Z0-9_-]{1,128}$")


def _slugify(text: str) -> str:
    """Convert arbitrary text to a URL/identifier-safe slug (max 64 chars)."""
    text = unicodedata.normalize("NFKD", str(text)).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[-\s]+", "-", text).strip("-_")[:64].rstrip("-_") or "unnamed"


def validate_safe_asset_path(v: Optional[str]) -> Optional[str]:
    """Validate that asset path is safe: no absolute paths, no traversal, allowed prefix or filename."""
    if v is None:
        return None
    raw = str(v).strip()
    if not raw:
        return None

    if "\0" in raw or "%00" in raw.lower():
        raise ValidationError("Null bytes are not permitted in asset paths")

    # Reject absolute paths (POSIX root, Windows drive or backslash root, UNC shares, URL schemes)
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
    elif "/" not in normalized:
        if not SAFE_FILENAME_RE.match(normalized) or normalized in (".", ".."):
            raise ValidationError("Invalid asset filename")
        return normalized
    else:
        raise ValidationError(
            f"Asset path must start with an allowed prefix ({SAFE_ASSET_PREFIXES!r}) or be a relative filename"
        )

DATA_DIR = os.environ.get("CLIPPYME_VIRAL_STUDIO_DIR") or os.path.join("data", "viral_studio")
BRANDS_FILENAME = "brands.json"
TEMPLATES_FILENAME = "templates.json"
BATCHES_FILENAME = "batches.json"

# Overrides for test isolation / monkeypatching
BRANDS_FILE: Optional[str] = None
TEMPLATES_FILE: Optional[str] = None
BATCHES_FILE: Optional[str] = None
ITEMS_FILE: Optional[str] = None
DISPATCH_QUEUE_FILE: Optional[str] = None

_STORE_THREAD_LOCK = threading.RLock()
_LOCK_DEPTH = 0
_LOCK_FD: Optional[int] = None


def get_lock_path() -> str:
    directory = (
        os.path.dirname(BATCHES_FILE) if BATCHES_FILE
        else os.path.dirname(BRANDS_FILE) if BRANDS_FILE
        else DATA_DIR
    ) or "."
    return os.path.join(directory, ".store.lock")


@contextlib.contextmanager
def store_lock():
    """Context manager for cross-process (and cross-thread) exclusive store access."""
    global _LOCK_DEPTH, _LOCK_FD
    _STORE_THREAD_LOCK.acquire()
    try:
        if _LOCK_DEPTH == 0 and fcntl is not None:
            lock_path = get_lock_path()
            lock_dir = os.path.dirname(lock_path) or "."
            os.makedirs(lock_dir, mode=0o700, exist_ok=True)
            fd = os.open(lock_path, os.O_RDWR | os.O_CREAT, 0o600)
            try:
                fcntl.flock(fd, fcntl.LOCK_EX)
            except Exception:
                with contextlib.suppress(OSError):
                    os.close(fd)
                raise
            _LOCK_FD = fd
        _LOCK_DEPTH += 1
        try:
            yield
        finally:
            _LOCK_DEPTH -= 1
            if _LOCK_DEPTH == 0 and _LOCK_FD is not None:
                fd = _LOCK_FD
                _LOCK_FD = None
                try:
                    fcntl.flock(fd, fcntl.LOCK_UN)
                except OSError:
                    pass
                finally:
                    with contextlib.suppress(OSError):
                        os.close(fd)
    finally:
        _STORE_THREAD_LOCK.release()


_LOCAL = threading.local()


class _StoreLockWrapper:
    def __enter__(self):
        cm = store_lock()
        stack = getattr(_LOCAL, "stack", None)
        if stack is None:
            stack = []
            _LOCAL.stack = stack
        stack.append(cm)
        return cm.__enter__()

    def __exit__(self, exc_type, exc_val, exc_tb):
        stack = getattr(_LOCAL, "stack", None)
        if stack:
            cm = stack.pop()
            return cm.__exit__(exc_type, exc_val, exc_tb)
        return None

    def __call__(self):
        return store_lock()


_STORE_LOCK = _StoreLockWrapper()
_store_lock = store_lock

# Default Seeds
DEFAULT_BRAND_ID = "vale-o-clique"
DEFAULT_TEMPLATE_ID = "classic-affiliate"

DEFAULT_TEMPLATE_DICT: Dict[str, Any] = {
    "id": DEFAULT_TEMPLATE_ID,
    "name": "Achadinhos & Afiliados",
    "is_system": True,
    "width": 1080,
    "height": 1920,
    "background_color": "#FFFFFF",
    "avatar_enabled": True,
    "brand_name_enabled": True,
    "headline_enabled": True,
    "watermark_enabled": True,
    "video_fit": "contain",
    "video_aspect": "1:1",
    "video_x": None,
    "video_y": 360,
    "video_width": None,
    "video_height": 1000,
    "video_scale": 92,
    "video_radius": 16,
    "video_border_width": 2,
    "video_border_color": "#F97316",
    "video_shadow": "deep",
    "avatar_x": 60,
    "avatar_y": 80,
    "avatar_size": 100,
    "brand_name_font_size": 36,
    "brand_name_color": "#111111",
    "handle_font_size": 26,
    "handle_color": "#666666",
    "headline_font": "Montserrat-ExtraBold",
    "headline_font_size": 48,
    "headline_color": "#111111",
    "headline_y": 130,
    "headline_max_lines": 3,
    "headline_margin_x": 60,
    "headline_margin_top": 30,
    "badge_enabled": True,
    "custom_badge_text": "ACHADINHO 🔥",
    "custom_badge_bg_color": "#F97316",
    "custom_badge_text_color": "#FFFFFF",
    "badge_y": 45,
    "extra_image_enabled": True,
    "extra_image_path": None,
    "extra_image_url": None,
    "extra_image_template_type": "deal",
    "extra_image_x": None,
    "extra_image_y": 1420,
    "extra_image_height": 340,
    "extra_image_width": 92,
    "extra_image_radius": 16,
    "watermark_opacity": 0.7,
    "watermark_position": "bottom-right",
    "niche_type": "affiliate",
    "conversion_goal": "affiliate",
    "persona_role": "Especialista em curadoria de produtos virais e achadinhos úteis para o dia a dia",
    "tone_of_voice": "Entusiasmado, prático, direto e persuasivo",
    "call_to_action_template": "Comente QUERO ou clique no link da bio para garantir o seu com desconto!",
    "default_hashtags": ["#achadinhos", "#shopee", "#utilidades", "#comprinhas", "#dicas", "#publi"],
    "preferred_model": None,
    "generation_tasks": [
        {
            "id": "headline",
            "label": "Headline no Vídeo",
            "target": "canvas_headline",
            "instruction": "Crie 5 headlines curtas focando no benefício prático e na utilidade do produto demonstrado em {transcript}.",
            "output_type": "options_list",
            "is_required": True,
        },
        {
            "id": "caption",
            "label": "Legenda Comercial",
            "target": "post_caption",
            "instruction": "Escreva uma legenda de alta conversão contendo gancho, descrição da dor/solução, código do produto se houver, e CTA: {cta}.",
            "output_type": "text",
            "is_required": True,
        },
        {
            "id": "product_name",
            "label": "Identificação do Produto",
            "target": "custom_metadata",
            "instruction": "Nome conciso e categoria do produto identificado.",
            "output_type": "text",
            "is_required": True,
        },
    ],
    "created_at": "2026-09-19T00:00:00Z",
    "updated_at": "2026-09-19T00:00:00Z",
}

DEFAULT_BRAND_DICT: Dict[str, Any] = {
    "id": DEFAULT_BRAND_ID,
    "name": "Vale o Clique?",
    "handle": "@valeoclique",
    "niche": "Achadinhos & Compras Inteligentes",
    "discovery_keywords": ["achadinhos shopee", "produtos virais", "unboxing"],
    "avatar_path": None,
    "avatar_url": None,
    "logo_path": None,
    "default_cta": "Confira os achadinhos no link da bio!",
    "default_affiliate_url": None,
    "template_id": DEFAULT_TEMPLATE_ID,
    "posting_schedule": {
        "frequency": 3,
        "slots": ["10:00", "15:00", "20:00"],
        "timezone": "America/Sao_Paulo",
    },
    "publishing_profiles": {},
    "created_at": "2026-09-19T00:00:00Z",
    "updated_at": "2026-09-19T00:00:00Z",
    "_is_seed": True,
}


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _to_dict(obj: Any) -> Dict[str, Any]:
    if isinstance(obj, dict):
        return dict(obj)
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    if hasattr(obj, "dict"):
        return obj.dict()
    if hasattr(obj, "__dict__"):
        return dict(obj.__dict__)
    raise ValueError(f"Cannot serialize object of type {type(obj)} to dict")


def get_store_dir() -> str:
    return DATA_DIR


def set_store_dir(directory: str) -> None:
    global DATA_DIR, BRANDS_FILE, TEMPLATES_FILE, BATCHES_FILE, ITEMS_FILE, DISPATCH_QUEUE_FILE
    DATA_DIR = directory
    BRANDS_FILE = None
    TEMPLATES_FILE = None
    BATCHES_FILE = None
    ITEMS_FILE = None
    DISPATCH_QUEUE_FILE = None
    brand_store.set_store_dir(directory)
    try:
        from clippyme.domain import publish_dispatch_service
        publish_dispatch_service.DISPATCH_QUEUE_PATH = os.path.join(directory, "dispatch_queue.json")
    except (ImportError, AttributeError):
        pass


def reset_store() -> None:
    global DATA_DIR, BRANDS_FILE, TEMPLATES_FILE, BATCHES_FILE, ITEMS_FILE, DISPATCH_QUEUE_FILE
    DATA_DIR = os.environ.get("CLIPPYME_VIRAL_STUDIO_DIR") or os.path.join("data", "viral_studio")
    BRANDS_FILE = None
    TEMPLATES_FILE = None
    BATCHES_FILE = None
    ITEMS_FILE = None
    DISPATCH_QUEUE_FILE = None
    brand_store.reset_store()


def get_brands_path() -> str:
    return BRANDS_FILE or os.path.join(DATA_DIR, BRANDS_FILENAME)


def get_templates_path() -> str:
    return TEMPLATES_FILE or os.path.join(DATA_DIR, TEMPLATES_FILENAME)


def get_batches_path() -> str:
    return BATCHES_FILE or os.path.join(DATA_DIR, BATCHES_FILENAME)


def get_dispatch_queue_path() -> str:
    if DISPATCH_QUEUE_FILE:
        return DISPATCH_QUEUE_FILE
    try:
        from clippyme.domain import publish_dispatch_service
        if getattr(publish_dispatch_service, "DISPATCH_QUEUE_PATH", None):
            return publish_dispatch_service.DISPATCH_QUEUE_PATH
    except (ImportError, AttributeError):
        pass
    return os.path.join(DATA_DIR, "dispatch_queue.json")


def _atomic_write_json(file_path: str, data: Dict[str, Any]) -> None:
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


def _read_json_file(file_path: str) -> Dict[str, Any]:
    """Read a JSON dictionary file; return empty dict if missing or corrupt."""
    if not os.path.exists(file_path):
        return {}
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except (OSError, json.JSONDecodeError, TypeError) as exc:
        logger.warning("Error reading %s: %s", file_path, exc)
        return {}


# ---------------------------------------------------------------------------
# Brand Storage Operations (Delegated and Re-exported from sovereign brand_store)
# ---------------------------------------------------------------------------
from clippyme.domain.brand_store import (
    DEFAULT_BRAND_DICT,
    DEFAULT_BRAND_ID,
    DEFAULT_BRAND_SCHEDULE,
    create_brand,
    delete_brand,
    get_brand,
    get_brand_or_raise,
    get_brands_path,
    list_brands,
    save_brand,
    update_brand,
    update_brand_schedule,
)
from clippyme.domain import brand_store

# Backward-compatibility alias for test monkeypatching
def _load_brands_locked() -> dict[str, dict[str, Any]]:
    return brand_store._load_brands_locked()


def get_items_by_brand(
    brand_id: str,
    status: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Query all video items across batches belonging to a specific brand."""
    if not brand_id:
        raise ValidationError("brand_id is required")

    target_status = status.upper() if status and status.lower() != "all" else None
    matching_items: List[Dict[str, Any]] = []

    with _STORE_LOCK:
        batches = _load_batches_locked()
        for batch_id, batch in batches.items():
            batch_brand = batch.get("brand_id")
            for item in batch.get("items", []):
                item_brand = item.get("brand_id") or batch_brand
                if item_brand == brand_id:
                    item_status = str(item.get("status") or "").upper()
                    if target_status is None or item_status == target_status:
                        item_copy = dict(item)
                        item_copy.setdefault("batch_id", batch_id)
                        matching_items.append(item_copy)

    # Sort most recent first
    matching_items.sort(
        key=lambda x: str(x.get("updated_at") or x.get("created_at") or ""),
        reverse=True,
    )
    return matching_items


def find_item_batch(item_id: str) -> tuple[Dict[str, Any], str, Dict[str, Any]]:
    """Locate item, parent batch ID, and batch dict in batches.json or raise NotFoundError."""
    with _STORE_LOCK:
        batches = _load_batches_locked()
        for batch_id, batch in batches.items():
            b_id = batch.get("batch_id") or batch.get("id") or batch_id
            for item in batch.get("items", []):
                if item.get("id") == item_id or item.get("item_id") == item_id:
                    return dict(item), str(b_id), dict(batch)
    raise NotFoundError(f"Video item not found: {item_id}")


def find_item_by_post_id(post_id: str) -> Optional[tuple[Dict[str, Any], str, Dict[str, Any]]]:
    """Locate item, parent batch ID, and batch dict linked to a post_id in publication records."""
    if not post_id:
        return None
    with _STORE_LOCK:
        batches = _load_batches_locked()
        for batch_id, batch in batches.items():
            b_id = batch.get("batch_id") or batch.get("id") or batch_id
            for item in batch.get("items", []):
                for rec in item.get("publication_records", []):
                    if rec.get("post_id") == post_id or rec.get("id") == post_id:
                        return dict(item), str(b_id), dict(batch)
    return None


def update_item_status_by_post_id(
    post_id: str,
    new_status: str,
) -> Optional[Dict[str, Any]]:
    """Locate item linked to a post_id, update its status and record cancellation audit."""
    if not post_id:
        return None

    with _STORE_LOCK:
        batches = _load_batches_locked()
        modified = False
        target_item = None
        now = _utcnow_iso()

        for batch_id, batch in batches.items():
            for item in batch.get("items", []):
                for rec in item.get("publication_records", []):
                    if rec.get("post_id") == post_id or rec.get("id") == post_id:
                        item["status"] = new_status
                        item["updated_at"] = now
                        if new_status.upper() == "APPROVED":
                            item["scheduled_for"] = None
                            rec["status"] = "cancelled"
                            rec["action"] = "cancelled"
                            rec["cancelled_at"] = now
                            rec["reason"] = "user_cancelled"
                            rec["updated_at"] = now
                        modified = True
                        target_item = dict(item)
                        target_item["batch_id"] = batch_id
                        break
                if modified:
                    break
            if modified:
                break

        if modified:
            _atomic_write_json(get_batches_path(), batches)
        return target_item


def append_publication_record(
    batch_id: Optional[str],
    item_id: str,
    record: Dict[str, Any],
) -> Dict[str, Any]:
    """Atomically append a publication record to an item in batches.json."""
    with _STORE_LOCK:
        batches = _load_batches_locked()
        found = False
        for b_id, batch in batches.items():
            if batch_id and b_id != batch_id and batch.get("id") != batch_id:
                continue
            for idx, item in enumerate(batch.get("items", [])):
                if item.get("id") == item_id or item.get("item_id") == item_id:
                    records = list(item.get("publication_records") or [])
                    rec_id = record.get("id")
                    existing_idx = next((i for i, r in enumerate(records) if rec_id and r.get("id") == rec_id), None)
                    if existing_idx is not None:
                        records[existing_idx] = record
                    else:
                        records.append(record)
                    item["publication_records"] = records
                    item["updated_at"] = _utcnow_iso()
                    batch["items"][idx] = item
                    batch["updated_at"] = _utcnow_iso()
                    found = True
                    break
            if found:
                break
        if not found:
            raise NotFoundError(f"Item not found: {item_id}")
        _atomic_write_json(get_batches_path(), batches)
        return record


def update_item_status(
    batch_id: Optional[str],
    item_id: str,
    status: str,
) -> Dict[str, Any]:
    """Update status of an item."""
    return update_item(item_id, {"status": status})


# ---------------------------------------------------------------------------
# Template Storage Operations
# ---------------------------------------------------------------------------

def _get_factory_template_dicts() -> Dict[str, Dict[str, Any]]:
    from clippyme.api.viral_studio_schemas import FACTORY_TEMPLATES
    return {t.id: t.model_dump() for t in FACTORY_TEMPLATES}


def _load_templates_locked() -> Dict[str, Dict[str, Any]]:
    path = get_templates_path()
    templates = _read_json_file(path)
    factory_dict = _get_factory_template_dicts()
    if not templates:
        templates = {k: dict(v) for k, v in factory_dict.items()}
        _atomic_write_json(path, templates)
    else:
        modified = False
        for fid, fval in factory_dict.items():
            if fid not in templates:
                templates[fid] = dict(fval)
                modified = True
            elif templates[fid].get("is_system") is None:
                templates[fid]["is_system"] = fval.get("is_system", True)
                modified = True
        if modified:
            _atomic_write_json(path, templates)
    return templates


def ensure_default_templates() -> None:
    """Ensure all default factory templates are populated in the store."""
    with _STORE_LOCK:
        _load_templates_locked()


def list_templates() -> List[Dict[str, Any]]:
    with _STORE_LOCK:
        templates = _load_templates_locked()
        return sorted(templates.values(), key=lambda t: (t.get("name") or t.get("id", "")).lower())


def get_template(template_id: str) -> Optional[Dict[str, Any]]:
    if not template_id:
        return None
    with _STORE_LOCK:
        templates = _load_templates_locked()
        template = templates.get(template_id)
        return dict(template) if template else None


def get_template_or_raise(template_id: str) -> Dict[str, Any]:
    template = get_template(template_id)
    if template is None:
        raise NotFoundError(f"Template not found: {template_id}")
    return template


def create_template(template: Union[Dict[str, Any], Any]) -> Dict[str, Any]:
    data = _to_dict(template)
    tid = data.get("id") or data.get("template_id")
    if not tid or (isinstance(tid, str) and not tid.strip()):
        name = data.get("name")
        if not name or (isinstance(name, str) and not name.strip()):
            raise ValidationError("Template id or name is required")
        tid = _slugify(name)
        data["id"] = tid
    else:
        data["id"] = tid

    with _STORE_LOCK:
        templates = _load_templates_locked()
        if tid in templates:
            raise ConflictError(f"Template already exists: {tid}")

        now = _utcnow_iso()
        data.setdefault("created_at", now)
        data["updated_at"] = now
        data.setdefault("is_system", False)

        templates[tid] = data
        _atomic_write_json(get_templates_path(), templates)
        return dict(data)


def update_template(template_id: str, updates: Union[Dict[str, Any], Any]) -> Dict[str, Any]:
    if not template_id:
        raise ValidationError("Template id is required")
    patch = _to_dict(updates)

    with _STORE_LOCK:
        templates = _load_templates_locked()
        if template_id not in templates:
            raise NotFoundError(f"Template not found: {template_id}")

        existing = templates[template_id]
        for k, v in patch.items():
            if k in ("id", "template_id", "created_at"):
                continue
            if v is not None:
                existing[k] = v

        existing["updated_at"] = _utcnow_iso()
        templates[template_id] = existing
        _atomic_write_json(get_templates_path(), templates)
        return dict(existing)


def save_template(template: Union[Dict[str, Any], Any]) -> Dict[str, Any]:
    data = _to_dict(template)
    tid = data.get("id") or data.get("template_id")
    if not tid or (isinstance(tid, str) and not tid.strip()):
        name = data.get("name")
        if not name or (isinstance(name, str) and not name.strip()):
            raise ValidationError("Template id or name is required")
        tid = _slugify(name)
        data["id"] = tid
    else:
        data["id"] = tid

    with _STORE_LOCK:
        templates = _load_templates_locked()
        now = _utcnow_iso()
        if tid in templates:
            data.setdefault("created_at", templates[tid].get("created_at", now))
        else:
            data.setdefault("created_at", now)
        data["updated_at"] = now

        templates[tid] = data
        _atomic_write_json(get_templates_path(), templates)
        return dict(data)


def duplicate_template(template_id: str, new_name: Optional[str] = None) -> Dict[str, Any]:
    if not template_id:
        raise ValidationError("Template id is required")
    with _STORE_LOCK:
        templates = _load_templates_locked()
        if template_id not in templates:
            raise NotFoundError(f"Template not found: {template_id}")
        source = templates[template_id]
        new_id = f"{_slugify(source.get('name') or template_id)}-copy-{uuid.uuid4().hex[:6]}"
        cloned = dict(source)
        cloned["id"] = new_id
        cloned["template_id"] = new_id
        cloned["name"] = new_name or f"{source.get('name', 'Template')} (Cópia)"
        cloned["is_system"] = False
        now = _utcnow_iso()
        cloned["created_at"] = now
        cloned["updated_at"] = now
        templates[new_id] = cloned
        _atomic_write_json(get_templates_path(), templates)
        return dict(cloned)


def reset_default_templates() -> List[Dict[str, Any]]:
    with _STORE_LOCK:
        path = get_templates_path()
        templates = _read_json_file(path)
        factory_dict = _get_factory_template_dicts()
        now = _utcnow_iso()
        for fid, fval in factory_dict.items():
            restored = dict(fval)
            restored["updated_at"] = now
            templates[fid] = restored
        _atomic_write_json(path, templates)
        return sorted(templates.values(), key=lambda t: (t.get("name") or t.get("id", "")).lower())


def delete_template(template_id: str) -> bool:
    if not template_id:
        raise ValidationError("Template id is required")
    with _STORE_LOCK:
        templates = _load_templates_locked()
        if template_id not in templates:
            raise NotFoundError(f"Template not found: {template_id}")
        template = templates[template_id]
        if template.get("is_system", False):
            raise ValidationError("Templates de fábrica não podem ser excluídos.")
        del templates[template_id]
        _atomic_write_json(get_templates_path(), templates)
        return True


# ---------------------------------------------------------------------------
# Batch and Item Storage Operations
# ---------------------------------------------------------------------------

def _derive_batch_status(items: List[Dict[str, Any]]) -> str:
    """Derive batch-level lifecycle status from constituent item statuses."""
    if not items:
        return "PENDING"
    statuses = [item.get("status") for item in items if isinstance(item, dict) and item.get("status")]
    if not statuses:
        return "PENDING"
    # Se qualquer item ainda estiver rodando: lote está ativo
    if any(s in ("PENDING", "DOWNLOADING", "ANALYZING", "RENDERING") for s in statuses):
        return "PENDING"
    # Se algum item ficou pronto para revisão / aprovado / publicado
    if any(s in ("READY_FOR_REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED") for s in statuses):
        return "READY_FOR_REVIEW"
    # Se todos os itens foram cancelados
    if all(s == "CANCELLED" for s in statuses):
        return "CANCELLED"
    # Se todos falharam ou mistura de falha + cancelado sem nenhum concluído
    return "FAILED"


def _load_batches_locked() -> Dict[str, Dict[str, Any]]:
    path = get_batches_path()
    batches = _read_json_file(path)
    healed = False
    for batch in batches.values():
        for item in batch.get("items", []):
            if item.get("status") == "FAILED" and item.get("rendered_path"):
                if os.path.isfile(item.get("rendered_path")):
                    item["status"] = "APPROVED"
                    healed = True
    if healed:
        _atomic_write_json(path, batches)
    return batches


def list_batches() -> List[Dict[str, Any]]:
    with _STORE_LOCK:
        batches = _load_batches_locked()
        res = []
        for b in batches.values():
            batch_dict = dict(b)
            items = batch_dict.get("items", [])
            batch_dict["status"] = _derive_batch_status(items)
            res.append(batch_dict)
        return sorted(res, key=lambda b: b.get("created_at", ""), reverse=True)


def get_batch(batch_id: str) -> Optional[Dict[str, Any]]:
    if not batch_id:
        return None
    with _STORE_LOCK:
        batches = _load_batches_locked()
        batch = batches.get(batch_id)
        if not batch:
            return None
        res = dict(batch)
        res["status"] = _derive_batch_status(res.get("items", []))
        return res


def get_batch_or_raise(batch_id: str) -> Dict[str, Any]:
    batch = get_batch(batch_id)
    if batch is None:
        raise NotFoundError(f"Batch not found: {batch_id}")
    return batch


def create_batch(batch: Union[Dict[str, Any], Any]) -> Dict[str, Any]:
    data = _to_dict(batch)
    raw_brand_id = data.get("brand_id")
    raw_brand_ids = data.get("brand_ids")
    brand_ids: List[str] = []
    if raw_brand_ids and isinstance(raw_brand_ids, list):
        brand_ids = [str(b).strip() for b in raw_brand_ids if b and str(b).strip()]
    if not brand_ids and raw_brand_id and str(raw_brand_id).strip():
        brand_ids = [str(raw_brand_id).strip()]

    if not brand_ids:
        raise ValidationError("brand_id or brand_ids is required")

    strategy = str(data.get("distribution_strategy") or "round_robin").lower()
    if strategy not in ("round_robin", "sequential"):
        strategy = "round_robin"

    raw_items = data.get("items")
    if not raw_items or not isinstance(raw_items, list) or len(raw_items) == 0:
        raise ValidationError("Batch must contain at least one item")

    with _STORE_LOCK:
        brands = _load_brands_locked()
        for bid in brand_ids:
            if bid not in brands:
                raise NotFoundError(f"Brand not found: {bid}")

        batch_id = data.get("batch_id") or data.get("id")
        if not batch_id or not str(batch_id).strip():
            batch_id = str(uuid.uuid4())
        else:
            clean_batch_id = str(batch_id).strip()
            if not SAFE_ID_RE.match(clean_batch_id):
                raise ValidationError(f"Invalid batch_id: {clean_batch_id!r}")
            batch_id = clean_batch_id

        data["batch_id"] = batch_id
        data["id"] = batch_id
        data["brand_ids"] = brand_ids
        data["distribution_strategy"] = strategy
        primary_brand_id = raw_brand_id if raw_brand_id and raw_brand_id in brands else brand_ids[0]
        data["brand_id"] = primary_brand_id

        batches = _load_batches_locked()
        if batch_id in batches:
            raise ConflictError(f"Batch already exists: {batch_id}")

        brand = brands[primary_brand_id]
        template_id = data.get("template_id") or brand.get("template_id") or DEFAULT_TEMPLATE_ID
        templates = _load_templates_locked()
        if template_id not in templates:
            raise NotFoundError(f"Template not found: {template_id}")
        data["template_id"] = template_id

        batch_model = data.get("model")
        if batch_model and str(batch_model).strip():
            data["model"] = str(batch_model).strip()
        else:
            data["model"] = None

        now = _utcnow_iso()
        data.setdefault("created_at", now)
        data["updated_at"] = now
        data["status"] = data.get("status") or "PENDING"

        total_items_count = len(raw_items)
        num_brands = len(brand_ids)
        block_size = max(1, (total_items_count + num_brands - 1) // num_brands)

        seen_item_ids = set()
        processed_items = []
        for idx, raw_item in enumerate(raw_items):
            if not isinstance(raw_item, dict) and not hasattr(raw_item, "__dict__"):
                raise ValidationError("Each item in items must be an object/dictionary")
            item = _to_dict(raw_item)
            if not item.get("source_url") or not str(item.get("source_url")).strip():
                raise ValidationError("Each item must have a non-empty source_url")
            item_id = item.get("id") or item.get("item_id")
            if not item_id or not str(item_id).strip() or str(item_id).strip() in seen_item_ids:
                item_id = str(uuid.uuid4())
            else:
                clean_item_id = str(item_id).strip()
                if not SAFE_ID_RE.match(clean_item_id):
                    raise ValidationError(f"Invalid item_id: {clean_item_id!r}")
                item_id = clean_item_id
            seen_item_ids.add(item_id)

            # Algorithmic Brand Assignment
            if item.get("brand_id"):
                explicit_bid = str(item.get("brand_id")).strip()
                if explicit_bid not in brands:
                    raise NotFoundError(f"Brand not found for item: {explicit_bid}")
                item_brand_id = explicit_bid
            elif strategy == "round_robin":
                item_brand_id = brand_ids[idx % num_brands]
            else:
                brand_idx = min(idx // block_size, num_brands - 1)
                item_brand_id = brand_ids[brand_idx]

            item["id"] = item_id
            item["item_id"] = item_id
            item["batch_id"] = batch_id
            item["brand_id"] = item_brand_id
            item["template_id"] = item.get("template_id") or template_id
            item_model = item.get("model") or data.get("model")
            item["model"] = str(item_model).strip() if item_model and str(item_model).strip() else None
            item.setdefault("provenance", item.get("provenance"))
            item.setdefault("status", "PENDING")
            item.setdefault("source_path", None)
            item.setdefault("rendered_path", None)
            item.setdefault("error_message", None)
            item.setdefault("source_metadata", None)
            item.setdefault("ai_context_summary", None)
            item.setdefault("ai_telemetry", None)
            item.setdefault("keyframe_urls", [])
            item.setdefault("logs", [])
            item.setdefault("created_at", now)
            item.setdefault("updated_at", now)
            processed_items.append(item)

        data["items"] = processed_items
        data["total_items"] = len(processed_items)

        batches[batch_id] = data
        _atomic_write_json(get_batches_path(), batches)
        return dict(data)


def update_batch(batch_id: str, updates: Union[Dict[str, Any], Any]) -> Dict[str, Any]:
    if not batch_id:
        raise ValidationError("batch_id is required")
    patch = _to_dict(updates)

    with _STORE_LOCK:
        batches = _load_batches_locked()
        if batch_id not in batches:
            raise NotFoundError(f"Batch not found: {batch_id}")

        existing = batches[batch_id]
        for k, v in patch.items():
            if k in ("batch_id", "id", "created_at"):
                continue
            if v is not None:
                existing[k] = v

        existing["updated_at"] = _utcnow_iso()
        batches[batch_id] = existing
        _atomic_write_json(get_batches_path(), batches)
        return dict(existing)


def save_batch(batch: Union[Dict[str, Any], Any]) -> Dict[str, Any]:
    data = _to_dict(batch)
    batch_id = data.get("batch_id") or data.get("id")
    if not batch_id:
        raise ValidationError("batch_id is required")
    data["batch_id"] = batch_id
    if "id" not in data:
        data["id"] = batch_id

    with _STORE_LOCK:
        batches = _load_batches_locked()
        now = _utcnow_iso()
        if batch_id in batches:
            data.setdefault("created_at", batches[batch_id].get("created_at", now))
        else:
            data.setdefault("created_at", now)
        data["updated_at"] = now
        data.setdefault("items", [])

        batches[batch_id] = data
        _atomic_write_json(get_batches_path(), batches)
        return dict(data)


def get_item(item_id: str) -> Optional[Dict[str, Any]]:
    if not item_id:
        return None
    with _STORE_LOCK:
        batches = _load_batches_locked()
        for batch in batches.values():
            for item in batch.get("items", []):
                if item.get("id") == item_id or item.get("item_id") == item_id:
                    res = dict(item)
                    res["batch_id"] = batch.get("batch_id") or batch.get("id")
                    if not res.get("brand_id") and batch.get("brand_id"):
                        res["brand_id"] = batch.get("brand_id")
                    return res
        return None


def get_item_or_raise(item_id: str) -> Dict[str, Any]:
    item = get_item(item_id)
    if item is None:
        raise NotFoundError(f"Item not found: {item_id}")
    return item


def update_item(item_id: str, updates: Union[Dict[str, Any], Any]) -> Dict[str, Any]:
    if not item_id:
        raise ValidationError("item_id is required")
    patch = _to_dict(updates)

    with _STORE_LOCK:
        batches = _load_batches_locked()
        found_item = None

        for batch in batches.values():
            for idx, item in enumerate(batch.get("items", [])):
                if item.get("id") == item_id or item.get("item_id") == item_id:
                    for k, v in patch.items():
                        if k in ("id", "item_id", "batch_id", "created_at"):
                            continue
                        if v is not None or k in (
                            "error_message",
                            "source_path",
                            "rendered_path",
                            "manual_headline",
                            "additional_instructions",
                            "selected_headline",
                            "caption",
                            "product_url",
                            "product_code",
                            "ai_copy",
                            "job_id",
                            "source_metadata",
                            "ai_context_summary",
                            "ai_telemetry",
                            "keyframe_urls",
                            "logs",
                            "publication_records",
                            "model",
                            "provenance",
                        ):
                            item[k] = v
                    item["updated_at"] = _utcnow_iso()
                    batch["items"][idx] = item
                    batch["status"] = _derive_batch_status(batch.get("items", []))
                    batch["updated_at"] = _utcnow_iso()
                    found_item = dict(item)
                    found_item["batch_id"] = batch.get("batch_id") or batch.get("id")
                    break
            if found_item:
                break

        if not found_item:
            raise NotFoundError(f"Item not found: {item_id}")

        _atomic_write_json(get_batches_path(), batches)
        return found_item


def reserve_publication(item_id: str, key: str, requested_at: str) -> Dict[str, Any]:
    """Atomically return or reserve an idempotent publication record."""
    with _STORE_LOCK:
        batches = _load_batches_locked()
        for batch in batches.values():
            for index, item in enumerate(batch.get("items", [])):
                if item.get("id") != item_id and item.get("item_id") != item_id:
                    continue
                records = list(item.get("publication_records") or [])
                existing = next((record for record in records if record.get("key") == key), None)
                if existing:
                    return {"reserved": False, "record": dict(existing)}
                record = {"key": key, "status": "dispatching", "requested_at": requested_at}
                records.append(record)
                item["publication_records"] = records
                item["updated_at"] = _utcnow_iso()
                batch["items"][index] = item
                _atomic_write_json(get_batches_path(), batches)
                return {"reserved": True, "record": dict(record)}
        raise NotFoundError(f"Item not found: {item_id}")


def finish_publication(item_id: str, key: str, record: Dict[str, Any], *, status: Optional[str] = None) -> Dict[str, Any]:
    """Atomically replace a reserved publication record and optional item state."""
    with _STORE_LOCK:
        batches = _load_batches_locked()
        for batch in batches.values():
            for index, item in enumerate(batch.get("items", [])):
                if item.get("id") != item_id and item.get("item_id") != item_id:
                    continue
                records = list(item.get("publication_records") or [])
                for record_index, existing in enumerate(records):
                    if existing.get("key") == key:
                        records[record_index] = dict(record)
                        break
                else:
                    raise ValidationError("Publication reservation not found")
                item["publication_records"] = records
                if status:
                    item["status"] = status
                item["updated_at"] = _utcnow_iso()
                batch["items"][index] = item
                _atomic_write_json(get_batches_path(), batches)
                return dict(item)
        raise NotFoundError(f"Item not found: {item_id}")


def save_item(item: Union[Dict[str, Any], Any]) -> Dict[str, Any]:
    data = _to_dict(item)
    item_id = data.get("id") or data.get("item_id")
    if not item_id:
        raise ValidationError("item_id is required")
    return update_item(item_id, data)


def append_item_log(item_id: str, log_entry: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Atomically append a log entry to an item's log list under the store lock."""
    if not item_id:
        raise ValidationError("item_id is required")
    with _STORE_LOCK:
        batches = _load_batches_locked()
        for batch in batches.values():
            for idx, item in enumerate(batch.get("items", [])):
                if item.get("id") == item_id or item.get("item_id") == item_id:
                    logs = list(item.get("logs") or [])
                    logs.append(dict(log_entry))
                    item["logs"] = logs
                    item["updated_at"] = _utcnow_iso()
                    batch["items"][idx] = item
                    batch["updated_at"] = _utcnow_iso()
                    _atomic_write_json(get_batches_path(), batches)
                    return logs
        raise NotFoundError(f"Item not found: {item_id}")


def get_next_available_slots(
    account_id: Optional[str] = None,
    count: int = 1,
    preferred_time: Union[str, List[str]] = "18:00",
    start_date: Optional[str] = None,
    timezone_str: str = "America/Sao_Paulo",
    slots: Optional[List[str]] = None,
    brand_id: Optional[str] = None,
) -> List[datetime]:
    """Calculate the next available publishing slots without collisions (Auto-Chaining).

    Supports:
    - Multi-slot daily traversal (e.g. 10:00, 15:00, 20:00) before advancing to next day.
    - Anti-collision based on already scheduled items in store (scoped by account_id and/or brand_id).
    - Timezone-aware date/time math.
    - Chronological resolution: past slots today are discarded; gaps in schedule are filled first.
    """
    if count <= 0:
        return []

    try:
        tz = ZoneInfo(timezone_str.strip() if timezone_str else "America/Sao_Paulo")
    except (ZoneInfoNotFoundError, ValueError):
        tz = ZoneInfo("America/Sao_Paulo")

    # Resolve daily time slots
    raw_slots: List[str] = []
    if slots and isinstance(slots, list):
        raw_slots = [str(s).strip() for s in slots if str(s).strip()]
    elif isinstance(preferred_time, list):
        raw_slots = [str(s).strip() for s in preferred_time if str(s).strip()]
    elif isinstance(preferred_time, str) and "," in preferred_time:
        raw_slots = [s.strip() for s in preferred_time.split(",") if s.strip()]
    elif preferred_time:
        raw_slots = [str(preferred_time).strip()]

    daily_times: List[time] = []
    for s_str in raw_slots:
        try:
            parts = s_str.split(":")
            h = int(parts[0])
            m = int(parts[1]) if len(parts) > 1 else 0
            s = int(parts[2]) if len(parts) > 2 else 0
            daily_times.append(time(hour=h, minute=m, second=s))
        except (ValueError, IndexError):
            continue

    if not daily_times:
        daily_times = [time(hour=18, minute=0)]

    # Sort slots chronologically within a day, removing duplicates
    daily_times = sorted(list(dict.fromkeys(daily_times)))

    now = datetime.now(tz).replace(microsecond=0)

    # Collect occupied timestamps matching brand_id and/or account_id
    occupied_datetimes: set[datetime] = set()
    with _STORE_LOCK:
        batches = _load_batches_locked()
        for batch in batches.values():
            batch_brand = batch.get("brand_id")
            for item in batch.get("items", []):
                item_status = str(item.get("status") or "").upper()
                if item_status != "SCHEDULED":
                    continue

                item_brand = item.get("brand_id") or batch_brand
                if brand_id and item_brand != brand_id:
                    continue

                item_acc = item.get("account_id")
                records = item.get("publication_records") or []
                if account_id:
                    matches_acc = (item_acc == account_id)
                    if not matches_acc and records:
                        for rec in records:
                            if rec.get("channel_id") == account_id or rec.get("account_id") == account_id:
                                matches_acc = True
                                break
                    if not matches_acc and not item_acc and not records:
                        matches_acc = True
                    if not matches_acc and brand_id and item_brand == brand_id:
                        matches_acc = True
                    if not matches_acc:
                        continue

                scheduled_isos: List[str] = []
                if item.get("scheduled_for"):
                    scheduled_isos.append(str(item.get("scheduled_for")))
                for rec in records:
                    rec_status = str(rec.get("status") or "").lower()
                    if rec_status in ("cancelled", "canceled", "failed"):
                        continue
                    if rec.get("scheduled_for"):
                        scheduled_isos.append(str(rec.get("scheduled_for")))
                    res = rec.get("result")
                    if isinstance(res, dict) and res.get("scheduled_for"):
                        scheduled_isos.append(str(res.get("scheduled_for")))

                for s_iso in scheduled_isos:
                    try:
                        dt = datetime.fromisoformat(str(s_iso).replace("Z", "+00:00"))
                        if dt.tzinfo is None:
                            dt = dt.replace(tzinfo=tz)
                        else:
                            dt = dt.astimezone(tz)
                        occupied_datetimes.add(dt.replace(second=0, microsecond=0))
                    except (ValueError, TypeError):
                        continue

        # Also reserve slots from active/queued dispatch queue jobs
        dispatch_path = get_dispatch_queue_path()
        if os.path.isfile(dispatch_path):
            try:
                with open(dispatch_path, "r", encoding="utf-8") as f:
                    queue_data = json.load(f)
                for job in queue_data.values():
                    if not isinstance(job, dict):
                        continue
                    j_status = str(job.get("status") or "").upper()
                    if j_status in ("CANCELLED", "CANCELED", "FAILED"):
                        continue
                    j_brand = job.get("brand_id")
                    if brand_id and j_brand and j_brand != brand_id:
                        continue
                    j_channels = job.get("channel_ids") or []
                    if account_id and j_channels and account_id not in j_channels:
                        continue
                    j_sched = job.get("scheduled_for")
                    if j_sched:
                        try:
                            dt = datetime.fromisoformat(str(j_sched).replace("Z", "+00:00"))
                            if dt.tzinfo is None:
                                dt = dt.replace(tzinfo=tz)
                            else:
                                dt = dt.astimezone(tz)
                            occupied_datetimes.add(dt.replace(second=0, microsecond=0))
                        except (ValueError, TypeError):
                            pass
            except Exception as exc:
                logger.warning("Could not inspect dispatch_queue in get_next_available_slots: %s", exc)

    # Determine base date
    if start_date:
        try:
            start_date_obj = (
                datetime.fromisoformat(start_date.replace("Z", "+00:00")).date()
                if "T" in start_date
                else datetime.strptime(start_date.strip(), "%Y-%m-%d").date()
            )
            curr_date = max(start_date_obj, now.date())
        except ValueError:
            curr_date = now.date()
    else:
        curr_date = now.date()

    result_slots: List[datetime] = []
    iterations = 0
    while len(result_slots) < count and iterations < 365:
        iterations += 1
        for t in daily_times:
            candidate_dt = datetime.combine(curr_date, t, tzinfo=tz)
            if candidate_dt <= now:
                continue
            candidate_normalized = candidate_dt.replace(second=0, microsecond=0)
            if candidate_normalized in occupied_datetimes:
                continue
            result_slots.append(candidate_dt)
            if len(result_slots) == count:
                break
        curr_date += timedelta(days=1)

    return result_slots


def cancel_item_schedule(item_id: str) -> Dict[str, Any]:
    """Atomically cancel a scheduled item, reverting its status to APPROVED under _STORE_LOCK."""
    if not item_id:
        raise ValidationError("item_id is required")

    with _STORE_LOCK:
        batches = _load_batches_locked()
        for batch in batches.values():
            for idx, item in enumerate(batch.get("items", [])):
                if item.get("id") == item_id or item.get("item_id") == item_id:
                    if item.get("status") != "SCHEDULED":
                        raise ValidationError(
                            f"Item {item_id} is not in SCHEDULED status (current: {item.get('status')})"
                        )
                    item["status"] = "APPROVED"
                    item["scheduled_for"] = None

                    records = list(item.get("publication_records") or [])
                    for rec in records:
                        if rec.get("status") == "scheduled":
                            rec["status"] = "cancelled"
                            rec["cancelled_at"] = _utcnow_iso()
                    item["publication_records"] = records

                    logs = list(item.get("logs") or [])
                    logs.append(
                        {
                            "type": "AUDIT",
                            "step": "SCHEDULE_CANCELLED",
                            "message": "Agendamento cancelado pelo usuário",
                            "timestamp": _utcnow_iso(),
                            "level": "info",
                        }
                    )
                    item["logs"] = logs
                    item["updated_at"] = _utcnow_iso()

                    batch["items"][idx] = item
                    batch["updated_at"] = _utcnow_iso()
                    _atomic_write_json(get_batches_path(), batches)
                    return dict(item)

        raise NotFoundError(f"Item not found: {item_id}")


def cancel_item_store(item_id: str, reason: str = "Cancelado pelo usuário") -> Dict[str, Any]:
    """Atomically cancel a viral item in batches.json, clear job_id, append audit log, and update batch status."""
    if not item_id:
        raise ValidationError("item_id is required")
    with _STORE_LOCK:
        batches = _load_batches_locked()
        found_item = None
        for batch in batches.values():
            for idx, item in enumerate(batch.get("items", [])):
                if item.get("id") == item_id or item.get("item_id") == item_id:
                    current_status = item.get("status")
                    if current_status == "CANCELLED":
                        # Idempotent return
                        res = dict(item)
                        res["batch_id"] = batch.get("batch_id") or batch.get("id")
                        if not res.get("brand_id") and batch.get("brand_id"):
                            res["brand_id"] = batch.get("brand_id")
                        return res
                    if current_status in ("READY_FOR_REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED"):
                        raise ValidationError(
                            f"Cannot cancel item {item_id} in completed status '{current_status}'"
                        )
                    if current_status not in ("PENDING", "DOWNLOADING", "ANALYZING", "RENDERING"):
                        raise ValidationError(
                            f"Cannot cancel item {item_id} in status '{current_status}'. Only active items can be cancelled."
                        )
                    item["status"] = "CANCELLED"
                    item["job_id"] = None
                    item["rendered_path"] = None
                    item["source_path"] = None
                    item["error_message"] = reason

                    logs = list(item.get("logs") or [])
                    logs.append(
                        {
                            "stage": "CANCELLED",
                            "level": "warning",
                            "message": reason,
                            "timestamp": _utcnow_iso(),
                        }
                    )
                    item["logs"] = logs
                    item["updated_at"] = _utcnow_iso()

                    batch["items"][idx] = item
                    batch["status"] = _derive_batch_status(batch.get("items", []))
                    batch["updated_at"] = _utcnow_iso()

                    found_item = dict(item)
                    found_item["batch_id"] = batch.get("batch_id") or batch.get("id")
                    if not found_item.get("brand_id") and batch.get("brand_id"):
                        found_item["brand_id"] = batch.get("brand_id")
                    break
            if found_item:
                break

        if not found_item:
            raise NotFoundError(f"Item not found: {item_id}")

        _atomic_write_json(get_batches_path(), batches)
        return found_item


def seed_defaults(force: bool = False) -> None:
    """Explicitly seed default brand and template if missing or forced."""
    with _STORE_LOCK:
        brands_path = get_brands_path()
        templates_path = get_templates_path()

        if force or not os.path.exists(brands_path) or not _read_json_file(brands_path):
            _atomic_write_json(brands_path, {DEFAULT_BRAND_ID: dict(DEFAULT_BRAND_DICT)})

        if force or not os.path.exists(templates_path) or not _read_json_file(templates_path):
            _atomic_write_json(templates_path, {DEFAULT_TEMPLATE_ID: dict(DEFAULT_TEMPLATE_DICT)})


def reset_store() -> None:
    """Clear all stored files (primarily for test teardown)."""
    with _STORE_LOCK:
        for path in (get_brands_path(), get_templates_path(), get_batches_path()):
            if path and os.path.exists(path):
                with contextlib.suppress(OSError):
                    os.remove(path)
