import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { discoveryApi } from '../services/discovery.api'
import type { DiscoveryFilter, DiscoveryResult } from '../data/discovery.types'

export const discoveryKeys = {
  all: ['discovery'] as const,
  platforms: () => [...discoveryKeys.all, 'platforms'] as const,
  search: (filter: DiscoveryFilter) => [...discoveryKeys.all, 'search', filter] as const,
}

export function useDiscoveryPlatforms() {
  return useQuery({
    queryKey: discoveryKeys.platforms(),
    queryFn: () => discoveryApi.fetchPlatforms(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
}

export function useDiscoverySearch() {
  return useMutation<DiscoveryResult, Error, DiscoveryFilter>({
    mutationFn: (filter: DiscoveryFilter) => discoveryApi.search(filter),
    onError: (error: Error) => {
      toast.error('Erro ao buscar vídeos', {
        description: error.message || 'Falha na conexão com o serviço de descoberta',
      })
    },
  })
}
