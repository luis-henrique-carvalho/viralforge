import { describe, expect, it } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createTestQueryClient } from '@/test-utils/render'
import { discoveryKeys, useDiscoveryPlatforms, useDiscoverySearch } from './use-discovery'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useDiscovery hooks', () => {
  it('discoveryKeys generates expected keys', () => {
    expect(discoveryKeys.all).toEqual(['discovery'])
    expect(discoveryKeys.platforms()).toEqual(['discovery', 'platforms'])
    expect(discoveryKeys.search({ query: 'test' })).toEqual([
      'discovery',
      'search',
      { query: 'test' },
    ])
  })

  it('useDiscoveryPlatforms fetches platforms', async () => {
    const qc = createTestQueryClient()
    const { result } = renderHook(() => useDiscoveryPlatforms(), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const platformIds = result.current.data?.platforms.map((p) => p.id)
    expect(platformIds).toContain('tiktok')
  })

  it('useDiscoverySearch executes search mutation', async () => {
    const qc = createTestQueryClient()
    const { result } = renderHook(() => useDiscoverySearch(), {
      wrapper: createWrapper(qc),
    })

    const mutationResult = await result.current.mutateAsync({
      query: 'achadinhos',
      platform: 'tiktok',
    })

    expect(mutationResult.items.length).toBeGreaterThan(0)
  })
})
