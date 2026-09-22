import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BulkActionsBar } from './bulk-actions-bar'

describe('BulkActionsBar', () => {
  it('returns null when selectedCount is 0', () => {
    const { container } = render(
      <BulkActionsBar
        selectedCount={0}
        totalCount={5}
        onSelectAll={vi.fn()}
        onClearSelection={vi.fn()}
        onBulkApprove={vi.fn()}
        onBulkRetry={vi.fn()}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders actions and triggers callbacks when items are selected', () => {
    const onSelectAll = vi.fn()
    const onClearSelection = vi.fn()
    const onBulkApprove = vi.fn()
    const onBulkRetry = vi.fn()

    render(
      <BulkActionsBar
        selectedCount={3}
        totalCount={5}
        onSelectAll={onSelectAll}
        onClearSelection={onClearSelection}
        onBulkApprove={onBulkApprove}
        onBulkRetry={onBulkRetry}
      />,
    )

    expect(screen.getByText('3 vídeos selecionados')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Selecionar todos (5)'))
    expect(onSelectAll).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('Aprovar (3)'))
    expect(onBulkApprove).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('Reprocessar'))
    expect(onBulkRetry).toHaveBeenCalledTimes(1)
  })
})
