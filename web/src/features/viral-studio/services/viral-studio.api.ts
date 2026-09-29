import { apiClient } from '@/api/client'
import { brandApi } from '@/features/brands'
import type {
  BatchCreateRequest,
  BatchListResponse,
  BatchResponse,
  BrandCreate,
  BrandUpdate,
  ScheduledPost,
  ScheduleSlotsUpdate,
  TemplateListResponse,
  ViralItem,
  ViralItemUpdate,
  VisualTemplate,
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

  // Brands (delegated to sovereign domain @/features/brands)
  fetchBrands: () => brandApi.fetchBrands(),
  fetchBrand: (id: string) => brandApi.fetchBrand(id),
  createBrand: (data: BrandCreate) => brandApi.createBrand(data),
  updateBrand: (id: string, data: BrandUpdate) => brandApi.updateBrand(id, data),
  fetchBrandWorkspace: (brandId: string) => brandApi.fetchBrandWorkspace(brandId),
  fetchBrandChannels: (brandId: string) => brandApi.fetchBrandChannels(brandId),
  fetchAvailableBrandChannels: (brandId: string) => brandApi.fetchAvailableBrandChannels(brandId),
  bindBrandChannels: (brandId: string, payload: { channel_ids: string[]; workspace_id?: string }) =>
    brandApi.bindBrandChannels(brandId, payload),
  getBrandConnectUrl: (brandId: string) => brandApi.getBrandConnectUrl(brandId),
  fetchBrandVideos: (brandId: string, status?: string) =>
    brandApi.fetchBrandVideos(brandId, status),
  autoScheduleBrandVideo: (brandId: string, itemId: string, channelIds?: string[]) =>
    brandApi.autoScheduleBrandVideo(brandId, itemId, channelIds),
  publishBrandVideo: (
    brandId: string,
    payload: {
      item_id: string
      channel_ids?: string[]
      scheduled_for?: string
      publish_now?: boolean
    },
  ) => brandApi.publishBrandVideo(brandId, payload),
  fetchBrandScheduled: (brandId: string, startDate?: string, endDate?: string) =>
    brandApi.fetchBrandScheduled(brandId, startDate, endDate),
  cancelBrandScheduledPost: (brandId: string, postId: string) =>
    brandApi.cancelBrandScheduledPost(brandId, postId),
  publishBrandScheduledNow: (brandId: string, postId: string) =>
    brandApi.publishBrandScheduledNow(brandId, postId),
  updateBrandScheduleSlots: (brandId: string, payload: ScheduleSlotsUpdate) =>
    brandApi.updateBrandScheduleSlots(brandId, payload),
  fetchPublishingWorkspaces: (provider?: string) => brandApi.fetchPublishingWorkspaces(provider),

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
