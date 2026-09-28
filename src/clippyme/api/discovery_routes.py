"""FastAPI route handlers for multi-platform video discovery (synchronous and async worker queue)."""
from __future__ import annotations

import logging
from typing import Any, Dict, List
from fastapi import APIRouter, status

from clippyme.domain.discovery import (
    DiscoveryFilter,
    DiscoveryResult,
    DiscoverySearch,
    DiscoverySearchSummary,
    PlatformType,
    delete_search,
    get_discovery_service,
    get_discovery_worker,
    get_search,
    list_searches,
    mark_imported_status,
)
from clippyme.domain.errors import NotFoundError

logger = logging.getLogger("clippyme.api.discovery")
router = APIRouter(tags=["discovery"])


@router.get("/api/discover/platforms")
@router.get("/api/discovery/platforms")
async def get_available_platforms() -> Dict[str, Any]:
    """Retorna a lista de plataformas suportadas para busca de vídeos virais."""
    return {
        "platforms": [
            {
                "id": PlatformType.INSTAGRAM.value,
                "name": "Instagram Reels",
                "icon": "instagram",
                "description": "Busca por hashtag, explorador e Reels virais",
                "enabled": True,
            },
            {
                "id": PlatformType.TIKTOK.value,
                "name": "TikTok",
                "icon": "video",
                "description": "Busca por hashtags e tendências",
                "enabled": True,
            },
            {
                "id": PlatformType.YOUTUBE.value,
                "name": "YouTube Shorts",
                "icon": "youtube",
                "description": "Busca por palavras-chave com ordenação por visualizações",
                "enabled": True,
            },
        ]
    }


@router.post("/api/discover/search", response_model=DiscoveryResult)
@router.post("/api/discovery/search", response_model=DiscoveryResult)
async def search_viral_videos(filter_params: DiscoveryFilter) -> DiscoveryResult:
    """
    Pesquisa vídeos virais por palavra-chave/hashtag de forma síncrona (legado / compatibilidade),
    calcula as métricas de engajamento e ranqueia os resultados.
    """
    service = get_discovery_service()
    result = await service.search(filter_params)
    return result


@router.post(
    "/api/discovery/searches",
    response_model=DiscoverySearchSummary,
    status_code=status.HTTP_202_ACCEPTED,
)
async def create_discovery_search(filter_params: DiscoveryFilter) -> DiscoverySearchSummary:
    """
    Inicia uma busca de descoberta assíncrona com enfileiramento e semáforo de concorrência.
    Retorna status 202 Accepted com o registro de busca no estado QUEUED.
    """
    worker = get_discovery_worker()
    return await worker.create_and_enqueue(filter_params)


@router.post("/api/discovery/searches/{search_id}/cancel", response_model=DiscoverySearchSummary)
async def cancel_discovery_search(search_id: str) -> DiscoverySearchSummary:
    """
    Cancela imediatamente uma busca de descoberta em andamento ou na fila.
    Aborta a task ativa e libera o semáforo de concorrência.
    """
    worker = get_discovery_worker()
    cancelled = await worker.cancel_search(search_id)
    if not cancelled:
        raise NotFoundError(f"Busca de descoberta não encontrada: {search_id}")
    return cancelled.to_summary()


@router.get("/api/discovery/searches", response_model=List[DiscoverySearchSummary])
async def list_discovery_searches() -> List[DiscoverySearchSummary]:
    """Retorna o histórico de buscas de descoberta salvas e recentes."""
    return list_searches(limit=100)


@router.get("/api/discovery/searches/{search_id}", response_model=DiscoverySearch)
async def get_discovery_search_detail(search_id: str) -> DiscoverySearch:
    """
    Retorna os detalhes completos de uma busca de descoberta com itens e status de importação.
    """
    search = get_search(search_id)
    if not search:
        raise NotFoundError(f"Busca de descoberta não encontrada: {search_id}")

    # Dynamically update already_imported status for the items
    if search.items:
        search.items = mark_imported_status(search.items)

    return search


@router.delete("/api/discovery/searches/{search_id}")
async def delete_discovery_search(search_id: str) -> Dict[str, bool]:
    """Exclui uma busca de descoberta persistida e a remove do histórico."""
    worker = get_discovery_worker()
    await worker.cancel_search(search_id)
    success = delete_search(search_id)
    if not success:
        raise NotFoundError(f"Busca de descoberta não encontrada: {search_id}")
    return {"success": True}
