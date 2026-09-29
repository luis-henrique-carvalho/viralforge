import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { brandApi } from '../services/brand.api'
import { brandKeys } from '../services/brand.keys'
import type { BrandCreate, BrandUpdate } from '../data/brand.types'

export function useBrands() {
  return useQuery({
    queryKey: brandKeys.lists(),
    queryFn: () => brandApi.fetchBrands(),
  })
}

export function useBrand(id: string) {
  return useQuery({
    queryKey: brandKeys.detail(id),
    queryFn: () => brandApi.fetchBrand(id),
    enabled: Boolean(id),
  })
}

export function useCreateBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BrandCreate) => brandApi.createBrand(data),
    onSuccess: (brand) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all })
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
    mutationFn: ({ id, data }: { id: string; data: BrandUpdate }) => brandApi.updateBrand(id, data),
    onSuccess: (brand) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all })
      queryClient.invalidateQueries({ queryKey: brandKeys.detail(brand.id) })
      toast.success('Marca atualizada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar marca', {
        description: error.message,
      })
    },
  })
}
