import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { viralStudioApi } from '../services/viral-studio.api'
import { viralStudioKeys } from '../services/viral-studio.keys'
import type { BatchCreateRequest, BatchResponse } from '../data/batch.types'

export function useCreateBatch() {
  const queryClient = useQueryClient()

  return useMutation<BatchResponse, Error, BatchCreateRequest>({
    mutationFn: (data: BatchCreateRequest) => viralStudioApi.createBatch(data),
    onSuccess: (batch) => {
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.batches() })
      toast.success('Lote criado com sucesso!', {
        description: `${batch.items?.length || 0} vídeo(s) adicionado(s) à fila de processamento.`,
      })
    },
    onError: (error) => {
      toast.error('Erro ao criar lote', {
        description: error.message || 'Verifique as URLs e parâmetros informados.',
      })
    },
  })
}
