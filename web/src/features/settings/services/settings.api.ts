import { apiClient } from '@/api/client'
import type {
  CookiesStatus,
  FontsResponse,
  HardwareTelemetry,
  LocalModelsResponse,
  LogoStatusResponse,
  SystemConfig,
  ZernioAccountItem,
  ZernioConfigStatus,
} from '../data/settings.types'

export const settingsApi = {
  fetchConfig: async (): Promise<SystemConfig> => {
    const { data } = await apiClient.get<SystemConfig>('/config')
    return data
  },

  updateConfig: async (
    keys: Record<string, string>,
  ): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.post<{
      success: boolean
      message: string
    }>('/config', { keys })
    return data
  },

  fetchHardware: async (): Promise<HardwareTelemetry> => {
    const { data } = await apiClient.get<HardwareTelemetry>('/config/hardware')
    return data
  },

  fetchZernioConfig: async (): Promise<ZernioConfigStatus> => {
    const { data } = await apiClient.get<ZernioConfigStatus>('/config/zernio')
    return data
  },

  updateZernioConfig: async (payload: {
    api_key?: string
    accounts?: Record<string, string>
    timezone?: string
  }): Promise<ZernioConfigStatus> => {
    const { data } = await apiClient.post<ZernioConfigStatus>('/config/zernio', payload)
    return data
  },

  discoverZernioAccounts: async (): Promise<{
    accounts: ZernioAccountItem[]
  }> => {
    const { data } = await apiClient.get<{ accounts: ZernioAccountItem[] }>('/zernio/accounts')
    return data
  },

  fetchCookiesStatus: async (): Promise<CookiesStatus> => {
    const { data } = await apiClient.get<CookiesStatus>('/config/cookies/status')
    return data
  },

  uploadPlatformCookies: async (
    platform: string,
    file: File,
  ): Promise<{ status: string; message: string }> => {
    const formData = new FormData()
    formData.append('cookies_file', file)
    const { data } = await apiClient.post<{ status: string; message: string }>(
      `/config/cookies/${platform}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )
    return data
  },

  deletePlatformCookies: async (platform: string): Promise<{ status: string; message: string }> => {
    const { data } = await apiClient.delete<{
      status: string
      message: string
    }>(`/config/cookies/${platform}`)
    return data
  },

  fetchLocalModels: async (): Promise<LocalModelsResponse> => {
    const { data } = await apiClient.get<LocalModelsResponse>('/config/local-models')
    return data
  },

  fetchGeminiModels: async (apiKey?: string): Promise<string[]> => {
    const headers: Record<string, string> = {}
    if (apiKey) {
      headers['X-Gemini-Key'] = apiKey
    }
    const { data } = await apiClient.get<string[]>('/config/models', {
      headers,
    })
    return data
  },

  fetchFonts: async (): Promise<FontsResponse> => {
    const { data } = await apiClient.get<FontsResponse>('/config/fonts')
    return data
  },

  uploadFont: async (file: File): Promise<{ status: string; name: string; fonts: string[] }> => {
    const formData = new FormData()
    formData.append('font_file', file)
    const { data } = await apiClient.post<{
      status: string
      name: string
      fonts: string[]
    }>('/config/fonts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  },

  deleteFont: async (name: string): Promise<{ status: string; fonts: string[] }> => {
    const { data } = await apiClient.delete<{
      status: string
      fonts: string[]
    }>(`/config/fonts/${encodeURIComponent(name)}`)
    return data
  },

  fetchLogoStatus: async (): Promise<LogoStatusResponse> => {
    const { data } = await apiClient.get<LogoStatusResponse>('/config/logo/status')
    return data
  },

  uploadLogo: async (file: File): Promise<{ status: string; message: string }> => {
    const formData = new FormData()
    formData.append('logo_file', file)
    const { data } = await apiClient.post<{ status: string; message: string }>(
      '/config/logo',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )
    return data
  },

  deleteLogo: async (): Promise<{ status: string; message: string }> => {
    const { data } = await apiClient.delete<{
      status: string
      message: string
    }>('/config/logo')
    return data
  },
}
