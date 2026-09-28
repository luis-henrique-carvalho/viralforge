import { describe, expect, it } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from '@/test-utils/render'
import type { ReactNode } from 'react'
import {
  useAutoScheduleBrandVideo,
  useBrandChannels,
  useBrandScheduled,
  useBrandVideos,
  useBrandWorkspace,
  useCancelBrandScheduledPost,
  usePublishBrandVideo,
  usePublishingWorkspaces,
  useUpdateBrandDetails,
  useUpdateBrandScheduleSlots,
} from './use-brand-workspace'

function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('use-brand-workspace hooks', () => {
  it('fetches brand workspace summary', async () => {
    const { result } = renderHook(() => useBrandWorkspace('vale-o-clique'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.brand.id).toBe('vale-o-clique')
    expect(result.current.data?.active_provider).toBe('postiz')
    expect(result.current.data?.connected_channels.length).toBeGreaterThan(0)
  })

  it('fetches brand channels', async () => {
    const { result } = renderHook(() => useBrandChannels('vale-o-clique'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.length).toBeGreaterThan(0)
  })

  it('fetches brand videos with status filtering', async () => {
    const { result } = renderHook(() => useBrandVideos('vale-o-clique', 'all'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(Array.isArray(result.current.data)).toBe(true)
  })

  it('fetches brand scheduled timeline', async () => {
    const { result } = renderHook(() => useBrandScheduled('vale-o-clique'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.brand_id).toBe('vale-o-clique')
    expect(result.current.data?.posts.length).toBeGreaterThan(0)
  })

  it('fetches publishing workspaces', async () => {
    const { result } = renderHook(() => usePublishingWorkspaces(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.length).toBeGreaterThan(0)
  })

  it('executes autoScheduleBrandVideo mutation', async () => {
    const { result } = renderHook(() => useAutoScheduleBrandVideo('vale-o-clique'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync({ itemId: 'item-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('executes publishBrandVideo mutation for immediate and scheduled publish', async () => {
    const { result } = renderHook(() => usePublishBrandVideo('vale-o-clique'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync({ item_id: 'item-1', publish_now: true })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    await act(async () => {
      await result.current.mutateAsync({
        item_id: 'item-1',
        publish_now: false,
        scheduled_for: new Date().toISOString(),
      })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('executes cancelBrandScheduledPost mutation', async () => {
    const { result } = renderHook(() => useCancelBrandScheduledPost('vale-o-clique'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync('post_mock_101')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('executes updateBrandScheduleSlots mutation', async () => {
    const { result } = renderHook(() => useUpdateBrandScheduleSlots('vale-o-clique'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync({
        slots: ['10:00', '16:00'],
        timezone: 'America/Sao_Paulo',
        frequency: 2,
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('executes updateBrandDetails mutation', async () => {
    const { result } = renderHook(() => useUpdateBrandDetails('vale-o-clique'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync({
        name: 'Vale o Clique Atualizado',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
