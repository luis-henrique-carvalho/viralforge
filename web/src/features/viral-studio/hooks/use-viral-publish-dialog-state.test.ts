import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useViralPublishDialogState } from './use-viral-publish-dialog-state'
import type { ViralItem, Brand } from '../data/batch.types'
import type { SocialAccount } from '../data/publishing.types'

const mockAccounts: SocialAccount[] = [
  { id: 'acc-1', name: 'Canal 1', platform: 'tiktok', connected: true },
  { id: 'acc-2', name: 'Canal 2', platform: 'instagram', connected: true },
]

const mockBrand: Brand = {
  id: 'brand-1',
  name: 'Brand One',
  publishing_profiles: {
    postiz: {
      channel_ids: ['acc-1'],
      account_id: 'acc-1',
    },
    zernio: 'acc-2',
  },
} as unknown as Brand

const mockMutateAsync = vi.fn()

vi.mock('./use-brands', () => ({
  useBrands: vi.fn(() => ({
    data: { brands: [mockBrand], total: 1 },
    isLoading: false,
  })),
}))

vi.mock('./use-publishing', () => ({
  usePublishingAccounts: vi.fn(() => ({
    data: mockAccounts,
    isLoading: false,
  })),
  usePreviewSlots: vi.fn(() => ({
    data: { account_id: 'acc-1', count: 1, projected_slots: [] },
    isLoading: false,
  })),
  usePublishItems: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}))

describe('useViralPublishDialogState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMutateAsync.mockResolvedValue({
      results: [{ item_id: 'item-1', status: 'SCHEDULED' }],
    })
  })

  const singleBrandItems: ViralItem[] = [
    {
      id: 'item-1',
      brand_id: 'brand-1',
      status: 'READY_FOR_REVIEW',
      source_url: 'https://example.com/1',
      keyframe_urls: [],
      logs: [],
      publication_records: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  it('initializes single brand dialog and selects brand accounts', () => {
    const onClose = vi.fn()
    const { result } = renderHook(() =>
      useViralPublishDialogState({
        isOpen: true,
        items: singleBrandItems,
        batchId: 'batch-1',
        onClose,
      }),
    )

    expect(result.current.isMultiBrand).toBe(false)
    expect(result.current.selectedAccountIds).toContain('acc-1')
    expect(result.current.selectedAccountIds).toContain('acc-2')
  })

  it('handles account toggling correctly without unselecting the last account', () => {
    const onClose = vi.fn()
    const { result } = renderHook(() =>
      useViralPublishDialogState({
        isOpen: true,
        items: singleBrandItems,
        batchId: 'batch-1',
        onClose,
      }),
    )

    // Toggle off acc-2 (acc-1 remains)
    act(() => {
      result.current.handleToggleAccount('acc-2')
    })
    expect(result.current.selectedAccountIds).toEqual(['acc-1'])

    // Attempt to toggle off acc-1 (should prevent removing the last account)
    act(() => {
      result.current.handleToggleAccount('acc-1')
    })
    expect(result.current.selectedAccountIds).toEqual(['acc-1'])

    // Toggle back on acc-2
    act(() => {
      result.current.handleToggleAccount('acc-2')
    })
    expect(result.current.selectedAccountIds).toContain('acc-2')
  })

  it('handles multi-brand scenario and computes brand summary', () => {
    const multiBrandItems: ViralItem[] = [
      ...singleBrandItems,
      {
        id: 'item-2',
        brand_id: 'brand-2',
        status: 'READY_FOR_REVIEW',
        source_url: 'https://example.com/2',
        keyframe_urls: [],
        logs: [],
        publication_records: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    const { result } = renderHook(() =>
      useViralPublishDialogState({
        isOpen: true,
        items: multiBrandItems,
        batchId: 'batch-1',
        onClose: vi.fn(),
      }),
    )

    expect(result.current.isMultiBrand).toBe(true)
    expect(result.current.selectedAccountIds).toEqual([])
    expect(result.current.brandSummary).toHaveLength(2)
    expect(result.current.brandSummary[0].brandName).toBe('Brand One')
  })

  it('executes handlePublish successfully and triggers onPublished callback', async () => {
    const onPublished = vi.fn()
    const { result } = renderHook(() =>
      useViralPublishDialogState({
        isOpen: true,
        items: singleBrandItems,
        batchId: 'batch-1',
        onClose: vi.fn(),
        onPublished,
      }),
    )

    await act(async () => {
      await result.current.handlePublish()
    })

    expect(mockMutateAsync).toHaveBeenCalled()
    expect(onPublished).toHaveBeenCalled()
    expect(result.current.isCompleted).toBe(true)
  })

  it('captures publish error message when publish mutation fails', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('Network failure'))
    const { result } = renderHook(() =>
      useViralPublishDialogState({
        isOpen: true,
        items: singleBrandItems,
        batchId: 'batch-1',
        onClose: vi.fn(),
      }),
    )

    await act(async () => {
      await result.current.handlePublish()
    })

    expect(result.current.publishError).toBe('Network failure')
    expect(result.current.isCompleted).toBe(false)
  })

  it('calls onClose and clears submission on handleClose', () => {
    const onClose = vi.fn()
    const { result } = renderHook(() =>
      useViralPublishDialogState({
        isOpen: true,
        items: singleBrandItems,
        batchId: 'batch-1',
        onClose,
      }),
    )

    act(() => {
      result.current.handleClose()
    })

    expect(onClose).toHaveBeenCalled()
    expect(result.current.results).toEqual([])
    expect(result.current.publishError).toBeNull()
  })
})
