import { apiClient } from '@/api/client'
import type {
  Brand,
  BrandCreate,
  BrandListResponse,
  BrandUpdate,
  BrandWorkspaceSummary,
  ScheduleSlotsUpdate,
  ScheduledPost,
  SocialChannel,
  WorkspaceSummary,
} from '../data/brand.types'
import type { ViralItem } from '@/features/viral-studio/data/batch.types'

export interface BrandAutoScheduleResponse {
  success: boolean
  job_id?: string
  item_id: string
  brand_id: string
  status: string
  scheduled_for?: string
  channels_count: number
  receipts: Array<Record<string, unknown>>
}

export interface BrandPublishResponse {
  success: boolean
  job_id?: string
  item_id: string
  brand_id: string
  status: string
  scheduled_for?: string
  channels_count: number
  receipts: Array<Record<string, unknown>>
}

export interface ScheduledTimelineResponse {
  brand_id?: string
  posts: ScheduledPost[]
  total: number
}

export const brandApi = {
  // Brand CRUD
  async fetchBrands(): Promise<BrandListResponse> {
    const response = await apiClient.get<BrandListResponse>('/viral-studio/brands')
    return response.data
  },

  async fetchBrand(id: string): Promise<Brand> {
    const response = await apiClient.get<Brand>(`/viral-studio/brands/${id}`)
    return response.data
  },

  async createBrand(data: BrandCreate): Promise<Brand> {
    const response = await apiClient.post<Brand>('/viral-studio/brands', data)
    return response.data
  },

  async updateBrand(id: string, data: BrandUpdate): Promise<Brand> {
    const response = await apiClient.patch<Brand>(`/viral-studio/brands/${id}`, data)
    return response.data
  },

  // Brand Workspace
  async fetchBrandWorkspace(brandId: string): Promise<BrandWorkspaceSummary> {
    const response = await apiClient.get<BrandWorkspaceSummary>(
      `/viral-studio/brands/${brandId}/workspace`,
    )
    return response.data
  },

  async fetchBrandChannels(brandId: string): Promise<SocialChannel[]> {
    const response = await apiClient.get<SocialChannel[]>(
      `/viral-studio/brands/${brandId}/channels`,
    )
    return response.data
  },

  async fetchAvailableBrandChannels(brandId: string): Promise<SocialChannel[]> {
    const response = await apiClient.get<SocialChannel[]>(
      `/viral-studio/brands/${brandId}/channels/available`,
    )
    return response.data
  },

  async bindBrandChannels(
    brandId: string,
    payload: { channel_ids: string[]; workspace_id?: string },
  ): Promise<Brand> {
    const response = await apiClient.post<Brand>(
      `/viral-studio/brands/${brandId}/channels/bind`,
      payload,
    )
    return response.data
  },

  async getBrandConnectUrl(brandId: string): Promise<{ url: string | null }> {
    const response = await apiClient.post<{ url: string | null }>(
      `/viral-studio/brands/${brandId}/channels/connect-url`,
    )
    return response.data
  },

  async fetchBrandVideos(brandId: string, status?: string): Promise<ViralItem[]> {
    const params = new URLSearchParams()
    if (status && status !== 'all') params.set('status', status)
    const url = `/viral-studio/brands/${brandId}/videos${params.toString() ? `?${params.toString()}` : ''}`
    const response = await apiClient.get<ViralItem[]>(url)
    return response.data
  },

  async autoScheduleBrandVideo(
    brandId: string,
    itemId: string,
    channelIds?: string[],
  ): Promise<BrandAutoScheduleResponse> {
    const response = await apiClient.post<BrandAutoScheduleResponse>(
      `/viral-studio/brands/${brandId}/auto-schedule`,
      { item_id: itemId, channel_ids: channelIds },
    )
    return response.data
  },

  async publishBrandVideo(
    brandId: string,
    payload: {
      item_id: string
      channel_ids?: string[]
      scheduled_for?: string
      publish_now?: boolean
    },
  ): Promise<BrandPublishResponse> {
    const response = await apiClient.post<BrandPublishResponse>(
      `/viral-studio/brands/${brandId}/publish`,
      payload,
    )
    return response.data
  },

  async fetchBrandScheduled(
    brandId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ScheduledTimelineResponse> {
    const params = new URLSearchParams()
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    const url = `/viral-studio/brands/${brandId}/scheduled${params.toString() ? `?${params.toString()}` : ''}`
    const response = await apiClient.get<ScheduledTimelineResponse>(url)
    return response.data
  },

  async cancelBrandScheduledPost(
    brandId: string,
    postId: string,
  ): Promise<{ success: boolean; post_id: string }> {
    const response = await apiClient.delete<{ success: boolean; post_id: string }>(
      `/viral-studio/brands/${brandId}/scheduled/${postId}`,
    )
    return response.data
  },

  async publishBrandScheduledNow(
    brandId: string,
    postId: string,
  ): Promise<{ success: boolean; job_id?: string; item_id?: string; message?: string }> {
    const response = await apiClient.post<{
      success: boolean
      job_id?: string
      item_id?: string
      message?: string
    }>(`/viral-studio/brands/${brandId}/scheduled/${postId}/publish-now`)
    return response.data
  },

  async updateBrandScheduleSlots(brandId: string, payload: ScheduleSlotsUpdate): Promise<Brand> {
    const response = await apiClient.post<Brand>(
      `/viral-studio/brands/${brandId}/schedule-slots`,
      payload,
    )
    return response.data
  },

  async fetchPublishingWorkspaces(provider?: string): Promise<WorkspaceSummary[]> {
    const url = provider
      ? `/viral-studio/publishing/workspaces?provider=${encodeURIComponent(provider)}`
      : '/viral-studio/publishing/workspaces'
    const response = await apiClient.get<WorkspaceSummary[]>(url)
    return response.data
  },
}
