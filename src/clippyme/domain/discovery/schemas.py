from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PlatformType(str, Enum):
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"


class SortOrder(str, Enum):
    VIRALITY_SCORE = "virality_score"
    VIEW_COUNT = "view_count"
    RECENT = "recent"
    ENGAGEMENT_RATE = "engagement_rate"


class DiscoverySearchStatus(str, Enum):
    QUEUED = "QUEUED"
    SEARCHING = "SEARCHING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class ImportProvenance(BaseModel):
    search_id: str = Field(..., description="ID da busca de descoberta de origem")
    platform: PlatformType = Field(..., description="Plataforma de onde o vídeo foi minerado")
    query: str = Field(..., description="Termo ou hashtag pesquisada")
    discovered_item_id: Optional[str] = Field(default=None, description="ID do item retornado na descoberta")
    virality_score: float = Field(default=0.0, description="Score viral no momento da mineração")


class DiscoveryFilter(BaseModel):
    query: str = Field(..., min_length=1, max_length=200, description="Palavra-chave, hashtag ou termo de busca")
    platform: PlatformType = Field(default=PlatformType.INSTAGRAM, description="Plataforma de busca")
    limit: int = Field(default=20, ge=1, le=100, description="Quantidade máxima de resultados")
    min_views: Optional[int] = Field(default=None, ge=0, description="Filtro de visualizações mínimas")
    max_age_days: Optional[int] = Field(default=None, ge=1, le=365, description="Idade máxima do post em dias")
    min_duration_seconds: Optional[int] = Field(default=None, ge=0, le=3600, description="Duração mínima em segundos")
    max_duration_seconds: Optional[int] = Field(default=None, ge=1, le=3600, description="Duração máxima em segundos")
    sort_by: SortOrder = Field(default=SortOrder.VIRALITY_SCORE, description="Critério de ordenação")


class DiscoveryItem(BaseModel):
    id: str = Field(..., description="ID único do item na plataforma")
    platform: PlatformType = Field(..., description="Plataforma de origem")
    url: str = Field(..., description="URL direta da postagem/vídeo")
    title: str = Field(default="", description="Título ou legenda da postagem")
    description: str = Field(default="", description="Descrição completa")
    author_name: str = Field(default="", description="Nome do autor/canal")
    author_handle: str = Field(default="", description="Handle/username (@usuario)")
    author_avatar_url: Optional[str] = Field(default=None, description="URL do avatar do autor")
    published_at: Optional[str] = Field(default=None, description="Data de publicação (ISO 8601 ou timestamp)")
    published_timestamp: Optional[int] = Field(default=None, description="Timestamp de publicação em segundos")
    duration_seconds: Optional[float] = Field(default=None, description="Duração do vídeo em segundos")
    thumbnail_url: Optional[str] = Field(default=None, description="URL da miniatura/capa")
    
    # Métricas brutas
    view_count: int = Field(default=0, description="Contagem de visualizações / reproduções")
    like_count: int = Field(default=0, description="Contagem de curtidas")
    comment_count: int = Field(default=0, description="Contagem de comentários")
    share_count: int = Field(default=0, description="Contagem de compartilhamentos")
    save_count: int = Field(default=0, description="Contagem de salvamentos")
    
    # Métricas calculadas
    virality_score: float = Field(default=0.0, description="Pontuação de viralidade calculada (0 a 100)")
    engagement_rate: float = Field(default=0.0, description="Taxa de engajamento calculada")
    view_velocity: float = Field(default=0.0, description="Visualizações por hora")
    
    # Status de importação
    already_imported: bool = Field(default=False, description="Indica se o vídeo já foi importado para algum lote")
    imported_batch_id: Optional[str] = Field(default=None, description="ID do lote para o qual o vídeo foi importado")
    
    raw_metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadados brutos da plataforma")


class DiscoverySearchSummary(BaseModel):
    id: str = Field(..., description="ID único da busca assíncrona")
    platform: PlatformType = Field(..., description="Plataforma de busca")
    query: str = Field(..., description="Termo ou hashtag pesquisada")
    status: DiscoverySearchStatus = Field(default=DiscoverySearchStatus.QUEUED, description="Status do ciclo de vida da busca")
    total_found: int = Field(default=0, description="Total de itens minerados")
    created_at: str = Field(..., description="Timestamp ISO da criação")
    completed_at: Optional[str] = Field(default=None, description="Timestamp ISO da conclusão ou cancelamento")
    error_message: Optional[str] = Field(default=None, description="Mensagem de erro em caso de falha")


class DiscoverySearch(BaseModel):
    id: str = Field(..., description="ID único da busca assíncrona")
    platform: PlatformType = Field(..., description="Plataforma de busca")
    query: str = Field(..., description="Termo ou hashtag pesquisada")
    filter_params: DiscoveryFilter = Field(..., description="Parâmetros completos do filtro")
    status: DiscoverySearchStatus = Field(default=DiscoverySearchStatus.QUEUED, description="Status da busca")
    total_found: int = Field(default=0, description="Total de itens encontrados")
    items: List[DiscoveryItem] = Field(default_factory=list, description="Lista de vídeos minerados")
    created_at: str = Field(..., description="Timestamp ISO de criação")
    started_at: Optional[str] = Field(default=None, description="Timestamp ISO de início da execução")
    completed_at: Optional[str] = Field(default=None, description="Timestamp ISO de conclusão ou cancelamento")
    duration_seconds: Optional[float] = Field(default=None, description="Duração total da execução em segundos")
    error_message: Optional[str] = Field(default=None, description="Mensagem de erro caso status seja FAILED")

    def to_summary(self) -> DiscoverySearchSummary:
        """Convert full aggregate into summary representation."""
        return DiscoverySearchSummary(
            id=self.id,
            platform=self.platform,
            query=self.query,
            status=self.status,
            total_found=self.total_found,
            created_at=self.created_at,
            completed_at=self.completed_at,
            error_message=self.error_message,
        )


class DiscoveryResult(BaseModel):
    query: str
    platform: PlatformType
    total_found: int
    items: List[DiscoveryItem]
    cached: bool = False
    fetched_at: str
