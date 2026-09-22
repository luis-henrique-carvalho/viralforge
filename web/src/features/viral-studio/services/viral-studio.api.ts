import { apiClient } from '@/api/client'
import type {
  BatchCreateRequest,
  BatchListResponse,
  BatchResponse,
  Brand,
  BrandCreate,
  BrandListResponse,
  BrandUpdate,
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

  // Templates
  async fetchTemplates(): Promise<TemplateListResponse> {
    const response = await apiClient.get<TemplateListResponse>('/viral-studio/templates')
    return response.data
  },

  async fetchTemplate(id: string): Promise<VisualTemplate> {
    const response = await apiClient.get<VisualTemplate>(`/viral-studio/templates/${id}`)
    return response.data
  },

  // Publishing
  async fetchPublishingAccounts(): Promise<SocialAccount[]> {
    const response = await apiClient.get<SocialAccount[]>('/viral-studio/publishing/accounts')
    return response.data
  },

  async previewPublishSlots(
    accountId: string,
    count: number,
    startDate?: string,
    preferredTime?: string,
  ): Promise<PreviewSlotsResponse> {
    const params = new URLSearchParams()
    params.set('account_id', accountId)
    params.set('count', String(count))
    if (startDate) params.set('start_date', startDate)
    if (preferredTime) params.set('preferred_time', preferredTime)

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
}
