import { describe, expect, it } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createTestQueryClient } from '@/test-utils/render'
import {
  discoveryKeys,
  useCancelDiscoverySearch,
  useCreateDiscoverySearch,
  useDeleteDiscoverySearch,
  useDiscoveryPlatforms,
  useDiscoverySearch,
  useDiscoverySearchDetail,
  useDiscoverySearches,
} from './use-discovery'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useDiscovery hooks', () => {
  it('discoveryKeys generates expected keys', () => {
    expect(discoveryKeys.all).toEqual(['discovery'])
    expect(discoveryKeys.platforms()).toEqual(['discovery', 'platforms'])
    expect(discoveryKeys.searches()).toEqual(['discovery', 'searches'])
    expect(discoveryKeys.searchDetail('s1')).toEqual(['discovery', 'searchDetail', 's1'])
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

  it('useDiscoverySearches and useDiscoverySearchDetail fetch async search state', async () => {
    const qc = createTestQueryClient()
    const { result: listResult } = renderHook(() => useDiscoverySearches(), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => {
      expect(listResult.current.isSuccess).toBe(true)
    })

    const { result: detailResult } = renderHook(() => useDiscoverySearchDetail('search-mock-1'), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => {
      expect(detailResult.current.isSuccess).toBe(true)
    })

    expect(detailResult.current.data?.id).toBe('search-mock-1')
    expect(detailResult.current.data?.items.length).toBeGreaterThan(0)
  })

  it('useCreateDiscoverySearch, useCancelDiscoverySearch, useDeleteDiscoverySearch execute mutations', async () => {
    const qc = createTestQueryClient()
    const { result: createHook } = renderHook(() => useCreateDiscoverySearch(), {
      wrapper: createWrapper(qc),
    })
    const { result: cancelHook } = renderHook(() => useCancelDiscoverySearch(), {
      wrapper: createWrapper(qc),
    })
    const { result: deleteHook } = renderHook(() => useDeleteDiscoverySearch(), {
      wrapper: createWrapper(qc),
    })

    const summary = await createHook.current.mutateAsync({
      query: 'achadinhos_teste',
      platform: 'tiktok',
    })
    expect(summary.id).toBeDefined()

    const cancelSummary = await cancelHook.current.mutateAsync(summary.id)
    expect(cancelSummary.status).toBe('CANCELLED')

    const delResult = await deleteHook.current.mutateAsync(summary.id)
    expect(delResult.success).toBe(true)
  })

  it('useDiscoverySearch executes legacy search mutation', async () => {
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
