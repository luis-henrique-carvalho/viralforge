export type PlatformType = 'instagram' | 'tiktok' | 'youtube'

export type SortOrder = 'virality_score' | 'view_count' | 'recent' | 'engagement_rate'

export type DiscoverySearchStatus = 'QUEUED' | 'SEARCHING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export interface ImportProvenance {
  search_id: string
  platform: PlatformType
  query: string
  discovered_item_id?: string | null
  virality_score?: number
}

export interface DiscoveryFilter {
  query: string
  platform?: PlatformType
  limit?: number
  min_views?: number | null
  max_age_days?: number | null
  min_duration_seconds?: number | null
  max_duration_seconds?: number | null
  sort_by?: SortOrder
}

export interface DiscoveryItem {
  id: string
  platform: PlatformType
  url: string
  title: string
  description?: string
  author_name?: string
  author_handle?: string
  author_avatar_url?: string | null
  published_at?: string | null
  published_timestamp?: number | null
  duration_seconds?: number | null
  thumbnail_url?: string | null
  view_count: number
  like_count: number
  comment_count: number
  share_count: number
  save_count?: number
  virality_score: number
  engagement_rate: number
  view_velocity: number
  already_imported?: boolean
  imported_batch_id?: string | null
  provenance?: ImportProvenance | null
  raw_metadata?: Record<string, unknown>
}

export interface DiscoverySearchSummary {
  id: string
  platform: PlatformType
  query: string
  status: DiscoverySearchStatus
  total_found: number
  created_at: string
  completed_at?: string | null
  error_message?: string | null
}

export interface DiscoverySearch {
  id: string
  platform: PlatformType
  query: string
  filter_params: DiscoveryFilter
  status: DiscoverySearchStatus
  total_found: number
  items: DiscoveryItem[]
  created_at: string
  started_at?: string | null
  completed_at?: string | null
  duration_seconds?: number | null
  error_message?: string | null
}

export interface DiscoveryResult {
  query: string
  platform: PlatformType
  total_found: number
  items: DiscoveryItem[]
  cached: boolean
  fetched_at: string
}

export interface PlatformInfo {
  id: PlatformType
  name: string
  icon: string
  description: string
  enabled: boolean
}

export interface DiscoveryPlatformsResponse {
  platforms: PlatformInfo[]
}
