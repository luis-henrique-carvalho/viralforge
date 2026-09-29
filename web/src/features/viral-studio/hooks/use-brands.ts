import { useQuery } from '@tanstack/react-query'
import { viralStudioApi } from '../services/viral-studio.api'
import { viralStudioKeys } from '../services/viral-studio.keys'

// Re-export sovereign brand hooks for backward compatibility
export { useBrands, useBrand, useCreateBrand, useUpdateBrand } from '@/features/brands'

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
