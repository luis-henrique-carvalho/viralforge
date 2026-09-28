import { apiClient } from '@/api/client'
import type {
  TemplateCreate,
  TemplateListResponse,
  TemplateUpdate,
  TestGenerationRequest,
  TestGenerationResponse,
  VisualTemplate,
} from '../data/template.types'

export const templateApi = {
  async fetchTemplates(): Promise<TemplateListResponse> {
    const response = await apiClient.get<TemplateListResponse>('/viral-studio/templates')
    return response.data
  },

  async fetchTemplate(id: string): Promise<VisualTemplate> {
    const response = await apiClient.get<VisualTemplate>(`/viral-studio/templates/${id}`)
    return response.data
  },

  async createTemplate(data: TemplateCreate): Promise<VisualTemplate> {
    const response = await apiClient.post<VisualTemplate>('/viral-studio/templates', data)
    return response.data
  },

  async updateTemplate(id: string, data: TemplateUpdate): Promise<VisualTemplate> {
    const response = await apiClient.patch<VisualTemplate>(`/viral-studio/templates/${id}`, data)
    return response.data
  },

  async replaceTemplate(id: string, data: TemplateCreate): Promise<VisualTemplate> {
    const response = await apiClient.put<VisualTemplate>(`/viral-studio/templates/${id}`, data)
    return response.data
  },

  async deleteTemplate(id: string): Promise<void> {
    await apiClient.delete(`/viral-studio/templates/${id}`)
  },

  async duplicateTemplate(id: string): Promise<VisualTemplate> {
    const response = await apiClient.post<VisualTemplate>(`/viral-studio/templates/${id}/duplicate`)
    return response.data
  },

  async resetDefaultTemplates(): Promise<TemplateListResponse> {
    const response = await apiClient.post<TemplateListResponse>(
      '/viral-studio/templates/reset-defaults',
    )
    return response.data
  },

  async testTemplateGeneration(data: TestGenerationRequest): Promise<TestGenerationResponse> {
    const response = await apiClient.post<TestGenerationResponse>(
      '/viral-studio/templates/test-generation',
      data,
    )
    return response.data
  },

  async uploadExtraImage(id: string, file: File): Promise<VisualTemplate> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post<VisualTemplate>(
      `/viral-studio/templates/${id}/extra-image`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return response.data
  },
}
