import { apiClient } from '@/api/client'
import type {
  DiscoveryFilter,
  DiscoveryPlatformsResponse,
  DiscoveryResult,
  DiscoverySearch,
  DiscoverySearchSummary,
} from '../data/discovery.types'

export const discoveryApi = {
  async fetchPlatforms(): Promise<DiscoveryPlatformsResponse> {
    const response = await apiClient.get<DiscoveryPlatformsResponse>('/discovery/platforms')
    return response.data
  },

  async search(params: DiscoveryFilter): Promise<DiscoveryResult> {
    const response = await apiClient.post<DiscoveryResult>('/discovery/search', params, {
      timeout: 180000,
    })
    return response.data
  },

  async createSearch(params: DiscoveryFilter): Promise<DiscoverySearchSummary> {
    const response = await apiClient.post<DiscoverySearchSummary>('/discovery/searches', params)
    return response.data
  },

  async cancelSearch(searchId: string): Promise<DiscoverySearchSummary> {
    const response = await apiClient.post<DiscoverySearchSummary>(
      `/discovery/searches/${searchId}/cancel`,
    )
    return response.data
  },

  async fetchSearches(): Promise<DiscoverySearchSummary[]> {
    const response = await apiClient.get<DiscoverySearchSummary[]>('/discovery/searches')
    return response.data
  },

  async fetchSearch(searchId: string): Promise<DiscoverySearch> {
    const response = await apiClient.get<DiscoverySearch>(`/discovery/searches/${searchId}`)
    return response.data
  },

  async deleteSearch(searchId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/discovery/searches/${searchId}`)
    return response.data
  },
}
