import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { createTestQueryClient } from '@/test-utils/render'
import {
  usePublishingQueue,
  useRetryPublishingDispatch,
  publishingQueueKeys,
} from './use-publishing-queue'
import { viralStudioApi } from '../services/viral-studio.api'

vi.mock('../services/viral-studio.api', () => ({
  viralStudioApi: {
    fetchPublishingQueue: vi.fn().mockResolvedValue({
      total: 1,
      active_count: 1,
      failed_count: 0,
      jobs: [],
    }),
    retryPublishingDispatch: vi.fn().mockResolvedValue({
      success: true,
      job_id: 'job-1',
      message: 'Reenfileirado com sucesso',
    }),
  },
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('usePublishingQueue', () => {
  it('fetches publishing queue data and sets refetchInterval according to active_count', async () => {
    const qc = createTestQueryClient()
    const { result } = renderHook(() => usePublishingQueue({ brandId: 'brand-1' }), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.total).toBe(1)
    expect(viralStudioApi.fetchPublishingQueue).toHaveBeenCalledWith('brand-1', undefined)
  })

  it('triggers retry mutation successfully', async () => {
    const qc = createTestQueryClient()
    const { result } = renderHook(() => useRetryPublishingDispatch(), {
      wrapper: createWrapper(qc),
    })

    const data = await result.current.mutateAsync('job-1')
    expect(data.success).toBe(true)
    expect(viralStudioApi.retryPublishingDispatch).toHaveBeenCalledWith('job-1')
  })

  it('handles retry mutation errors with various error shapes', async () => {
    const qc = createTestQueryClient()
    const { result } = renderHook(() => useRetryPublishingDispatch(), {
      wrapper: createWrapper(qc),
    })

    vi.mocked(viralStudioApi.retryPublishingDispatch).mockRejectedValueOnce({
      response: { data: { detail: 'Erro específico' } },
    })

    await expect(result.current.mutateAsync('job-err-1')).rejects.toBeDefined()

    vi.mocked(viralStudioApi.retryPublishingDispatch).mockRejectedValueOnce(
      new Error('Erro de conexão'),
    )
    await expect(result.current.mutateAsync('job-err-2')).rejects.toBeDefined()

    vi.mocked(viralStudioApi.retryPublishingDispatch).mockRejectedValueOnce('falha desconhecida')
    await expect(result.current.mutateAsync('job-err-3')).rejects.toBeDefined()
  })

  it('handles default options in usePublishingQueue and inactive polling interval', async () => {
    vi.mocked(viralStudioApi.fetchPublishingQueue).mockResolvedValueOnce({
      total: 0,
      active_count: 0,
      failed_count: 0,
      jobs: [],
    })

    const qc = createTestQueryClient()
    const { result } = renderHook(() => usePublishingQueue(), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.total).toBe(0)
  })

  it('generates query keys correctly', () => {
    expect(publishingQueueKeys.all).toEqual(['viral-studio', 'publishing-queue'])
    expect(publishingQueueKeys.list('b1', 'FAILED')).toEqual([
      'viral-studio',
      'publishing-queue',
      { brandId: 'b1', status: 'FAILED' },
    ])
  })
})
