import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEditorNavigation } from './use-editor-navigation'
import type { ViralItem } from '../data/batch.types'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

const mockItems: ViralItem[] = [
  {
    id: 'item-1',
    source_url: 'https://example.com/1',
    status: 'READY_FOR_REVIEW',
    keyframe_urls: [],
    logs: [],
    publication_records: [],
    created_at: '',
    updated_at: '',
  },
  {
    id: 'item-2',
    source_url: 'https://example.com/2',
    status: 'READY_FOR_REVIEW',
    keyframe_urls: [],
    logs: [],
    publication_records: [],
    created_at: '',
    updated_at: '',
  },
]

describe('useEditorNavigation hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('navigates directly when not dirty', () => {
    const onSave = vi.fn().mockResolvedValue(true)
    const onReset = vi.fn()

    const { result } = renderHook(() =>
      useEditorNavigation({
        batchId: 'batch-1',
        itemId: 'item-1',
        items: mockItems,
        isDirty: false,
        onSave,
        onReset,
      }),
    )

    expect(result.current.hasPrev).toBe(false)
    expect(result.current.hasNext).toBe(true)
    expect(result.current.currentIndex).toBe(0)

    act(() => {
      result.current.handleNext()
    })

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/viral-studio/$id/items/$itemId',
      params: { id: 'batch-1', itemId: 'item-2' },
    })
    expect(result.current.isNavDialogOpen).toBe(false)
  })

  it('prompts confirmation modal when dirty and discards', () => {
    const onSave = vi.fn().mockResolvedValue(true)
    const onReset = vi.fn()

    const { result } = renderHook(() =>
      useEditorNavigation({
        batchId: 'batch-1',
        itemId: 'item-1',
        items: mockItems,
        isDirty: true,
        onSave,
        onReset,
      }),
    )

    act(() => {
      result.current.handleBack()
    })

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(result.current.isNavDialogOpen).toBe(true)

    act(() => {
      result.current.handleConfirmDiscard()
    })

    expect(onReset).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/viral-studio/$id',
      params: { id: 'batch-1' },
    })
    expect(result.current.isNavDialogOpen).toBe(false)
  })

  it('saves and proceeds when requested from dirty dialog', async () => {
    const onSave = vi.fn().mockResolvedValue(true)
    const onReset = vi.fn()

    const { result } = renderHook(() =>
      useEditorNavigation({
        batchId: 'batch-1',
        itemId: 'item-1',
        items: mockItems,
        isDirty: true,
        onSave,
        onReset,
      }),
    )

    act(() => {
      result.current.handleNext()
    })

    expect(result.current.isNavDialogOpen).toBe(true)

    await act(async () => {
      await result.current.handleSaveAndProceed()
    })

    expect(onSave).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/viral-studio/$id/items/$itemId',
      params: { id: 'batch-1', itemId: 'item-2' },
    })
    expect(result.current.isNavDialogOpen).toBe(false)
  })
})
