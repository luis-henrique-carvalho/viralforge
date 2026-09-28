import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { viralStudioApi } from '../services/viral-studio.api'
import { viralStudioKeys } from '../services/viral-studio.keys'
import type { BrandUpdate, ScheduleSlotsUpdate } from '../data/batch.types'

export function useBrandWorkspace(brandId: string) {
  return useQuery({
    queryKey: viralStudioKeys.brandWorkspace(brandId),
    queryFn: () => viralStudioApi.fetchBrandWorkspace(brandId),
    enabled: Boolean(brandId),
  })
}

export function useBrandChannels(brandId: string) {
  return useQuery({
    queryKey: viralStudioKeys.brandChannels(brandId),
    queryFn: () => viralStudioApi.fetchBrandChannels(brandId),
    enabled: Boolean(brandId),
  })
}

export function useBrandVideos(brandId: string, status?: string) {
  return useQuery({
    queryKey: viralStudioKeys.brandVideos(brandId, status),
    queryFn: () => viralStudioApi.fetchBrandVideos(brandId, status),
    enabled: Boolean(brandId),
  })
}

export function useBrandScheduled(
  brandId: string,
  startDate?: string,
  endDate?: string,
  options?: { refetchInterval?: number | false | ((query: unknown) => number | false) },
) {
  return useQuery({
    queryKey: viralStudioKeys.brandScheduled(brandId, startDate, endDate),
    queryFn: () => viralStudioApi.fetchBrandScheduled(brandId, startDate, endDate),
    enabled: Boolean(brandId),
    refetchInterval: options?.refetchInterval,
  })
}

export function useBrandAvailableChannels(brandId: string, enabled = true) {
  return useQuery({
    queryKey: viralStudioKeys.brandAvailableChannels(brandId),
    queryFn: () => viralStudioApi.fetchAvailableBrandChannels(brandId),
    enabled: Boolean(brandId) && enabled,
  })
}

export function usePublishingWorkspaces(provider?: string) {
  return useQuery({
    queryKey: viralStudioKeys.publishingWorkspaces(provider),
    queryFn: () => viralStudioApi.fetchPublishingWorkspaces(provider),
  })
}

export function useBindBrandChannels(brandId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { channel_ids: string[]; workspace_id?: string }) =>
      viralStudioApi.bindBrandChannels(brandId, payload),
    onSuccess: () => {
      toast.success('Canais da marca vinculados com sucesso!')
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.brand(brandId) })
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.brandChannels(brandId) })
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.brandWorkspace(brandId) })
    },
    onError: (err: Error) => {
      toast.error(`Falha ao vincular canais: ${err.message}`)
    },
  })
}

export function useAutoScheduleBrandVideo(brandId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, channelIds }: { itemId: string; channelIds?: string[] }) =>
      viralStudioApi.autoScheduleBrandVideo(brandId, itemId, channelIds),
    onSuccess: () => {
      toast.success('Vídeo agendado com sucesso no próximo horário disponível!')
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.brand(brandId) })
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.brandScheduled(brandId) })
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.brandVideos(brandId) })
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.brandWorkspace(brandId) })
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.batches() })
    },
    onError: (err: Error) => {
      toast.error(`Falha ao auto-agendar vídeo: ${err.message}`)
    },
  })
}

export function usePublishBrandVideo(brandId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      item_id: string
      channel_ids?: string[]
      scheduled_for?: string
      publish_now?: boolean
    }) => viralStudioApi.publishBrandVideo(brandId, payload),
    onSuccess: (_, variables) => {
      toast.success(
        variables.publish_now
          ? 'Vídeo enviado para publicação imediata!'
          : 'Vídeo agendado com sucesso!',
      )
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.brand(brandId) })
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.brandScheduled(brandId) })
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.brandVideos(brandId) })
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.brandWorkspace(brandId) })
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.batches() })
    },
    onError: (err: Error) => {
      toast.error(`Erro ao publicar vídeo: ${err.message}`)
    },
  })
}

export function useCancelBrandScheduledPost(brandId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (postId: string) => viralStudioApi.cancelBrandScheduledPost(brandId, postId),
    onSuccess: () => {
      toast.success('Agendamento cancelado. O vídeo retornou para o status Aprovado.')
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.brand(brandId) })
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.brandScheduled(brandId) })
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.brandVideos(brandId) })
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.batches() })
    },
    onError: (err: Error) => {
      toast.error(`Falha ao cancelar agendamento: ${err.message}`)
    },
  })
}

export function usePublishBrandScheduledNow(brandId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (postId: string) => viralStudioApi.publishBrandScheduledNow(brandId, postId),
    onSuccess: () => {
      toast.success('Publicação imediata disparada com sucesso!')
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.brand(brandId) })
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.brandScheduled(brandId) })
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.brandVideos(brandId) })
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.batches() })
    },
    onError: (err: Error) => {
      toast.error(`Falha ao disparar publicação: ${err.message}`)
    },
  })
}

export function useUpdateBrandScheduleSlots(brandId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ScheduleSlotsUpdate) =>
      viralStudioApi.updateBrandScheduleSlots(brandId, payload),
    onSuccess: () => {
      toast.success('Grade de horários atualizada com sucesso!')
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.brand(brandId) })
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.brands() })
    },
    onError: (err: Error) => {
      toast.error(`Falha ao atualizar grade de horários: ${err.message}`)
    },
  })
}

export function useUpdateBrandDetails(brandId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BrandUpdate) => viralStudioApi.updateBrand(brandId, data),
    onSuccess: () => {
      toast.success('Configurações da marca salvas com sucesso!')
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.brand(brandId) })
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.brands() })
    },
    onError: (err: Error) => {
      toast.error(`Falha ao atualizar marca: ${err.message}`)
    },
  })
}
