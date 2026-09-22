import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { viralStudioApi } from '../services/viral-studio.api'
import { viralStudioKeys } from '../services/viral-studio.keys'
import type { BrandCreate, BrandUpdate } from '../data/batch.types'

export function useBrands() {
  return useQuery({
    queryKey: viralStudioKeys.brands(),
    queryFn: () => viralStudioApi.fetchBrands(),
  })
}

export function useBrand(id: string) {
  return useQuery({
    queryKey: viralStudioKeys.brand(id),
    queryFn: () => viralStudioApi.fetchBrand(id),
    enabled: Boolean(id),
  })
}

export function useCreateBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BrandCreate) => viralStudioApi.createBrand(data),
    onSuccess: (brand) => {
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.brands() })
      toast.success('Marca criada com sucesso!', {
        description: `Perfil ${brand.handle.startsWith('@') ? brand.handle : `@${brand.handle}`} pronto para uso.`,
      })
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar marca', {
        description: error.message,
      })
    },
  })
}

export function useUpdateBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BrandUpdate }) =>
      viralStudioApi.updateBrand(id, data),
    onSuccess: (brand) => {
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.brands() })
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.brand(brand.id) })
      toast.success('Marca atualizada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar marca', {
        description: error.message,
      })
    },
  })
}

export function useTemplates() {
  return useQuery({
    queryKey: viralStudioKeys.templates(),
    queryFn: () => viralStudioApi.fetchTemplates(),
  })
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: viralStudioKeys.template(id),
    queryFn: () => viralStudioApi.fetchTemplate(id),
    enabled: Boolean(id),
  })
}
