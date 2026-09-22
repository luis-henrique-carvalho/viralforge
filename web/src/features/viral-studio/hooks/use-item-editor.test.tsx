import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { useItemEditor } from './use-item-editor'
import { createTestQueryClient } from '@/test-utils/render'
import type { ViralItem } from '../data/batch.types'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const mockItem: ViralItem = {
  id: 'item-1',
  batch_id: 'batch-101',
  brand_id: 'vale-o-clique',
  model: 'gemini-2.5-flash',
  source_url: 'https://www.tiktok.com/@user/video/111111',
  product_code: 'PROD-01',
  product_url: 'https://amzn.to/prod01',
  manual_headline: null,
  additional_instructions: null,
  selected_headline: 'Headline Original',
  caption: 'Legenda Original',
  ai_copy: null,
  status: 'READY_FOR_REVIEW',
  source_path: null,
  rendered_path: null,
  error_message: null,
  job_id: null,
  source_metadata: null,
  ai_context_summary: null,
  ai_telemetry: null,
  keyframe_urls: [],
  logs: [],
  publication_records: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('useItemEditor hook', () => {
  it('initializes with item values and tracks dirty status when edited', async () => {
    const qc = createTestQueryClient()
    const { result } = renderHook(() => useItemEditor({ item: mockItem, batchId: 'batch-101' }), {
      wrapper: createWrapper(qc),
    })

    expect(result.current.form.getValues('selected_headline')).toBe('Headline Original')
    expect(result.current.form.getValues('caption')).toBe('Legenda Original')
    expect(result.current.isDirty).toBe(false)

    act(() => {
      result.current.applyHeadline('Nova Headline Selecionada')
    })

    expect(result.current.form.getValues('selected_headline')).toBe('Nova Headline Selecionada')
    expect(result.current.isDirty).toBe(true)
  })

  it('submits valid form data through saveMutation', async () => {
    const qc = createTestQueryClient()
    const onSaveSuccess = vi.fn()
    const { result } = renderHook(
      () =>
        useItemEditor({
          item: mockItem,
          batchId: 'batch-101',
          onSaveSuccess,
        }),
      { wrapper: createWrapper(qc) },
    )

    act(() => {
      result.current.form.setValue('selected_headline', 'Headline Salva pelo Teste', {
        shouldDirty: true,
      })
    })

    await act(async () => {
      await result.current.handleSave()
    })

    expect(onSaveSuccess).toHaveBeenCalled()
  })
})
