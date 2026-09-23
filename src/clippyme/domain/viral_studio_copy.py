"""Commercial AI Copy Generation for Viral Content Studio (Milestone 3).

Generates high-converting affiliate marketing copy, headlines, and structured captions
in Brazilian Portuguese (PT-BR) using the Gemini API.

Key components:
- ``build_affiliate_copy_prompt``: Pure function constructing PT-BR commercial prompt.
- ``parse_affiliate_copy_response``: Pure function with multi-level JSON repair fallback chain.
- ``generate_affiliate_copy``: Async client with model fallback and item-level caching.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import time
from typing import Any, Dict, List, Optional, Union

from clippyme.api.viral_studio_schemas import AICopyData, Brand, ViralItem, VisualTemplate
from clippyme.domain.errors import ClippyMeError, ValidationError
from clippyme.pipeline.gemini_service import _redact_key
from clippyme.storage.config_store import load_persistent_config

logger = logging.getLogger("clippyme.viral_studio_copy")

# Per-model pricing ($ per 1M tokens)
MODEL_PRICING = {
    "gemini-3.6-flash": {"input": 1.50, "output": 9.00},
    "gemini-3.5-flash": {"input": 1.50, "output": 9.00},
    "gemini-3.5-flash-lite": {"input": 0.075, "output": 0.30},
    "gemini-3.1-pro-preview": {"input": 2.00, "output": 12.00},
    "gemini-3.1-flash-lite": {"input": 0.10, "output": 0.40},
    "gemini-2.5-flash": {"input": 0.15, "output": 0.60},
    "gemini-2.5-pro": {"input": 1.25, "output": 5.00},
    "gemini-2.0-flash": {"input": 0.10, "output": 0.40},
    "gemini-2.0-flash-lite": {"input": 0.075, "output": 0.30},
}

# Clean-up regex patterns
_CODE_FENCE_OPEN = re.compile(r"^\s*```(?:json)?\s*", re.IGNORECASE)
_CODE_FENCE_CLOSE = re.compile(r"\s*```\s*$")
_TRAILING_COMMA = re.compile(r",(\s*[}\]])")
_LONE_BACKSLASH = re.compile(r'\\(?!["\\/bfnrtu])')
_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")

DEFAULT_FALLBACK_HEADLINES = [
    "Quem tem pouco espaço precisa ver isso! 😱",
    "Olha esse achadinho incrível para a sua casa!",
    "Esse produto pode transformar a sua rotina!",
    "Muito prático e útil, você vai amar isso!",
    "O achadinho perfeito que você não sabia que precisava!",
]

DEFAULT_FALLBACK_HASHTAGS = [
    "#achadinhos",
    "#shopee",
    "#dicas",
    "#casa",
    "#organizacao",
    "#utilidades",
    "#publi",
]

DEFAULT_MODELS_FALLBACK_CHAIN = [
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-3.1-pro-preview",
]


_KNOWN_PROVIDER_PREFIXES = ("lmstudio", "lm_studio", "local", "ollama", "gemini", "google")


def parse_model_identifier(model_str: Optional[str]) -> tuple[str, str]:
    """Parse a model identifier string (e.g. 'gemini:gemini-3.5-flash', 'lmstudio:google/gemma-4-12b-qat', 'ollama:llama3.2:latest', or un-prefixed).

    Returns a tuple of (provider, model_name). Default provider is 'gemini'.
    """
    if not model_str or not str(model_str).strip():
        return ("gemini", "")
    s = str(model_str).strip()
    if ":" in s:
        p, m = s.split(":", 1)
        p_norm = p.strip().lower()
        if p_norm in ("lmstudio", "lm_studio", "local"):
            return ("lmstudio", m.strip())
        if p_norm == "ollama":
            return ("ollama", m.strip())
        if p_norm in ("gemini", "google"):
            return ("gemini", m.strip())
        if p_norm in _KNOWN_PROVIDER_PREFIXES:
            return (p_norm, m.strip())
    s_lower = s.lower()
    if s_lower.startswith("lmstudio") or s_lower.startswith("local"):
        if s_lower.startswith("lmstudio"):
            return ("lmstudio", s[8:].lstrip(":/ "))
        return ("lmstudio", s[5:].lstrip(":/ "))
    if s_lower.startswith("gemini"):
        return ("gemini", s)
    if s_lower.startswith("ollama"):
        return ("ollama", s[6:].lstrip(":/ "))
    # If the identifier has a slash (e.g. 'google/gemma-4-12b-qat', 'prism-ml/bonsai-27b')
    # it is an LM Studio / HuggingFace formatted local model
    if "/" in s:
        return ("lmstudio", s)
    # Plain un-prefixed names like 'llama3.2', 'llama3.2:latest', 'qwen2.5', 'mistral:7b' route to ollama
    if any(s_lower.startswith(prefix) for prefix in ("llama", "qwen", "mistral", "deepseek", "phi", "gemma", "bonsai", "muse", "nemotron", "starcoder", "codellama")):
        return ("ollama", s)
    return ("gemini", s)



class BaseAIProvider:
    """Abstract base class for commercial copy AI generation providers."""

    async def generate_copy(
        self,
        prompt: str,
        model_name: str,
        *,
        contents_payload: Any = None,
        api_key: Optional[str] = None,
    ) -> tuple[str, Dict[str, Any]]:
        raise NotImplementedError


class GeminiProvider(BaseAIProvider):
    """Google Gemini AI copy generator with automatic fallback chain."""

    async def generate_copy(
        self,
        prompt: str,
        model_name: str,
        *,
        contents_payload: Any = None,
        api_key: Optional[str] = None,
    ) -> tuple[str, Dict[str, Any]]:
        import os
        from google import genai

        resolved_api_key = (
            api_key
            or load_persistent_config().get("GEMINI_API_KEY")
            or os.environ.get("GEMINI_API_KEY", "")
            or ""
        )
        if not resolved_api_key:
            raise ValidationError("Gemini API key is not configured")

        configured_model = model_name or load_persistent_config().get("GEMINI_MODEL") or "gemini-3.5-flash"
        if configured_model.startswith("gemini:"):
            configured_model = configured_model[7:].strip()
        candidate_models = [configured_model]
        for m in DEFAULT_MODELS_FALLBACK_CHAIN:
            if m not in candidate_models:
                candidate_models.append(m)


        client = genai.Client(api_key=resolved_api_key)
        payload = contents_payload if contents_payload is not None else prompt

        raw_response_text: Optional[str] = None
        last_error: Optional[Exception] = None
        succeeded_model: Optional[str] = None
        latency_ms: int = 0
        prompt_tokens: int = 0
        candidate_tokens: int = 0
        total_tokens: int = 0

        for candidate_model in candidate_models:
            try:
                logger.info("GeminiProvider: Attempting model %s", candidate_model)
                t0 = time.monotonic()
                if hasattr(client, "aio") and hasattr(client.aio, "models"):
                    resp = await client.aio.models.generate_content(
                        model=candidate_model,
                        contents=payload,
                    )
                else:
                    resp = await asyncio.to_thread(
                        client.models.generate_content,
                        model=candidate_model,
                        contents=payload,
                    )
                latency_ms = max(1, int((time.monotonic() - t0) * 1000))

                raw_response_text = getattr(resp, "text", None) or ""
                if raw_response_text.strip():
                    succeeded_model = candidate_model
                    usage = getattr(resp, "usage_metadata", None)
                    if usage:
                        prompt_tokens = getattr(usage, "prompt_token_count", 0) or 0
                        candidate_tokens = getattr(usage, "candidates_token_count", 0) or 0
                        total_tokens = getattr(usage, "total_token_count", 0) or (prompt_tokens + candidate_tokens)
                    logger.info("GeminiProvider: Success with model %s (%d ms)", candidate_model, latency_ms)
                    break
            except Exception as exc:
                last_error = exc
                logger.warning(
                    "GeminiProvider: Model %s failed (%s); trying fallback",
                    candidate_model,
                    _redact_key(str(exc)),
                )

        if raw_response_text is None or not raw_response_text.strip():
            if last_error is not None:
                raise ClippyMeError(
                    f"Gemini affiliate copy generation failed: {_redact_key(str(last_error))}"
                )
            raise ClippyMeError("Gemini returned empty response for affiliate copy")

        if not prompt_tokens and prompt:
            prompt_tokens = max(1, len(prompt) // 4)
        if not candidate_tokens and raw_response_text:
            candidate_tokens = max(1, len(raw_response_text) // 4)
        if not total_tokens:
            total_tokens = prompt_tokens + candidate_tokens

        used_model = succeeded_model or configured_model
        pricing = MODEL_PRICING.get(used_model, {"input": 0.30, "output": 2.50})
        estimated_cost_usd = round(
            (prompt_tokens * pricing["input"] + candidate_tokens * pricing["output"]) / 1_000_000, 6
        )

        telemetry_data = {
            "provider": "gemini",
            "model": used_model,
            "model_used": used_model,
            "prompt_tokens": prompt_tokens,
            "candidate_tokens": candidate_tokens,
            "total_tokens": total_tokens,
            "estimated_cost_usd": estimated_cost_usd,
            "cost_usd": estimated_cost_usd,
            "latency_ms": latency_ms,
            "prompt": prompt,
            "raw_response": raw_response_text,
        }
        return raw_response_text, telemetry_data


class OllamaProvider(BaseAIProvider):
    """Local Ollama AI copy generator supporting /api/generate endpoint."""

    def __init__(self, base_url: Optional[str] = None):
        self._base_url = base_url

    def _get_candidate_urls(self) -> List[str]:
        import os
        if self._base_url:
            return [str(self._base_url).rstrip("/")]
        configured = os.environ.get("OLLAMA_BASE_URL") or load_persistent_config().get("OLLAMA_BASE_URL")
        if configured:
            return [str(configured).rstrip("/")]
        return [
            "http://host.docker.internal:11434",
            "http://localhost:11434",
            "http://127.0.0.1:11434",
        ]

    def _sync_generate(
        self,
        model_name: str,
        prompt: str,
        images: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        import json
        import urllib.error
        import urllib.request

        req_body: Dict[str, Any] = {
            "model": model_name,
            "prompt": prompt,
            "stream": False,
            "format": "json",
        }
        if images and isinstance(images, list):
            req_body["images"] = images

        data_bytes = json.dumps(req_body).encode("utf-8")
        candidates = self._get_candidate_urls()
        last_err: Optional[Exception] = None

        for base_url in candidates:
            endpoint = f"{base_url}/api/generate"
            req = urllib.request.Request(
                endpoint,
                data=data_bytes,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            try:
                with urllib.request.urlopen(req, timeout=300) as response:
                    status_code = response.getcode()
                    resp_bytes = response.read()
                    if status_code >= 400:
                        raise ClippyMeError(
                            f"Ollama API returned HTTP {status_code}: {resp_bytes.decode('utf-8', errors='replace')}"
                        )
                    return json.loads(resp_bytes.decode("utf-8"))
            except urllib.error.HTTPError as err:
                err_body = err.read().decode("utf-8", errors="replace") if hasattr(err, "read") else str(err)
                raise ClippyMeError(f"Ollama HTTP error {err.code} ({model_name} at {base_url}): {err_body}") from err
            except urllib.error.URLError as err:
                last_err = err
                continue
            except Exception as exc:
                raise ClippyMeError(f"Ollama generation failed ({model_name} at {base_url}): {exc}") from exc

        err_msg = last_err.reason if last_err and hasattr(last_err, "reason") else (str(last_err) if last_err else "connection refused")
        raise ClippyMeError(f"Cannot connect to Ollama ({model_name} at {candidates}): {err_msg}")

    async def generate_copy(
        self,
        prompt: str,
        model_name: str,
        *,
        contents_payload: Any = None,
        api_key: Optional[str] = None,
    ) -> tuple[str, Dict[str, Any]]:
        import base64
        used_model = model_name or "llama3.2"
        if used_model.startswith("ollama:"):
            used_model = used_model[7:].strip()
        logger.info("OllamaProvider: Calling Ollama model %s", used_model)


        # Extract base64 image frames if multimodal payload is supplied
        images_b64: List[str] = []
        if isinstance(contents_payload, list):
            for part in contents_payload:
                if hasattr(part, "inline_data") and hasattr(part.inline_data, "data"):
                    b = part.inline_data.data
                    if isinstance(b, bytes):
                        images_b64.append(base64.b64encode(b).decode("utf-8"))
                elif isinstance(part, bytes):
                    images_b64.append(base64.b64encode(part).decode("utf-8"))

        t0 = time.monotonic()
        data = await asyncio.to_thread(self._sync_generate, used_model, prompt, images_b64 or None)
        elapsed_ms = max(1, int((time.monotonic() - t0) * 1000))

        raw_response = data.get("response", "")
        if not raw_response or not str(raw_response).strip():
            raise ClippyMeError(f"Ollama returned empty response for model {used_model}")

        raw_response_text = str(raw_response)
        total_duration_ns = data.get("total_duration") or 0
        latency_ms = max(1, int(total_duration_ns / 1_000_000)) if total_duration_ns else elapsed_ms

        prompt_eval_count = data.get("prompt_eval_count") or 0
        eval_count = data.get("eval_count") or 0
        prompt_tokens = prompt_eval_count or max(1, len(prompt) // 4)
        candidate_tokens = eval_count or max(1, len(raw_response_text) // 4)
        total_tokens = prompt_tokens + candidate_tokens

        telemetry_data = {
            "provider": "ollama",
            "model": f"ollama:{used_model}",
            "model_used": f"ollama:{used_model}",
            "prompt_tokens": prompt_tokens,
            "candidate_tokens": candidate_tokens,
            "total_tokens": total_tokens,
            "estimated_cost_usd": 0.0,
            "cost_usd": 0.0,
            "latency_ms": latency_ms,
            "prompt": prompt,
            "raw_response": raw_response_text,
        }
        return raw_response_text, telemetry_data


class LMStudioProvider(BaseAIProvider):
    """Local LM Studio AI copy generator supporting OpenAI-compatible /v1/chat/completions."""

    def __init__(self, base_url: Optional[str] = None):
        self._base_url = base_url

    def _get_candidate_urls(self) -> List[str]:
        import os
        if self._base_url:
            return [str(self._base_url).rstrip("/")]
        configured = os.environ.get("LM_STUDIO_BASE_URL") or load_persistent_config().get("LM_STUDIO_BASE_URL")
        if configured:
            return [str(configured).rstrip("/")]
        return [
            "http://host.docker.internal:1234",
            "http://localhost:1234",
            "http://127.0.0.1:1234",
        ]

    def _sync_generate(
        self,
        model_name: str,
        prompt: str,
        images: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        import json
        import urllib.error
        import urllib.request

        if images and isinstance(images, list):
            content_parts: List[Dict[str, Any]] = [{"type": "text", "text": prompt}]
            for img_b64 in images:
                content_parts.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"},
                })
            user_message: Dict[str, Any] = {"role": "user", "content": content_parts}
        else:
            user_message = {"role": "user", "content": prompt}

        req_body: Dict[str, Any] = {
            "model": model_name,
            "messages": [user_message],
            "temperature": 0.7,
        }

        data_bytes = json.dumps(req_body).encode("utf-8")
        candidates = self._get_candidate_urls()
        last_err: Optional[Exception] = None

        for base_url in candidates:
            endpoint = f"{base_url}/v1/chat/completions"
            req = urllib.request.Request(
                endpoint,
                data=data_bytes,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            try:
                with urllib.request.urlopen(req, timeout=300) as response:
                    status_code = response.getcode()
                    resp_bytes = response.read()
                    if status_code >= 400:
                        raise ClippyMeError(
                            f"LM Studio API returned HTTP {status_code}: {resp_bytes.decode('utf-8', errors='replace')}"
                        )
                    return json.loads(resp_bytes.decode("utf-8"))
            except urllib.error.HTTPError as err:
                err_body = err.read().decode("utf-8", errors="replace") if hasattr(err, "read") else str(err)
                raise ClippyMeError(f"LM Studio HTTP error {err.code} ({model_name} at {base_url}): {err_body}") from err
            except urllib.error.URLError as err:
                last_err = err
                continue
            except Exception as exc:
                raise ClippyMeError(f"LM Studio generation failed ({model_name} at {base_url}): {exc}") from exc

        err_msg = last_err.reason if last_err and hasattr(last_err, "reason") else (str(last_err) if last_err else "connection refused")
        raise ClippyMeError(f"Cannot connect to LM Studio ({model_name} at {candidates}): {err_msg}")

    async def generate_copy(
        self,
        prompt: str,
        model_name: str,
        *,
        contents_payload: Any = None,
        api_key: Optional[str] = None,
    ) -> tuple[str, Dict[str, Any]]:
        import base64
        used_model = model_name or "local-model"
        if used_model.startswith("lmstudio:"):
            used_model = used_model[9:].strip()
        elif used_model.startswith("local:"):
            used_model = used_model[6:].strip()
        logger.info("LMStudioProvider: Calling LM Studio model %s", used_model)


        # Extract base64 image frames if multimodal payload is supplied
        images_b64: List[str] = []
        if isinstance(contents_payload, list):
            for part in contents_payload:
                if hasattr(part, "inline_data") and hasattr(part.inline_data, "data"):
                    b = part.inline_data.data
                    if isinstance(b, bytes):
                        images_b64.append(base64.b64encode(b).decode("utf-8"))
                elif isinstance(part, bytes):
                    images_b64.append(base64.b64encode(part).decode("utf-8"))

        t0 = time.monotonic()
        data = await asyncio.to_thread(self._sync_generate, used_model, prompt, images_b64 or None)
        elapsed_ms = max(1, int((time.monotonic() - t0) * 1000))

        choices = data.get("choices", [])
        if not choices or not isinstance(choices, list):
            raise ClippyMeError(f"LM Studio returned empty or invalid choices for model {used_model}")

        message = choices[0].get("message", {})
        raw_response = message.get("content", "")
        if not raw_response or not str(raw_response).strip():
            raise ClippyMeError(f"LM Studio returned empty response for model {used_model}")

        raw_response_text = str(raw_response)
        usage = data.get("usage", {})
        prompt_tokens = usage.get("prompt_tokens") or max(1, len(prompt) // 4)
        candidate_tokens = usage.get("completion_tokens") or max(1, len(raw_response_text) // 4)
        total_tokens = usage.get("total_tokens") or (prompt_tokens + candidate_tokens)

        telemetry_data = {
            "provider": "lm_studio",
            "model": f"lmstudio:{used_model}",
            "model_used": f"lmstudio:{used_model}",
            "prompt_tokens": prompt_tokens,
            "candidate_tokens": candidate_tokens,
            "total_tokens": total_tokens,
            "estimated_cost_usd": 0.0,
            "cost_usd": 0.0,
            "latency_ms": elapsed_ms,
            "prompt": prompt,
            "raw_response": raw_response_text,
        }
        return raw_response_text, telemetry_data


def _extract_field(obj: Any, field_name: str, default: Any = None) -> Any:
    """Helper to extract field from either Pydantic model or dict."""
    if isinstance(obj, dict):
        return obj.get(field_name, default)
    return getattr(obj, field_name, default)


def _to_dict_safe(obj: Any) -> Dict[str, Any]:
    if isinstance(obj, dict):
        return dict(obj)
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    if hasattr(obj, "dict"):
        return obj.dict()
    if hasattr(obj, "__dict__"):
        return dict(obj.__dict__)
    return {}


def build_viral_copy_prompt(
    template: Optional[Union[VisualTemplate, Dict[str, Any]]] = None,
    brand: Optional[Union[Brand, Dict[str, Any]]] = None,
    item: Optional[Union[ViralItem, Dict[str, Any]]] = None,
    product_code: Optional[str] = None,
    product_url: Optional[str] = None,
    manual_instructions: Optional[str] = None,
    video_context: Optional[Union[Any, Dict[str, Any]]] = None,
) -> str:
    """Build dynamic AI copy prompt strictly from template generation_tasks and persona. Pure function."""
    brand_name = _extract_field(brand, "name", "Viral Studio")
    brand_handle = _extract_field(brand, "handle", "@viralstudio")
    default_brand_cta = _extract_field(brand, "default_cta", "Siga para mais conteúdos!")
    brand_tone = (
        _extract_field(brand, "tone")
        or _extract_field(brand, "tone_of_voice")
        or _extract_field(_extract_field(brand, "publishing_profiles", {}), "tone")
        or "Dinâmico, envolvente e autêntico"
    )

    item_code = _extract_field(item, "product_code")
    item_url = _extract_field(item, "product_url")
    item_instructions = _extract_field(item, "additional_instructions") or _extract_field(item, "manual_instructions")

    eff_product_code = str(product_code or item_code or "").strip()
    eff_product_url = str(product_url or item_url or "").strip()
    eff_instructions = str(manual_instructions or item_instructions or "").strip()

    # Template metadata
    conversion_goal = _extract_field(template, "conversion_goal", "engagement")
    niche_type = _extract_field(template, "niche_type", "curiosities")
    persona_role = _extract_field(template, "persona_role") or "Copywriter especialista em engajamento e retenção de vídeos virais"
    tone_of_voice = _extract_field(template, "tone_of_voice") or brand_tone
    t_cta = _extract_field(template, "call_to_action_template")
    b_cta = _extract_field(brand, "default_cta")
    if conversion_goal == "engagement":
        template_cta = t_cta or "Siga para mais conteúdos!"
    elif conversion_goal == "affiliate":
        template_cta = b_cta or t_cta or "Confira os achadinhos no link da bio!"
    else:
        template_cta = t_cta or b_cta or "Siga para mais conteúdos!"
    headline_enabled = bool(_extract_field(template, "headline_enabled", True))

    # Context extractions
    vc_caption = _extract_field(video_context, "original_caption", "") or ""
    vc_transcript = _extract_field(video_context, "transcript", "") or ""
    vc_title = _extract_field(video_context, "title", "") or ""
    vc_tags = _extract_field(video_context, "tags", []) or []
    vc_keyframes = _extract_field(video_context, "keyframes", []) or []
    vc_scenes = _extract_field(video_context, "scenes_count", 0)

    subs = {
        "{transcript}": str(vc_transcript).strip() or "(conteúdo visual do vídeo)",
        "{brand_name}": str(brand_name).strip(),
        "{brand_handle}": str(brand_handle).strip(),
        "{cta}": str(template_cta).strip(),
        "{title}": str(vc_title).strip() or "(sem título original)",
        "{caption}": str(vc_caption).strip() or "(sem legenda original)",
        "{niche}": str(niche_type).strip(),
        "{product_code}": eff_product_code,
    }

    # Resolve active tasks
    raw_tasks = _extract_field(template, "generation_tasks") or []
    tasks: List[Dict[str, Any]] = []
    if raw_tasks:
        for t in raw_tasks:
            t_dict = _to_dict_safe(t)
            # Clean Video Mode: if headline_enabled is False and target is canvas_headline, omit task
            if not headline_enabled and t_dict.get("target") == "canvas_headline":
                continue
            tasks.append(t_dict)

    if not tasks:
        # Fallback default task suite depending on conversion_goal
        if conversion_goal == "affiliate":
            if headline_enabled:
                tasks.append({
                    "id": "headline",
                    "label": "Headlines Comerciais",
                    "target": "canvas_headline",
                    "instruction": "Crie exatamente 5 opções de headlines curtas e magnéticas destacando o benefício do produto em {transcript}.",
                    "output_type": "options_list",
                })
            tasks.append({
                "id": "caption",
                "label": "Legenda Comercial",
                "target": "post_caption",
                "instruction": "Escreva uma legenda completa em PT-BR contendo gancho, descrição, código do produto ({product_code}) e CTA: {cta}.",
                "output_type": "text",
            })
            tasks.append({
                "id": "product_name",
                "label": "Nome do Produto",
                "target": "custom_metadata",
                "instruction": "Nome conciso do produto identificado.",
                "output_type": "text",
            })
        else:
            if headline_enabled:
                tasks.append({
                    "id": "headline",
                    "label": "Headlines Magnéticas",
                    "target": "canvas_headline",
                    "instruction": "Crie exatamente 5 ganchos magnéticos para sobreposição no vídeo que instiguem curiosidade imediata sobre {transcript}.",
                    "output_type": "options_list",
                })
            tasks.append({
                "id": "caption",
                "label": "Legenda Completa",
                "target": "post_caption",
                "instruction": "Escreva uma legenda completa com gancho inicial instigante, explicação envolvente e CTA: {cta}.",
                "output_type": "text",
            })
            tasks.append({
                "id": "social_title",
                "label": "Título do Post",
                "target": "post_title",
                "instruction": "Crie um título curto de até 60 caracteres para o vídeo.",
                "output_type": "text",
            })

    # Context section
    context_lines = []
    if vc_caption and str(vc_caption).strip():
        context_lines.append(f"- Legenda / descrição original do post: \"{str(vc_caption).strip()}\"")
    if vc_transcript and str(vc_transcript).strip():
        context_lines.append(f"- Transcrição do áudio falado no vídeo: \"{str(vc_transcript).strip()}\"")
    if vc_title and str(vc_title).strip():
        context_lines.append(f"- Título do post original: \"{str(vc_title).strip()}\"")
    if vc_tags and isinstance(vc_tags, list) and len(vc_tags) > 0:
        clean_tags = [str(t) for t in vc_tags if str(t).strip()]
        if clean_tags:
            context_lines.append(f"- Tags / tópicos originais: {', '.join(clean_tags)}")
    if vc_keyframes and isinstance(vc_keyframes, list) and len(vc_keyframes) > 0:
        context_lines.append(
            f"- Foram fornecidos {len(vc_keyframes)} frames visuais capturados das cenas do vídeo para análise visual direta."
        )
    elif vc_scenes and vc_scenes > 0:
        context_lines.append(f"- O vídeo possui {vc_scenes} cena(s) identificadas.")

    context_section = ""
    if context_lines:
        context_section = "--- CONTEXTO EXTRAÍDO DO VÍDEO ---\n" + "\n".join(context_lines) + "\n\n"

    # Tasks instructions & JSON contract building
    task_instructions = []
    json_schema_fields = []
    has_headline_task = False

    for idx, t in enumerate(tasks, 1):
        tid = t.get("id") or f"task_{idx}"
        tlabel = t.get("label") or tid
        raw_inst = t.get("instruction") or ""
        interp_inst = raw_inst
        for k, v in subs.items():
            interp_inst = interp_inst.replace(k, str(v))

        out_type = t.get("output_type", "text")
        task_instructions.append(f"{idx}. {tlabel.upper()} (chave: \"{tid}\"):\n   - {interp_inst}")

        if out_type == "options_list" or t.get("target") == "canvas_headline":
            has_headline_task = True
            json_schema_fields.append(f'  "{tid}": [\n    "Opção 1 curta e chamativa",\n    "Opção 2 ...",\n    "Opção 3 ...",\n    "Opção 4 ...",\n    "Opção 5 ..."\n  ]')
        elif out_type == "poll":
            json_schema_fields.append(f'  "{tid}": {{\n    "question": "Pergunta provocativa...",\n    "options": ["Opção A", "Opção B"]\n  }}')
        else:
            json_schema_fields.append(f'  "{tid}": "Texto gerado para {tlabel}"')

    if has_headline_task:
        json_schema_fields.append('  "selected_headline": "A melhor opção escolhida entre as opções acima"')

    json_schema_fields.append('  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4"]')
    tasks_section = "--- TAREFAS DE GERAÇÃO EXIGIDAS ---\n" + "\n".join(task_instructions) + "\n\n"

    # Goal guidelines
    if conversion_goal == "engagement":
        goal_rules = (
            "--- DIRETRIZES EDITORIAIS (FOCO EM ENGAJAMENTO PURO) ---\n"
            "- O objetivo deste vídeo é 100% RETENÇÃO E ENGAJAMENTO ORGÂNICO.\n"
            "- É ESTRITAMENTE PROIBIDO inventar códigos de produto, links de bio promocionais, cupons ou chamadas de venda/afiliados.\n"
            "- A legenda deve explicar o tema com dados impressionantes, narrativa envolvente e terminar com perguntas provocativas para gerar debate nos comentários.\n\n"
        )
    elif conversion_goal == "affiliate":
        code_str = f"Código: {eff_product_code}" if eff_product_code else ""
        goal_rules = (
            "--- DIRETRIZES COMERCIAIS (MARKETING DE AFILIADOS / ACHADINHOS) ---\n"
            "- O objetivo deste vídeo é utilidade prática e CONVERSÃO COMERCIAL.\n"
            f"- Se houver código ({code_str or 'se informado'}), inclua obrigatoriamente na legenda como '📌 Produto {eff_product_code}'.\n"
            "- Destaque os benefícios práticos e a chamada para link na bio / comentários (ex: 'Comente QUERO que envio o link').\n"
            "- NUNCA invente preços fictícios ou promoções que não foram fornecidas.\n\n"
        )
    else:
        goal_rules = (
            f"--- DIRETRIZES DO OBJETIVO ({conversion_goal.upper()}) ---\n"
            f"- Foque na postura editorial: {persona_role}.\n"
            f"- Utilize a chamada para ação (CTA): \"{template_cta}\".\n\n"
        )

    user_instructions = ""
    if eff_instructions:
        user_instructions = f"- Instruções adicionais do usuário: \"{eff_instructions}\"\n"
    code_instruction = ""
    if eff_product_code and conversion_goal == "affiliate":
        code_instruction = f"- Código do produto: {eff_product_code}\n"
    url_instruction = ""
    eff_url = eff_product_url or _extract_field(brand, "default_affiliate_url")
    if eff_url and conversion_goal == "affiliate":
        url_instruction = f"- Link / URL de referência: {eff_url}\n"

    brand_tone_field = _extract_field(brand, "tone")
    tone_brand_line = f"- Tom de voz da marca: {brand_tone_field}\n" if brand_tone_field else ""

    json_format_str = "{\n" + ",\n".join(json_schema_fields) + "\n}"

    # Ensure lowercase role prefix for tone consistency
    p_role_formatted = persona_role.strip()
    if p_role_formatted and p_role_formatted[0].isupper():
        p_role_formatted = p_role_formatted[0].lower() + p_role_formatted[1:]

    headline_inst_summary = "5 opções de headlines" if has_headline_task else ""
    prompt = (
        f"Você é um {p_role_formatted}.\n"
        f"Seu tom de voz é: {tone_of_voice}.\n"
        f"Sua missão é criar o conteúdo textual e editorial em Português Brasileiro (PT-BR) para este vídeo no formato 9:16 (Instagram Reels / TikTok / YouTube Shorts).\n\n"
        "--- CONTEXTO DA MARCA E TEMPLATE ---\n"
        f"- Nome da marca: {brand_name}\n"
        f"- Perfil / Handle: {brand_handle}\n"
        f"- Nicho do canal: {niche_type}\n"
        f"{tone_brand_line}"
        f"- CTA padrão: {template_cta}\n"
        f"{code_instruction}"
        f"{url_instruction}"
        f"{user_instructions}\n"
        f"{context_section}"
        f"{goal_rules}"
        f"{tasks_section}"
        "--- FORMATO DE RESPOSTA ---\n"
        "Responda EXCLUSIVAMENTE em JSON válido, sem texto explicativo antes ou depois, seguindo esta estrutura exata:\n"
        f"{json_format_str}\n"
    )
    return prompt


def build_affiliate_copy_prompt(
    brand: Union[Brand, Dict[str, Any]],
    product_code: Optional[str] = None,
    product_url: Optional[str] = None,
    manual_instructions: Optional[str] = None,
    video_context: Optional[Union[Any, Dict[str, Any]]] = None,
) -> str:
    """Backwards-compatible wrapper delegating to build_viral_copy_prompt."""
    from clippyme.api.viral_studio_schemas import DEFAULT_TEMPLATE
    return build_viral_copy_prompt(
        template=DEFAULT_TEMPLATE,
        brand=brand,
        product_code=product_code,
        product_url=product_url,
        manual_instructions=manual_instructions,
        video_context=video_context,
    )


def _clean_json_str(raw: str) -> str:
    """Apply deterministic string cleaning to fix common LLM JSON syntax errors."""
    cleaned = (
        raw.replace("\u201c", '"')
        .replace("\u201d", '"')
        .replace("\u2018", "'")
        .replace("\u2019", "'")
    )
    cleaned = _TRAILING_COMMA.sub(r"\1", cleaned)
    cleaned = _LONE_BACKSLASH.sub(r"\\\\", cleaned)
    cleaned = _CONTROL_CHARS.sub("", cleaned)
    return cleaned


def parse_viral_copy_response(
    raw_text: str,
    default_cta: str = "Confira os detalhes no link da bio!",
    product_code: Optional[str] = None,
    conversion_goal: str = "engagement",
    default_hashtags: Optional[List[str]] = None,
) -> AICopyData:
    """Parse raw LLM output into a validated AICopyData model with 5-level repair chain."""
    if not raw_text or not raw_text.strip():
        return _build_fallback_copy_data(default_cta, product_code, conversion_goal, default_hashtags)

    text = raw_text.strip()
    text = _CODE_FENCE_OPEN.sub("", text)
    text = _CODE_FENCE_CLOSE.sub("", text).strip()

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end > start:
        json_candidate = text[start : end + 1]
    else:
        json_candidate = text

    parsed_obj: Optional[Dict[str, Any]] = None

    # Level 1: Standard JSON parse
    try:
        data = json.loads(json_candidate, strict=False)
        if isinstance(data, dict):
            parsed_obj = data
    except (json.JSONDecodeError, ValueError):
        pass

    # Level 2: Deterministic clean + strict=False
    if parsed_obj is None:
        try:
            cleaned = _clean_json_str(json_candidate)
            data = json.loads(cleaned, strict=False)
            if isinstance(data, dict):
                parsed_obj = data
        except (json.JSONDecodeError, ValueError):
            pass

    # Level 3: json_repair library
    if parsed_obj is None:
        try:
            from json_repair import repair_json  # type: ignore

            repaired = repair_json(json_candidate)
            data = json.loads(repaired)
            if isinstance(data, dict):
                parsed_obj = data
        except Exception:
            pass

    # Level 4: Regex-based field extraction
    if parsed_obj is None:
        parsed_obj = _regex_extract_copy_fields(text)

    # Level 5: Safe graceful fallback construction
    if not parsed_obj:
        return _build_fallback_copy_data(default_cta, product_code, conversion_goal, default_hashtags)

    return _normalize_parsed_dict(parsed_obj, default_cta, product_code, conversion_goal, default_hashtags)


def parse_affiliate_copy_response(
    raw_text: str,
    default_cta: str = "Confira os achadinhos no link da bio!",
    product_code: Optional[str] = None,
) -> AICopyData:
    """Backwards-compatible parser delegating to parse_viral_copy_response."""
    return parse_viral_copy_response(
        raw_text=raw_text,
        default_cta=default_cta,
        product_code=product_code,
        conversion_goal="affiliate",
    )


def _regex_extract_copy_fields(text: str) -> Optional[Dict[str, Any]]:
    """Attempt heuristic regex extraction of fields from malformed JSON."""
    result: Dict[str, Any] = {}
    prod_m = re.search(r'"(?:product|product_name|produto)"\s*:\s*"([^"]+)"', text)
    if prod_m:
        result["product"] = prod_m.group(1)

    desc_m = re.search(r'"(?:product_description|descricao)"\s*:\s*"([^"]+)"', text)
    if desc_m:
        result["product_description"] = desc_m.group(1)

    sel_h_m = re.search(r'"selected_headline"\s*:\s*"([^"]+)"', text)
    if sel_h_m:
        result["selected_headline"] = sel_h_m.group(1)

    caption_m = re.search(r'"(?:caption|legenda)"\s*:\s*"((?:[^"\\]|\\.)*)"', text)
    if caption_m:
        result["caption"] = caption_m.group(1).replace(r"\n", "\n")

    title_m = re.search(r'"(?:social_title|post_title|titulo)"\s*:\s*"([^"]+)"', text)
    if title_m:
        result["social_title"] = title_m.group(1)

    headlines_m = re.search(r'"(?:headlines|headline|manchetes)"\s*:\s*\[(.*?)\]', text, re.DOTALL)
    if headlines_m:
        raw_items = re.findall(r'"([^"]+)"', headlines_m.group(1))
        if raw_items:
            result["headlines"] = raw_items

    hashtags_m = re.search(r'"(?:hashtags|tags)"\s*:\s*\[(.*?)\]', text, re.DOTALL)
    if hashtags_m:
        raw_tags = re.findall(r'"([^"]+)"', hashtags_m.group(1))
        if raw_tags:
            result["hashtags"] = raw_tags

    return result if result.get("headlines") or result.get("caption") else None


def _normalize_parsed_dict(
    data: Dict[str, Any],
    default_cta: str,
    product_code: Optional[str] = None,
    conversion_goal: str = "engagement",
    default_hashtags: Optional[List[str]] = None,
) -> AICopyData:
    """Ensure all required AICopyData fields are clean, non-empty, and compliant."""
    product = data.get("product") or data.get("product_name") or data.get("produto")
    product_str = str(product).strip()[:200] if product else None

    product_desc = data.get("product_description") or data.get("descricao") or ""
    product_desc_str = str(product_desc).strip()[:1000] if product_desc else ""

    social_title = data.get("social_title") or data.get("post_title") or data.get("titulo")
    social_title_str = str(social_title).strip()[:200] if social_title else None

    # Normalize headlines
    raw_headlines = data.get("headlines") or data.get("headline") or data.get("manchetes")
    headlines: List[str] = []
    if isinstance(raw_headlines, str):
        raw_headlines = [
            re.sub(r"^(?:[-*•–—]|\d+[\.\-\)])\s*", "", line.strip())
            for line in raw_headlines.splitlines()
            if line.strip()
        ]
    if isinstance(raw_headlines, list):
        for h in raw_headlines:
            if isinstance(h, str) and h.strip():
                clean_h = h.strip()
                clean_h = re.sub(r"^(?:[-*•–—]|\d+[\.\-\)])\s*", "", clean_h)
                if clean_h and clean_h[:300] not in headlines:
                    headlines.append(clean_h[:300])

    if not headlines:
        headlines = list(DEFAULT_FALLBACK_HEADLINES)
    elif len(headlines) < 5:
        for fallback_h in DEFAULT_FALLBACK_HEADLINES:
            if fallback_h not in headlines:
                headlines.append(fallback_h)
            if len(headlines) >= 5:
                break

    # Selected headline resolution
    raw_selected = str(data.get("selected_headline") or "").strip()
    selected_headline = re.sub(r"^(?:[-*•–—]|\d+[\.\-\)])\s*", "", raw_selected).strip()

    option_m = re.match(
        r"^(?:op[çc][ãa]o|option)?\s*([1-9]|10)\b(?:\s*[:\-\.]\s*(.*))?$",
        raw_selected,
        re.IGNORECASE,
    )
    if option_m:
        opt_idx = int(option_m.group(1)) - 1
        tail = (option_m.group(2) or "").strip()
        if tail:
            selected_headline = tail
        elif 0 <= opt_idx < len(headlines):
            selected_headline = headlines[opt_idx]
        else:
            selected_headline = headlines[0]

    if not selected_headline:
        selected_headline = headlines[0] if headlines else ""
    elif selected_headline not in headlines and selected_headline:
        headlines.insert(0, selected_headline)

    headlines = headlines[:10]
    selected_headline = selected_headline[:300]

    # Hashtags
    raw_hashtags = data.get("hashtags") or data.get("tags")
    hashtags: List[str] = []
    if isinstance(raw_hashtags, str):
        raw_hashtags = re.findall(r"#?[\w-]+", raw_hashtags)
    if isinstance(raw_hashtags, list):
        for tag in raw_hashtags:
            if isinstance(tag, str):
                cleaned_tag = tag.strip().replace(" ", "")
                if cleaned_tag:
                    if not cleaned_tag.startswith("#"):
                        cleaned_tag = f"#{cleaned_tag}"
                    if cleaned_tag not in hashtags:
                        hashtags.append(cleaned_tag)
    if not hashtags:
        hashtags = list(default_hashtags or DEFAULT_FALLBACK_HASHTAGS)

    # Caption
    raw_caption = data.get("caption") or data.get("post_caption") or data.get("legenda")
    if isinstance(raw_caption, list):
        caption = "\n\n".join(str(p).strip() for p in raw_caption if str(p).strip())
    else:
        caption = str(raw_caption or "").strip()

    clean_code = str(product_code).strip() if (product_code is not None and str(product_code).strip()) else ""
    if not caption:
        parts = [selected_headline] if selected_headline else []
        if product_desc_str:
            parts.append(product_desc_str)
        if clean_code and conversion_goal == "affiliate":
            parts.append(f"📌 Produto {clean_code}")
        parts.append(default_cta)
        parts.append(" ".join(hashtags))
        caption = "\n\n".join(parts)
    else:
        if clean_code and conversion_goal == "affiliate":
            has_code = bool(
                re.search(
                    rf"(?:produto|código|codigo|cod\.?|ref\.?)\s*:?\s*#?{re.escape(clean_code)}\b",
                    caption,
                    re.IGNORECASE,
                )
                or f"📌 Produto {clean_code}" in caption
                or f"Código: {clean_code}" in caption
            )
            if not has_code:
                extra = f"📌 Produto {clean_code}"
                tag_tail_m = re.search(r"(\n+(?:#[\w-]+\s*)+)$", caption)
                if tag_tail_m:
                    head = caption[: tag_tail_m.start()].rstrip()
                    tail = tag_tail_m.group(1).lstrip()
                    cand = f"{head}\n\n{extra}\n\n{tail}"
                else:
                    cand = f"{caption}\n\n{extra}"

                if len(cand) <= 4000:
                    caption = cand
                else:
                    caption = f"{cand[:4000 - len(extra) - 2]}\n\n{extra}"

    caption = caption[:4000]

    # Collect custom outputs from all remaining keys
    known_keys = {
        "product", "product_name", "produto", "product_description", "descricao",
        "headlines", "headline", "manchetes", "selected_headline",
        "caption", "post_caption", "legenda", "social_title", "post_title", "titulo",
        "hashtags", "tags",
    }
    custom_outputs = {k: v for k, v in data.items() if k not in known_keys}

    return AICopyData(
        product=product_str,
        product_description=product_desc_str,
        headlines=headlines,
        selected_headline=selected_headline,
        caption=caption,
        hashtags=hashtags,
        social_title=social_title_str,
        custom_outputs=custom_outputs,
    )


def _build_fallback_copy_data(
    default_cta: str,
    product_code: Optional[str] = None,
    conversion_goal: str = "engagement",
    default_hashtags: Optional[List[str]] = None,
) -> AICopyData:
    """Generate safe fallback AICopyData when model output is completely missing."""
    headlines = list(DEFAULT_FALLBACK_HEADLINES)
    selected_headline = headlines[0]
    hashtags = list(default_hashtags or DEFAULT_FALLBACK_HASHTAGS)

    if conversion_goal == "affiliate":
        parts = [
            selected_headline,
            "Esse achadinho vai transformar o seu espaço e facilitar muito o seu dia a dia!",
        ]
        clean_code = str(product_code).strip() if (product_code is not None and str(product_code).strip()) else ""
        if clean_code:
            parts.append(f"📌 Produto {clean_code}")
        parts.append(default_cta)
        parts.append(" ".join(hashtags))
        return AICopyData(
            product="Produto em Destaque",
            product_description="Achadinho incrível com alta utilidade para sua rotina.",
            headlines=headlines,
            selected_headline=selected_headline,
            caption="\n\n".join(parts),
            hashtags=hashtags,
            social_title=selected_headline,
        )

    parts = [
        selected_headline,
        "Você já sabia dessa curiosidade incrível? O conhecimento transforma tudo!",
        default_cta,
        " ".join(hashtags),
    ]
    return AICopyData(
        product=None,
        product_description="",
        headlines=headlines,
        selected_headline=selected_headline,
        caption="\n\n".join(parts),
        hashtags=hashtags,
        social_title="Fato Surpreendente",
        custom_outputs={},
    )


async def generate_viral_copy(
    template: Optional[Union[VisualTemplate, Dict[str, Any]]] = None,
    brand: Optional[Union[Brand, Dict[str, Any]]] = None,
    item: Optional[Union[ViralItem, Dict[str, Any]]] = None,
    video_path: Optional[str] = None,
    api_key: Optional[str] = None,
    model: Optional[str] = None,
    video_context: Optional[Union[Any, Dict[str, Any]]] = None,
    manual_instructions: Optional[str] = None,
) -> AICopyData:
    """Generate viral copy for an item based on its template with model resolution and item caching."""
    # Positional swap compatibility: if called as (brand, item)
    if template is not None and brand is not None and item is None:
        if isinstance(template, Brand) or (isinstance(template, dict) and "handle" in template and "video_fit" not in template):
            item = brand  # type: ignore
            brand = template  # type: ignore
            template = None

    # 1. Caching check: bypass LLM if item already has ai_copy
    existing_copy = _extract_field(item, "ai_copy")
    if existing_copy is not None:
        copy_obj: Optional[AICopyData] = None
        if isinstance(existing_copy, AICopyData):
            copy_obj = existing_copy.model_copy()
        elif isinstance(existing_copy, dict):
            try:
                copy_obj = AICopyData.model_validate(existing_copy)
            except Exception:
                pass
        if copy_obj is not None:
            effective_selected_headline = (
                _extract_field(item, "manual_headline")
                or _extract_field(item, "selected_headline")
                or copy_obj.selected_headline
            )
            clean_headline = str(effective_selected_headline or "").strip()
            if not clean_headline and copy_obj.headlines:
                clean_headline = copy_obj.headlines[0]
            if clean_headline:
                copy_obj.selected_headline = clean_headline[:300]
                if clean_headline not in copy_obj.headlines:
                    copy_obj.headlines.insert(0, clean_headline[:300])
                copy_obj.headlines = copy_obj.headlines[:10]

            effective_caption = _extract_field(item, "caption") or copy_obj.caption
            copy_obj.caption = effective_caption

            if isinstance(item, dict):
                item["ai_copy"] = copy_obj.model_dump()
                item["selected_headline"] = clean_headline
                item["caption"] = effective_caption
                if video_path and not item.get("source_path"):
                    item["source_path"] = video_path
            else:
                try:
                    item.ai_copy = copy_obj
                    item.selected_headline = clean_headline
                    item.caption = effective_caption
                    if video_path and not getattr(item, "source_path", None):
                        item.source_path = video_path
                except Exception as e:
                    logger.debug("Could not assign fields directly to item object: %s", e)

            item_id = _extract_field(item, "id") or _extract_field(item, "item_id")
            if item_id:
                try:
                    from clippyme.domain import viral_studio_store
                    viral_studio_store.update_item(
                        item_id,
                        {
                            "ai_copy": copy_obj.model_dump(),
                            "selected_headline": clean_headline,
                            "caption": effective_caption,
                        },
                    )
                except Exception as exc:
                    logger.debug("Could not persist cached copy update to store: %s", exc)

            logger.info("generate_viral_copy: Returning cached AICopyData for item")
            return copy_obj

    # 2. Resolve template & model
    if template is None:
        template_id = _extract_field(item, "template_id") or _extract_field(brand, "template_id") or "classic-affiliate"
        from clippyme.domain import viral_studio_store
        template = viral_studio_store.get_template(template_id)
        if not template:
            from clippyme.api.viral_studio_schemas import DEFAULT_TEMPLATE
            template = DEFAULT_TEMPLATE

    configured_model = (
        model
        or _extract_field(item, "model")
        or _extract_field(template, "preferred_model")
        or load_persistent_config().get("DEFAULT_AI_MODEL")
        or load_persistent_config().get("GEMINI_MODEL")
        or "gemini-3.5-flash"
    )
    provider_name, model_subname = parse_model_identifier(configured_model)

    # 3. Multi-Signal Video Context extraction
    resolved_context = video_context
    target_video_file = video_path or _extract_field(item, "source_path")
    if resolved_context is None and target_video_file and os.path.isfile(target_video_file):
        try:
            from clippyme.domain.viral_studio_context import extract_viral_context

            resolved_context = extract_viral_context(
                video_path=target_video_file,
                source_metadata=_extract_field(item, "source_metadata"),
                batch_id=_extract_field(item, "batch_id"),
                item_id=_extract_field(item, "id") or _extract_field(item, "item_id"),
            )
        except Exception as exc:
            logger.debug("Automatic video context extraction skipped: %s", exc)

    context_summary = None
    if resolved_context is not None:
        if hasattr(resolved_context, "to_summary_dict"):
            context_summary = resolved_context.to_summary_dict()
        elif isinstance(resolved_context, dict):
            context_summary = resolved_context

    # 4. Build prompt
    prompt = build_viral_copy_prompt(
        template=template,
        brand=brand,
        item=item,
        manual_instructions=manual_instructions,
        video_context=resolved_context,
    )

    # 5. Multimodal frame images
    contents_payload: Any = prompt
    keyframes = _extract_field(resolved_context, "keyframes", [])
    if keyframes and isinstance(keyframes, list):
        try:
            from google.genai import types

            image_parts = []
            for kf in keyframes:
                if isinstance(kf, bytes) and len(kf) > 0:
                    image_parts.append(types.Part.from_bytes(data=kf, mime_type="image/jpeg"))
            if image_parts:
                contents_payload = [*image_parts, prompt]
        except Exception as exc:
            logger.debug("Could not attach visual frame parts: %s", exc)

    # 6. Execute generation
    if provider_name in ("lmstudio", "local", "lm_studio"):
        lm_prov = LMStudioProvider()
        raw_response_text, telemetry_data = await lm_prov.generate_copy(
            prompt=prompt,
            model_name=model_subname,
            contents_payload=contents_payload,
            api_key=api_key,
        )
    elif provider_name == "ollama":
        ollama_prov = OllamaProvider()
        raw_response_text, telemetry_data = await ollama_prov.generate_copy(
            prompt=prompt,
            model_name=model_subname,
            contents_payload=contents_payload,
            api_key=api_key,
        )
    else:
        gemini_prov = GeminiProvider()
        raw_response_text, telemetry_data = await gemini_prov.generate_copy(
            prompt=prompt,
            model_name=model_subname,
            contents_payload=contents_payload,
            api_key=api_key,
        )

    # 7. Parse response
    default_cta = _extract_field(template, "call_to_action_template") or _extract_field(brand, "default_cta") or "Siga para mais!"
    product_code = _extract_field(item, "product_code")
    conversion_goal = _extract_field(template, "conversion_goal", "engagement")
    default_hashtags = _extract_field(template, "default_hashtags") or []

    copy_data = parse_viral_copy_response(
        raw_text=raw_response_text,
        default_cta=default_cta,
        product_code=product_code,
        conversion_goal=conversion_goal,
        default_hashtags=default_hashtags,
    )

    copy_data.model = telemetry_data.get("model")
    copy_data.telemetry = telemetry_data

    # 8. Reconcile user overrides
    effective_selected_headline = (
        _extract_field(item, "manual_headline")
        or _extract_field(item, "selected_headline")
        or copy_data.selected_headline
    )
    clean_effective_headline = str(effective_selected_headline or "").strip()
    if clean_effective_headline:
        copy_data.selected_headline = clean_effective_headline[:300]
        if clean_effective_headline not in copy_data.headlines:
            copy_data.headlines.insert(0, clean_effective_headline[:300])
        copy_data.headlines = copy_data.headlines[:10]

    effective_caption = _extract_field(item, "caption") or copy_data.caption
    copy_data.caption = effective_caption

    keyframe_urls = getattr(resolved_context, "keyframe_urls", []) if resolved_context else []

    if isinstance(item, dict):
        item["ai_copy"] = copy_data.model_dump()
        item["selected_headline"] = clean_effective_headline
        item["caption"] = effective_caption
        item["ai_telemetry"] = telemetry_data
        if keyframe_urls:
            item["keyframe_urls"] = keyframe_urls
        if context_summary:
            item["ai_context_summary"] = context_summary
        if video_path and not item.get("source_path"):
            item["source_path"] = video_path
    elif item is not None:
        try:
            item.ai_copy = copy_data
            item.selected_headline = clean_effective_headline
            item.caption = effective_caption
            item.ai_telemetry = telemetry_data
            if keyframe_urls:
                item.keyframe_urls = keyframe_urls
            if context_summary:
                item.ai_context_summary = context_summary
            if video_path and not getattr(item, "source_path", None):
                item.source_path = video_path
        except Exception as e:
            logger.debug("Could not assign ai_copy directly to item object: %s", e)

    # 9. Persist to store if item has an ID
    item_id = _extract_field(item, "id") or _extract_field(item, "item_id")
    if item_id:
        try:
            from clippyme.domain import viral_studio_store
            update_dict: Dict[str, Any] = {
                "ai_copy": copy_data.model_dump(),
                "selected_headline": clean_effective_headline,
                "caption": effective_caption,
                "ai_telemetry": telemetry_data,
            }
            if context_summary:
                update_dict["ai_context_summary"] = context_summary
            if keyframe_urls:
                update_dict["keyframe_urls"] = keyframe_urls
            viral_studio_store.update_item(item_id, update_dict)
        except Exception as exc:
            logger.debug("Could not persist ai_copy to viral_studio_store: %s", exc)

    return copy_data


async def generate_affiliate_copy(
    brand: Union[Brand, Dict[str, Any]],
    item: Union[ViralItem, Dict[str, Any]],
    api_key: Optional[str] = None,
    manual_instructions: Optional[str] = None,
    video_context: Optional[Union[Any, Dict[str, Any]]] = None,
    model: Optional[str] = None,
    video_path: Optional[str] = None,
) -> AICopyData:
    """Backwards-compatible commercial copy generator using DEFAULT_TEMPLATE."""
    from clippyme.api.viral_studio_schemas import DEFAULT_TEMPLATE
    return await generate_viral_copy(
        template=DEFAULT_TEMPLATE,
        brand=brand,
        item=item,
        api_key=api_key,
        manual_instructions=manual_instructions,
        video_context=video_context,
        model=model,
        video_path=video_path,
    )


async def test_copy_generation(
    template: Union[VisualTemplate, Dict[str, Any]],
    brand: Optional[Union[Brand, Dict[str, Any]]] = None,
    sample_transcript: Optional[str] = None,
    sample_title: Optional[str] = None,
    model: Optional[str] = None,
) -> tuple[AICopyData, Dict[str, Any]]:
    """Test AI copy generation with a template in real-time. Pure prompt testing."""
    sample_vc = {
        "transcript": sample_transcript or "Você sabia que o polvo tem três corações e o sangue dele é azul? Além disso, dois corações param de bater quando ele nada!",
        "title": sample_title or "Fatos Surpreendentes sobre Criaturas Marinhas",
        "original_caption": "Fatos incríveis da biologia marinha que vão explodir sua mente!",
        "tags": ["curiosidades", "ciencia", "natureza"],
    }

    prompt = build_viral_copy_prompt(
        template=template,
        brand=brand,
        video_context=sample_vc,
    )

    configured_model = (
        model
        or _extract_field(template, "preferred_model")
        or load_persistent_config().get("DEFAULT_AI_MODEL")
        or load_persistent_config().get("GEMINI_MODEL")
        or "gemini-3.5-flash"
    )
    provider_name, model_subname = parse_model_identifier(configured_model)

    if provider_name in ("lmstudio", "local", "lm_studio"):
        prov = LMStudioProvider()
    elif provider_name == "ollama":
        prov = OllamaProvider()
    else:
        prov = GeminiProvider()

    raw_response_text, telemetry_data = await prov.generate_copy(
        prompt=prompt,
        model_name=model_subname,
    )

    default_cta = _extract_field(template, "call_to_action_template") or _extract_field(brand, "default_cta") or "Siga para mais!"
    conversion_goal = _extract_field(template, "conversion_goal", "engagement")
    default_hashtags = _extract_field(template, "default_hashtags") or []

    copy_data = parse_viral_copy_response(
        raw_text=raw_response_text,
        default_cta=default_cta,
        conversion_goal=conversion_goal,
        default_hashtags=default_hashtags,
    )
    copy_data.model = telemetry_data.get("model")
    copy_data.telemetry = telemetry_data
    return copy_data, telemetry_data


__all__ = [
    "build_viral_copy_prompt",
    "build_affiliate_copy_prompt",
    "parse_viral_copy_response",
    "parse_affiliate_copy_response",
    "generate_viral_copy",
    "generate_affiliate_copy",
    "test_copy_generation",
    "parse_model_identifier",
    "BaseAIProvider",
    "GeminiProvider",
    "OllamaProvider",
    "LMStudioProvider",
]
