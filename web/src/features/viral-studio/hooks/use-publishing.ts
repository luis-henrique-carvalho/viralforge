import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { viralStudioApi } from '../services/viral-studio.api'
import { viralStudioKeys } from '../services/viral-studio.keys'
import type { ViralPublishRequest } from '../data/publishing.types'

export function usePublishingAccounts() {
  return useQuery({
    queryKey: viralStudioKeys.publishingAccounts(),
    queryFn: () => viralStudioApi.fetchPublishingAccounts(),
    staleTime: 5 * 60 * 1000,
  })
}

export function usePreviewSlots(
  accountId: string,
  count: number,
  startDate?: string,
  preferredTime?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: viralStudioKeys.previewSlots(accountId, count, startDate, preferredTime),
    queryFn: () => viralStudioApi.previewPublishSlots(accountId, count, startDate, preferredTime),
    enabled: (options?.enabled ?? true) && Boolean(accountId) && count > 0,
    staleTime: 30 * 1000,
  })
}

export function usePublishItems(batchId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: ViralPublishRequest) => viralStudioApi.publishItems(request),
    onSuccess: () => {
      if (batchId) {
        queryClient.invalidateQueries({ queryKey: viralStudioKeys.batch(batchId) })
      }
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.batches() })
      queryClient.invalidateQueries({ queryKey: [...viralStudioKeys.all, 'publishing'] })
    },
  })
}

export function useCancelSchedule(batchId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (itemId: string) => viralStudioApi.cancelItemSchedule(itemId),
    onSuccess: () => {
      if (batchId) {
        queryClient.invalidateQueries({ queryKey: viralStudioKeys.batch(batchId) })
      }
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.batches() })
      queryClient.invalidateQueries({ queryKey: [...viralStudioKeys.all, 'publishing'] })
    },
  })
}
