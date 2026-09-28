import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { viralStudioApi, type DispatchQueueResponse } from '../services/viral-studio.api'

export const publishingQueueKeys = {
  all: ['viral-studio', 'publishing-queue'] as const,
  list: (brandId?: string, status?: string) =>
    ['viral-studio', 'publishing-queue', { brandId, status }] as const,
}

export function usePublishingQueue(options?: {
  brandId?: string
  status?: string
  refetchInterval?: number
}) {
  const { brandId, status, refetchInterval = 4000 } = options || {}

  return useQuery<DispatchQueueResponse>({
    queryKey: publishingQueueKeys.list(brandId, status),
    queryFn: () => viralStudioApi.fetchPublishingQueue(brandId, status),
    refetchInterval: (query) => {
      // If there are active/uploading jobs, poll more frequently
      const data = query.state.data
      if (data && data.active_count > 0) {
        return 2000
      }
      return refetchInterval
    },
  })
}

export function useRetryPublishingDispatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobId: string) => viralStudioApi.retryPublishingDispatch(jobId),
    onSuccess: (data) => {
      toast.success(data.message || 'Envio re-enfileirado com sucesso!')
      queryClient.invalidateQueries({ queryKey: publishingQueueKeys.all })
      queryClient.invalidateQueries({ queryKey: ['viral-studio'] })
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } }; message?: string }
      const msg = err?.response?.data?.detail || err?.message || 'Erro ao retentar envio'
      toast.error(`Falha ao retentar: ${msg}`)
    },
  })
}
