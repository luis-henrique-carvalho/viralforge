import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { useRegenerateCopy } from './use-regenerate-copy'
import { createTestQueryClient } from '@/test-utils/render'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useRegenerateCopy hook', () => {
  it('triggers copy regeneration successfully', async () => {
    const qc = createTestQueryClient()
    const { result } = renderHook(() => useRegenerateCopy('batch-101'), {
      wrapper: createWrapper(qc),
    })

    const updated = await result.current.mutateAsync({
      itemId: 'item-1',
      model: 'gemini-2.5-flash',
      manual_instructions: 'Tom bem humorado',
    })

    expect(updated.id).toBe('item-1')
    expect(updated.selected_headline).toContain('Gancho Regerado')
  })
})
