import { describe, expect, it } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useBatchDetail } from './use-batch-detail'
import { computeBatchKpis, useBatches } from './use-batches'
import { useCreateBatch } from './use-create-batch'
import { createTestQueryClient } from '@/test-utils/render'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useBatches, useBatchDetail, useCreateBatch hooks', () => {
  it('computes batch KPIs correctly for various statuses', () => {
    const kpis = computeBatchKpis([
      {
        id: 'b1',
        batch_id: 'b1',
        brand_id: 'brand1',
        status: 'PENDING',
        total_items: 2,
        items: [
          {
            id: 'i1',
            source_url: 'http://a.com',
            status: 'DOWNLOADING',
            keyframe_urls: [],
            logs: [],
            publication_records: [],
            created_at: '',
            updated_at: '',
          },
          {
            id: 'i2',
            source_url: 'http://b.com',
            status: 'READY_FOR_REVIEW',
            keyframe_urls: [],
            logs: [],
            publication_records: [],
            created_at: '',
            updated_at: '',
          },
        ],
        created_at: '',
        updated_at: '',
      },
    ])

    expect(kpis.totalBatches).toBe(1)
    expect(kpis.activeBatches).toBe(1)
    expect(kpis.processingVideos).toBe(1)
    expect(kpis.readyVideos).toBe(1)
    expect(kpis.successRate).toBe(100)
  })

  it('fetches batches with useBatches', async () => {
    const qc = createTestQueryClient()
    const { result } = renderHook(() => useBatches(), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.data?.batches.length).toBeGreaterThan(0)
    })
  })

  it('fetches batch detail with useBatchDetail', async () => {
    const qc = createTestQueryClient()
    const { result } = renderHook(() => useBatchDetail('batch-101'), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.data?.id).toBe('batch-101')
    })
  })

  it('creates batch with useCreateBatch', async () => {
    const qc = createTestQueryClient()
    const { result } = renderHook(() => useCreateBatch(), {
      wrapper: createWrapper(qc),
    })

    const res = await result.current.mutateAsync({
      brand_id: 'vale-o-clique',
      items: [{ source_url: 'https://tiktok.com/@u/v/123' }],
    })
    expect(res).toBeDefined()
    expect(res.id).toBeDefined()
  })
})
