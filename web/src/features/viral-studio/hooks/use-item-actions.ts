import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { viralStudioApi } from '../services/viral-studio.api'
import { viralStudioKeys } from '../services/viral-studio.keys'
import type { BatchResponse, ViralItem, ViralItemUpdate } from '../data/batch.types'

export function useApproveItem(batchId?: string) {
  const queryClient = useQueryClient()

  return useMutation<ViralItem, Error, string>({
    mutationFn: (itemId: string) => viralStudioApi.approveItem(itemId),
    onSuccess: (updatedItem) => {
      toast.success('Vídeo aprovado com sucesso!')
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.item(updatedItem.id) })
      if (batchId) {
        queryClient.invalidateQueries({ queryKey: viralStudioKeys.batch(batchId) })
      }
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.batches() })
    },
    onError: (error) => {
      toast.error('Erro ao aprovar vídeo', {
        description: error.message,
      })
    },
  })
}

export function useRetryItem(batchId?: string) {
  const queryClient = useQueryClient()

  return useMutation<ViralItem, Error, string>({
    mutationFn: (itemId: string) => viralStudioApi.retryItem(itemId),
    onSuccess: (updatedItem) => {
      toast.success('Vídeo reenviado para processamento!')
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.item(updatedItem.id) })
      if (batchId) {
        queryClient.invalidateQueries({ queryKey: viralStudioKeys.batch(batchId) })
      }
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.batches() })
    },
    onError: (error) => {
      toast.error('Erro ao reprocessar vídeo', {
        description: error.message,
      })
    },
  })
}

export function useCancelItem(batchId?: string) {
  const queryClient = useQueryClient()

  return useMutation<ViralItem, Error, string>({
    mutationFn: (itemId: string) => viralStudioApi.cancelItemProcessing(itemId),
    onSuccess: (updatedItem) => {
      toast.success('Processamento do vídeo cancelado!')
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.item(updatedItem.id) })
      const targetBatchId = batchId || updatedItem.batch_id
      if (targetBatchId) {
        queryClient.invalidateQueries({ queryKey: viralStudioKeys.batch(targetBatchId) })
      }
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.batches() })
    },
    onError: (error) => {
      toast.error('Erro ao cancelar processamento do vídeo', {
        description: error.message,
      })
    },
  })
}

export function useCancelBatch(batchId: string) {
  const queryClient = useQueryClient()

  return useMutation<BatchResponse, Error, void>({
    mutationFn: () => viralStudioApi.cancelBatchProcessing(batchId),
    onSuccess: () => {
      toast.success('Processamento do lote cancelado!')
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.batch(batchId) })
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.batches() })
    },
    onError: (error) => {
      toast.error('Erro ao cancelar lote', {
        description: error.message,
      })
    },
  })
}

export function useUpdateItem(batchId?: string) {
  const queryClient = useQueryClient()

  return useMutation<ViralItem, Error, { itemId: string; data: ViralItemUpdate }>({
    mutationFn: ({ itemId, data }) => viralStudioApi.updateItem(itemId, data),
    onSuccess: (updatedItem) => {
      toast.success('Informações do vídeo atualizadas!')
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.item(updatedItem.id) })
      if (batchId) {
        queryClient.invalidateQueries({ queryKey: viralStudioKeys.batch(batchId) })
      }
    },
    onError: (error) => {
      toast.error('Erro ao atualizar vídeo', {
        description: error.message,
      })
    },
  })
}

export function useBulkItemActions(batchId: string) {
  const approveMutation = useApproveItem(batchId)
  const retryMutation = useRetryItem(batchId)
  const cancelMutation = useCancelItem(batchId)

  const bulkApprove = async (itemIds: string[]) => {
    let succeeded = 0
    let failed = 0
    for (const id of itemIds) {
      try {
        await approveMutation.mutateAsync(id)
        succeeded++
      } catch {
        failed++
      }
    }
    if (succeeded > 0 && failed === 0) {
      toast.success(`${succeeded} vídeo(s) aprovado(s) com sucesso!`)
    } else if (failed > 0) {
      toast.warning(`Aprovação em massa concluída: ${succeeded} aprovados, ${failed} falharam.`)
    }
  }

  const bulkRetry = async (itemIds: string[]) => {
    let succeeded = 0
    let failed = 0
    for (const id of itemIds) {
      try {
        await retryMutation.mutateAsync(id)
        succeeded++
      } catch {
        failed++
      }
    }
    if (succeeded > 0 && failed === 0) {
      toast.success(`${succeeded} vídeo(s) reenviado(s) para reprocessamento!`)
    } else if (failed > 0) {
      toast.warning(`Reenvio concluído: ${succeeded} reenviados, ${failed} falharam.`)
    }
  }

  const bulkCancel = async (itemIds: string[]) => {
    let succeeded = 0
    let failed = 0
    for (const id of itemIds) {
      try {
        await cancelMutation.mutateAsync(id)
        succeeded++
      } catch {
        failed++
      }
    }
    if (succeeded > 0 && failed === 0) {
      toast.success(`${succeeded} vídeo(s) cancelado(s) com sucesso!`)
    } else if (failed > 0) {
      toast.warning(`Cancelamento em massa concluído: ${succeeded} cancelados, ${failed} falharam.`)
    }
  }

  return {
    bulkApprove,
    bulkRetry,
    bulkCancel,
    isProcessing: approveMutation.isPending || retryMutation.isPending || cancelMutation.isPending,
  }
}
