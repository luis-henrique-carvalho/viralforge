import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { brandApi } from '../services/brand.api'
import { brandKeys } from '../services/brand.keys'
import type { BrandUpdate, ScheduleSlotsUpdate } from '../data/brand.types'

export function useBrandWorkspace(brandId: string) {
  return useQuery({
    queryKey: brandKeys.workspace(brandId),
    queryFn: () => brandApi.fetchBrandWorkspace(brandId),
    enabled: Boolean(brandId),
  })
}

export function useBrandChannels(brandId: string) {
  return useQuery({
    queryKey: brandKeys.channels(brandId),
    queryFn: () => brandApi.fetchBrandChannels(brandId),
    enabled: Boolean(brandId),
  })
}

export function useBrandVideos(brandId: string, status?: string) {
  return useQuery({
    queryKey: brandKeys.videos(brandId, status),
    queryFn: () => brandApi.fetchBrandVideos(brandId, status),
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
    queryKey: brandKeys.scheduled(brandId, startDate, endDate),
    queryFn: () => brandApi.fetchBrandScheduled(brandId, startDate, endDate),
    enabled: Boolean(brandId),
    refetchInterval: options?.refetchInterval,
  })
}

export function useBrandAvailableChannels(brandId: string, enabled = true) {
  return useQuery({
    queryKey: brandKeys.availableChannels(brandId),
    queryFn: () => brandApi.fetchAvailableBrandChannels(brandId),
    enabled: Boolean(brandId) && enabled,
  })
}

export function usePublishingWorkspaces(provider?: string) {
  return useQuery({
    queryKey: brandKeys.publishingWorkspaces(provider),
    queryFn: () => brandApi.fetchPublishingWorkspaces(provider),
  })
}

export function useBindBrandChannels(brandId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { channel_ids: string[]; workspace_id?: string }) =>
      brandApi.bindBrandChannels(brandId, payload),
    onSuccess: () => {
      toast.success('Canais da marca vinculados com sucesso!')
      queryClient.invalidateQueries({ queryKey: brandKeys.detail(brandId) })
      queryClient.invalidateQueries({ queryKey: brandKeys.channels(brandId) })
      queryClient.invalidateQueries({ queryKey: brandKeys.workspace(brandId) })
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
      brandApi.autoScheduleBrandVideo(brandId, itemId, channelIds),
    onSuccess: () => {
      toast.success('Vídeo agendado com sucesso no próximo horário disponível!')
      queryClient.invalidateQueries({ queryKey: brandKeys.detail(brandId) })
      queryClient.invalidateQueries({ queryKey: brandKeys.scheduled(brandId) })
      queryClient.invalidateQueries({ queryKey: brandKeys.videos(brandId) })
      queryClient.invalidateQueries({ queryKey: brandKeys.workspace(brandId) })
      queryClient.invalidateQueries({ queryKey: ['viral-studio', 'batches'] })
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
    }) => brandApi.publishBrandVideo(brandId, payload),
    onSuccess: (_, variables) => {
      toast.success(
        variables.publish_now
          ? 'Vídeo enviado para publicação imediata!'
          : 'Vídeo agendado com sucesso!',
      )
      queryClient.invalidateQueries({ queryKey: brandKeys.detail(brandId) })
      queryClient.invalidateQueries({ queryKey: brandKeys.scheduled(brandId) })
      queryClient.invalidateQueries({ queryKey: brandKeys.videos(brandId) })
      queryClient.invalidateQueries({ queryKey: brandKeys.workspace(brandId) })
      queryClient.invalidateQueries({ queryKey: ['viral-studio', 'batches'] })
    },
    onError: (err: Error) => {
      toast.error(`Erro ao publicar vídeo: ${err.message}`)
    },
  })
}

export function useCancelBrandScheduledPost(brandId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (postId: string) => brandApi.cancelBrandScheduledPost(brandId, postId),
    onSuccess: () => {
      toast.success('Agendamento cancelado. O vídeo retornou para o status Aprovado.')
      queryClient.invalidateQueries({ queryKey: brandKeys.detail(brandId) })
      queryClient.invalidateQueries({ queryKey: brandKeys.scheduled(brandId) })
      queryClient.invalidateQueries({ queryKey: brandKeys.videos(brandId) })
      queryClient.invalidateQueries({ queryKey: ['viral-studio', 'batches'] })
    },
    onError: (err: Error) => {
      toast.error(`Falha ao cancelar agendamento: ${err.message}`)
    },
  })
}

export function usePublishBrandScheduledNow(brandId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (postId: string) => brandApi.publishBrandScheduledNow(brandId, postId),
    onSuccess: () => {
      toast.success('Publicação imediata disparada com sucesso!')
      queryClient.invalidateQueries({ queryKey: brandKeys.detail(brandId) })
      queryClient.invalidateQueries({ queryKey: brandKeys.scheduled(brandId) })
      queryClient.invalidateQueries({ queryKey: brandKeys.videos(brandId) })
      queryClient.invalidateQueries({ queryKey: ['viral-studio', 'batches'] })
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
      brandApi.updateBrandScheduleSlots(brandId, payload),
    onSuccess: () => {
      toast.success('Grade de horários atualizada com sucesso!')
      queryClient.invalidateQueries({ queryKey: brandKeys.detail(brandId) })
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() })
    },
    onError: (err: Error) => {
      toast.error(`Falha ao atualizar grade de horários: ${err.message}`)
    },
  })
}

export function useUpdateBrandDetails(brandId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BrandUpdate) => brandApi.updateBrand(brandId, data),
    onSuccess: () => {
      toast.success('Configurações da marca salvas com sucesso!')
      queryClient.invalidateQueries({ queryKey: brandKeys.detail(brandId) })
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() })
    },
    onError: (err: Error) => {
      toast.error(`Falha ao atualizar marca: ${err.message}`)
    },
  })
}
