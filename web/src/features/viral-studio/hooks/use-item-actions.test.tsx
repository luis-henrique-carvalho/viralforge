import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useApproveItem, useBulkItemActions, useRetryItem, useUpdateItem } from './use-item-actions'
import { createTestQueryClient } from '@/test-utils/render'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useItemActions hooks', () => {
  it('approves an item', async () => {
    const qc = createTestQueryClient()
    const { result } = renderHook(() => useApproveItem('batch-101'), {
      wrapper: createWrapper(qc),
    })

    const res = await result.current.mutateAsync('item-1')
    expect(res.status).toBe('APPROVED')
  })

  it('retries an item', async () => {
    const qc = createTestQueryClient()
    const { result } = renderHook(() => useRetryItem('batch-101'), {
      wrapper: createWrapper(qc),
    })

    const res = await result.current.mutateAsync('item-3')
    expect(res.status).toBe('PENDING')
  })

  it('updates an item', async () => {
    const qc = createTestQueryClient()
    const { result } = renderHook(() => useUpdateItem('batch-101'), {
      wrapper: createWrapper(qc),
    })

    const res = await result.current.mutateAsync({
      itemId: 'item-1',
      data: { selected_headline: 'Headline Atualizada Hook' },
    })
    expect(res.selected_headline).toBe('Headline Atualizada Hook')
  })

  it('performs bulk approve and retry', async () => {
    const qc = createTestQueryClient()
    const { result } = renderHook(() => useBulkItemActions('batch-101'), {
      wrapper: createWrapper(qc),
    })

    await result.current.bulkApprove(['item-1', 'item-2'])
    await result.current.bulkRetry(['item-3'])
  })
})
