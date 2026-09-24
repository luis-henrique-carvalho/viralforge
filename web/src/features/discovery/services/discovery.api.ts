import { apiClient } from '@/api/client'
import type {
  DiscoveryFilter,
  DiscoveryPlatformsResponse,
  DiscoveryResult,
} from '../data/discovery.types'

export const discoveryApi = {
  async fetchPlatforms(): Promise<DiscoveryPlatformsResponse> {
    const response = await apiClient.get<DiscoveryPlatformsResponse>('/discovery/platforms')
    return response.data
  },

  async search(params: DiscoveryFilter): Promise<DiscoveryResult> {
    const response = await apiClient.post<DiscoveryResult>('/discovery/search', params)
    return response.data
  },
}
