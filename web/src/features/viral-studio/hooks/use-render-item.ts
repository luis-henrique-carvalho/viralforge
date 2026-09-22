import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { viralStudioApi } from '../services/viral-studio.api'
import { viralStudioKeys } from '../services/viral-studio.keys'
import type { ViralItem } from '../data/batch.types'

interface RenderItemVariables {
  itemId: string
  headline?: string
  template_id?: string
  watermark?: boolean
}

export function useRenderItem(batchId?: string) {
  const queryClient = useQueryClient()

  return useMutation<ViralItem, Error, RenderItemVariables>({
    mutationFn: ({ itemId, headline, template_id, watermark }) =>
      viralStudioApi.renderItem(itemId, {
        headline: headline?.trim() || undefined,
        template_id: template_id || undefined,
        watermark,
      }),
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.batches() })
      if (batchId) {
        queryClient.invalidateQueries({ queryKey: viralStudioKeys.batch(batchId) })
      }
      queryClient.setQueryData<ViralItem>(viralStudioKeys.item(updatedItem.id), updatedItem)
      toast.success('Re-renderização iniciada em segundo plano!')
    },
    onError: (err) => {
      toast.error(`Erro ao re-renderizar: ${err.message}`)
    },
  })
}
