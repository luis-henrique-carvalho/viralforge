import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { useRenderItem } from './use-render-item'
import { createTestQueryClient } from '@/test-utils/render'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useRenderItem hook', () => {
  it('triggers item render mutation successfully', async () => {
    const qc = createTestQueryClient()
    const { result } = renderHook(() => useRenderItem('batch-101'), {
      wrapper: createWrapper(qc),
    })

    const updated = await result.current.mutateAsync({
      itemId: 'item-1',
      headline: 'Nova Headline para Render',
    })

    expect(updated.id).toBe('item-1')
    expect(updated.status).toBe('RENDERING')
  })
})
