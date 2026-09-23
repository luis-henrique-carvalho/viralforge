import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { viralStudioApi } from '../services/viral-studio.api'
import { viralStudioKeys } from '../services/viral-studio.keys'
import type { ViralItem } from '../data/batch.types'

interface RegenerateCopyVariables {
  itemId: string
  model?: string
  manual_instructions?: string
}

export function useRegenerateCopy(batchId?: string) {
  const queryClient = useQueryClient()

  return useMutation<ViralItem, Error, RegenerateCopyVariables>({
    mutationFn: ({ itemId, model, manual_instructions }) =>
      viralStudioApi.regenerateItemCopy(itemId, {
        model: model || undefined,
        manual_instructions: manual_instructions?.trim() || undefined,
      }),
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.batches() })
      if (batchId) {
        queryClient.invalidateQueries({ queryKey: viralStudioKeys.batch(batchId) })
      }
      queryClient.setQueryData<ViralItem>(viralStudioKeys.item(updatedItem.id), updatedItem)
      toast.success('Copy comercial regerada com sucesso!')
    },
    onError: (err) => {
      toast.error(`Erro ao regerar copy: ${err.message}`)
    },
  })
}
