export type SocialPlatform = 'tiktok' | 'instagram' | 'youtube'

export interface SocialAccount {
  id: string
  name: string
  platform: SocialPlatform | string
  avatar_url?: string | null
  connected: boolean
}

export interface SlotProjection {
  index: number
  datetime: string
  formatted: string
}

export interface PreviewSlotsResponse {
  account_id: string
  account_name?: string | null
  count: number
  last_scheduled_slot?: string | null
  projected_slots: SlotProjection[]
}

export type PublishMode = 'now' | 'auto'

export interface ViralPublishPlatform {
  platform: string
  accountId: string
  platformSpecificData?: Record<string, unknown>
}

export interface ViralPublishRequest {
  item_ids: string[]
  platforms: ViralPublishPlatform[]
  schedule_mode: PublishMode
  scheduled_for?: string | null
  timezone?: string
  start_date?: string
}

export interface ViralPublishResult {
  item_id: string
  status: string
  post_id?: string | null
  platform_post_id?: string | null
  published_at?: string | null
  scheduled_for?: string | null
  post_url?: string | null
  error?: string | null
}

export interface ViralPublishResponse {
  results: ViralPublishResult[]
  total: number
  successful: number
  failed: number
}
