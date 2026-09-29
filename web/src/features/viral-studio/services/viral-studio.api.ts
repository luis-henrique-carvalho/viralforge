import { apiClient } from '@/api/client'
import type {
  BatchCreateRequest,
  BatchListResponse,
  BatchResponse,
  Brand,
  BrandCreate,
  BrandListResponse,
  BrandUpdate,
  BrandWorkspaceSummary,
  ScheduledPost,
  ScheduleSlotsUpdate,
  SocialChannel,
  TemplateListResponse,
  ViralItem,
  ViralItemUpdate,
  VisualTemplate,
  WorkspaceSummary,
} from '../data/batch.types'
import type {
  PreviewSlotsResponse,
  SocialAccount,
  ViralPublishRequest,
  ViralPublishResponse,
} from '../data/publishing.types'

export interface BrandAutoScheduleResponse {
  success: boolean
  item_id: string
  receipts: Array<{
    item_id: string
    post_id: string
    account_id?: string
    status: string
    scheduled_time?: string
    external_url?: string
    provider?: string
  }>
}

export interface BrandPublishResponse {
  success: boolean
  item_id: string
  receipts: Array<{
    item_id: string
    post_id: string
    account_id?: string
    status: string
    scheduled_time?: string
    external_url?: string
    provider?: string
  }>
}

export interface ScheduledTimelineResponse {
  brand_id: string
  posts: ScheduledPost[]
  total: number
}

export interface DispatchJobRecord {
  job_id: string
  item_id: string
  brand_id: string
  brand_name?: string
  channel_ids: string[]
  channel_names?: string[]
  provider: string
  status: 'QUEUED' | 'UPLOADING' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED' | 'PARTIAL_FAILED' | string
  scheduled_for?: string
  publish_now: boolean
  title?: string
  caption?: string
  video_path?: string
  thumbnail_url?: string
  created_at: string
  updated_at: string
  receipts: Array<{
    id?: string
    post_id?: string
    channel_id?: string
    status: string
    error?: string
    scheduled_for?: string
    post_url?: string
  }>
  error?: string
}

export interface DispatchQueueResponse {
  jobs: DispatchJobRecord[]
  total: number
  active_count: number
  failed_count: number
}

export const viralStudioApi = {
  // Batches
  async fetchBatches(): Promise<BatchListResponse> {
    const response = await apiClient.get<BatchListResponse>('/viral-studio/batches')
    return response.data
  },

  async fetchBatch(id: string): Promise<BatchResponse> {
    const response = await apiClient.get<BatchResponse>(`/viral-studio/batches/${id}`)
    return response.data
  },

  async createBatch(data: BatchCreateRequest): Promise<BatchResponse> {
    const response = await apiClient.post<BatchResponse>('/viral-studio/batches', data)
    return response.data
  },

  async cancelBatchProcessing(batchId: string): Promise<BatchResponse> {
    const response = await apiClient.post<BatchResponse>(`/viral-studio/batches/${batchId}/cancel`)
    return response.data
  },

  // Items
  async fetchItem(id: string): Promise<ViralItem> {
    const response = await apiClient.get<ViralItem>(`/viral-studio/items/${id}`)
    return response.data
  },

  async updateItem(id: string, data: ViralItemUpdate): Promise<ViralItem> {
    const response = await apiClient.patch<ViralItem>(`/viral-studio/items/${id}`, data)
    return response.data
  },

  async approveItem(itemId: string): Promise<ViralItem> {
    const response = await apiClient.post<ViralItem>(`/viral-studio/items/${itemId}/approve`)
    return response.data
  },

  async retryItem(itemId: string): Promise<ViralItem> {
    const response = await apiClient.post<ViralItem>(`/viral-studio/items/${itemId}/retry`)
    return response.data
  },

  async cancelItemProcessing(itemId: string): Promise<ViralItem> {
    const response = await apiClient.post<ViralItem>(`/viral-studio/items/${itemId}/cancel`)
    return response.data
  },

  async renderItem(
    id: string,
    payload: { headline?: string; template_id?: string; watermark?: boolean },
  ): Promise<ViralItem> {
    const response = await apiClient.post<ViralItem>(`/viral-studio/items/${id}/render`, payload)
    return response.data
  },

  async regenerateItemCopy(
    id: string,
    payload?: { model?: string; manual_instructions?: string },
  ): Promise<ViralItem> {
    const response = await apiClient.post<ViralItem>(
      `/viral-studio/items/${id}/regenerate-copy`,
      payload || {},
    )
    return response.data
  },

  // Brands
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

  // Templates
  async fetchTemplates(): Promise<TemplateListResponse> {
    const response = await apiClient.get<TemplateListResponse>('/viral-studio/templates')
    return response.data
  },

  async fetchTemplate(id: string): Promise<VisualTemplate> {
    const response = await apiClient.get<VisualTemplate>(`/viral-studio/templates/${id}`)
    return response.data
  },

  // Publishing (legacy)
  async fetchPublishingAccounts(): Promise<SocialAccount[]> {
    const response = await apiClient.get<SocialAccount[]>('/viral-studio/publishing/accounts')
    return response.data
  },

  async previewPublishSlots(
    accountId: string,
    count: number,
    startDate?: string,
    preferredTime?: string,
    brandId?: string,
  ): Promise<PreviewSlotsResponse> {
    const params = new URLSearchParams()
    params.set('account_id', accountId)
    params.set('count', String(count))
    if (startDate) params.set('start_date', startDate)
    if (preferredTime) params.set('preferred_time', preferredTime)
    if (brandId) params.set('brand_id', brandId)

    const response = await apiClient.get<PreviewSlotsResponse>(
      `/viral-studio/publishing/preview-slots?${params.toString()}`,
    )
    return response.data
  },

  async publishItems(request: ViralPublishRequest): Promise<ViralPublishResponse> {
    const response = await apiClient.post<ViralPublishResponse>('/viral-studio/publish', request)
    return response.data
  },

  async cancelItemSchedule(itemId: string): Promise<ViralItem> {
    const response = await apiClient.post<ViralItem>(`/viral-studio/publishing/${itemId}/cancel`)
    return response.data
  },

  // Publishing Queue & Outbox Dispatches
  async fetchPublishingQueue(brandId?: string, status?: string): Promise<DispatchQueueResponse> {
    const params = new URLSearchParams()
    if (brandId) params.set('brand_id', brandId)
    if (status) params.set('status', status)
    const url = `/viral-studio/publishing/queue${params.toString() ? `?${params.toString()}` : ''}`
    const response = await apiClient.get<DispatchQueueResponse>(url)
    return response.data
  },

  async retryPublishingDispatch(
    jobId: string,
  ): Promise<{ success: boolean; job_id: string; message: string }> {
    const response = await apiClient.post<{ success: boolean; job_id: string; message: string }>(
      `/viral-studio/publishing/queue/retry/${jobId}`,
    )
    return response.data
  },
}
