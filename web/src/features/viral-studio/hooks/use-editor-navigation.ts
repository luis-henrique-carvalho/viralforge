import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { ViralItem } from '../data/batch.types'

interface UseEditorNavigationOptions {
  batchId: string
  itemId: string
  items: ViralItem[]
  isDirty: boolean
  onSave: () => Promise<boolean>
  onReset: () => void
}

function useKeyboardShortcuts(onPrev: () => void, onNext: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault()
        onPrev()
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault()
        onNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onPrev, onNext])
}

export function useEditorNavigation({
  batchId,
  itemId,
  items,
  isDirty,
  onSave,
  onReset,
}: UseEditorNavigationOptions) {
  const navigate = useNavigate()
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const currentIndex = useMemo(() => items.findIndex((i) => i.id === itemId), [items, itemId])
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex >= 0 && currentIndex < items.length - 1

  const requestNav = useCallback(
    (action: () => void) => {
      if (isDirty) setPendingAction(() => action)
      else action()
    },
    [isDirty],
  )

  const handleBack = useCallback(() => {
    requestNav(() => navigate({ to: '/viral-studio/$id', params: { id: batchId } }))
  }, [navigate, batchId, requestNav])

  const handlePrev = useCallback(() => {
    if (!hasPrev) return
    const prev = items[currentIndex - 1]
    requestNav(() =>
      navigate({ to: '/viral-studio/$id/items/$itemId', params: { id: batchId, itemId: prev.id } }),
    )
  }, [hasPrev, items, currentIndex, batchId, navigate, requestNav])

  const handleNext = useCallback(() => {
    if (!hasNext) return
    const next = items[currentIndex + 1]
    requestNav(() =>
      navigate({ to: '/viral-studio/$id/items/$itemId', params: { id: batchId, itemId: next.id } }),
    )
  }, [hasNext, items, currentIndex, batchId, navigate, requestNav])

  const handleConfirmDiscard = useCallback(() => {
    onReset()
    const action = pendingAction
    setPendingAction(null)
    action?.()
  }, [onReset, pendingAction])

  const handleSaveAndProceed = useCallback(async () => {
    const success = await onSave()
    if (success) {
      const action = pendingAction
      setPendingAction(null)
      action?.()
    }
  }, [onSave, pendingAction])

  useKeyboardShortcuts(handlePrev, handleNext)

  return {
    currentIndex,
    hasPrev,
    hasNext,
    isNavDialogOpen: Boolean(pendingAction),
    handleBack,
    handlePrev,
    handleNext,
    handleConfirmDiscard,
    handleSaveAndProceed,
    handleCancelNav: () => setPendingAction(null),
  }
}
