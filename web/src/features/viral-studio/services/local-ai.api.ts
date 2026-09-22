import { apiClient } from '@/api/client'
import type { LocalAIResponse } from '../data/local-ai.types'

export const localAiApi = {
  async fetchLocalAIModels(): Promise<LocalAIResponse> {
    const response = await apiClient.get<LocalAIResponse>('/config/local-models')
    return response.data
  },
}
