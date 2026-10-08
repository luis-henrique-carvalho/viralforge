export type PublishingProvider = 'postiz' | 'zernio' | 'mock'
export type TranscriptionProvider = 'deepgram' | 'elevenlabs' | 'whisper'
export type ComputeBackend = 'CUDA' | 'ROCm/HIP' | 'CPU'

export interface SystemConfig {
  GEMINI_API_KEY?: string
  GEMINI_MODEL?: string
  DEFAULT_AI_MODEL?: string
  LM_STUDIO_BASE_URL?: string
  OLLAMA_BASE_URL?: string
  YOUTUBE_COOKIES?: string
  HF_TOKEN?: string
  DEEPGRAM_API_KEY?: string
  ELEVENLABS_API_KEY?: string
  TRANSCRIPTION_PROVIDER?: TranscriptionProvider
  PUBLISHING_PROVIDER?: PublishingProvider
  POSTIZ_BASE_URL?: string
  POSTIZ_API_KEY?: string
  TWITCH_CLIENT_ID?: string
  TWITCH_CLIENT_SECRET?: string
}

export interface HardwareTelemetry {
  device: string
  backend: ComputeBackend
  cuda_available: boolean
  device_name: string
  vram_gb: number
  total_ram_gb: number
  whisper_device: string
  whisper_model: string
}

export interface CookiesStatus {
  youtube: boolean
  instagram: boolean
  tiktok: boolean
  legacy: boolean
  configured: boolean
}

export interface ZernioConfigStatus {
  configured: boolean
  api_key_masked: string
  accounts: Record<string, string>
  timezone: string
}

export interface PostizConfigStatus {
  configured: boolean
  base_url: string
  api_key_masked: string
}

export interface PostizIntegrationItem {
  id: string
  platform: string
  name: string
  connected: boolean
  avatar_url?: string | null
  disabled?: boolean
}

export interface PostizIntegrationsResponse {
  integrations: PostizIntegrationItem[]
}

export interface LocalModelItem {
  id: string
  name: string
  provider: 'lm_studio' | 'ollama'
  group: string
}

export interface LocalModelsProviderInfo {
  online: boolean
  base_url: string
  models: Array<{ id: string; name: string }>
}

export interface LocalModelsResponse {
  lm_studio: LocalModelsProviderInfo
  ollama: LocalModelsProviderInfo
  models: LocalModelItem[]
}

export interface FontsResponse {
  fonts: string[]
}

export interface LogoStatusResponse {
  configured: boolean
}

export interface ZernioAccountItem {
  id: string
  _id?: string
  accountId?: string
  platform: 'tiktok' | 'instagram' | 'youtube' | string
  name?: string
  username?: string
  displayName?: string
  avatar_url?: string | null
  avatarUrl?: string | null
}

export type SettingsTab =
  'publishing' | 'ai-models' | 'transcription' | 'cookies' | 'hardware' | 'branding'
