import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { discoveryApi } from '../services/discovery.api'
import type {
  DiscoveryFilter,
  DiscoveryResult,
  DiscoverySearch,
  DiscoverySearchSummary,
} from '../data/discovery.types'

export const discoveryKeys = {
  all: ['discovery'] as const,
  platforms: () => [...discoveryKeys.all, 'platforms'] as const,
  searches: () => [...discoveryKeys.all, 'searches'] as const,
  searchDetail: (id: string | null) => [...discoveryKeys.all, 'searchDetail', id] as const,
  search: (filter: DiscoveryFilter) => [...discoveryKeys.all, 'search', filter] as const,
}

export function useDiscoveryPlatforms() {
  return useQuery({
    queryKey: discoveryKeys.platforms(),
    queryFn: () => discoveryApi.fetchPlatforms(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
}

export function useDiscoverySearches() {
  return useQuery({
    queryKey: discoveryKeys.searches(),
    queryFn: () => discoveryApi.fetchSearches(),
    refetchInterval: (query) => {
      const data = query.state.data
      const hasActive = data?.some((s) => s.status === 'QUEUED' || s.status === 'SEARCHING')
      return hasActive ? 2000 : false
    },
  })
}

export function useDiscoverySearchDetail(searchId: string | null) {
  return useQuery<DiscoverySearch, Error>({
    queryKey: discoveryKeys.searchDetail(searchId),
    queryFn: async () => {
      if (!searchId) throw new Error('ID da busca não fornecido')
      return discoveryApi.fetchSearch(searchId)
    },
    enabled: !!searchId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'QUEUED' || status === 'SEARCHING' ? 1500 : false
    },
  })
}

export function useCreateDiscoverySearch() {
  const queryClient = useQueryClient()

  return useMutation<DiscoverySearchSummary, Error, DiscoveryFilter>({
    mutationFn: (filter: DiscoveryFilter) => discoveryApi.createSearch(filter),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: discoveryKeys.searches() })
      toast.success('Busca de descoberta iniciada', {
        description: `Minerando vídeos para "${data.query}"...`,
      })
    },
    onError: (error: Error) => {
      toast.error('Erro ao iniciar busca', {
        description: error.message || 'Falha na conexão com o servidor',
      })
    },
  })
}

export function useCancelDiscoverySearch() {
  const queryClient = useQueryClient()

  return useMutation<DiscoverySearchSummary, Error, string>({
    mutationFn: (searchId: string) => discoveryApi.cancelSearch(searchId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: discoveryKeys.searches() })
      queryClient.invalidateQueries({ queryKey: discoveryKeys.searchDetail(data.id) })
      toast.info('Busca cancelada', {
        description: `A busca por "${data.query}" foi interrompida.`,
      })
    },
    onError: (error: Error) => {
      toast.error('Erro ao cancelar busca', {
        description: error.message || 'Falha ao solicitar cancelamento',
      })
    },
  })
}

export function useDeleteDiscoverySearch() {
  const queryClient = useQueryClient()

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (searchId: string) => discoveryApi.deleteSearch(searchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discoveryKeys.searches() })
      toast.success('Busca removida do histórico')
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir busca', {
        description: error.message || 'Falha ao remover busca',
      })
    },
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
