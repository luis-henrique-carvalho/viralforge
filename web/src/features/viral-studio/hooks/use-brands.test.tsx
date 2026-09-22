import { describe, expect, it } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  useBrand,
  useBrands,
  useCreateBrand,
  useTemplate,
  useTemplates,
  useUpdateBrand,
} from './use-brands'
import { createTestQueryClient } from '@/test-utils/render'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useBrands & useTemplates hooks', () => {
  it('fetches brands and single brand', async () => {
    const qc = createTestQueryClient()
    const { result: brandsResult } = renderHook(() => useBrands(), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => {
      expect(brandsResult.current.isSuccess).toBe(true)
      expect(brandsResult.current.data?.brands.length).toBeGreaterThan(0)
    })

    const { result: singleBrandResult } = renderHook(() => useBrand('vale-o-clique'), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => {
      expect(singleBrandResult.current.isSuccess).toBe(true)
      expect(singleBrandResult.current.data?.id).toBe('vale-o-clique')
    })
  })

  it('creates and updates a brand', async () => {
    const qc = createTestQueryClient()
    const { result: createResult } = renderHook(() => useCreateBrand(), {
      wrapper: createWrapper(qc),
    })

    await createResult.current.mutateAsync({
      name: 'Marca Hook Teste',
      handle: '@hookteste',
      default_cta: 'CTA Teste',
    })

    const { result: updateResult } = renderHook(() => useUpdateBrand(), {
      wrapper: createWrapper(qc),
    })

    await updateResult.current.mutateAsync({
      id: 'vale-o-clique',
      data: { name: 'Vale o Clique Editado' },
    })
  })

  it('fetches templates and single template', async () => {
    const qc = createTestQueryClient()
    const { result: templatesResult } = renderHook(() => useTemplates(), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => {
      expect(templatesResult.current.isSuccess).toBe(true)
      expect(templatesResult.current.data?.templates.length).toBeGreaterThan(0)
    })

    const { result: singleTemplateResult } = renderHook(() => useTemplate('classic-affiliate'), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => {
      expect(singleTemplateResult.current.isSuccess).toBe(true)
      expect(singleTemplateResult.current.data?.id).toBe('classic-affiliate')
    })
  })
})
