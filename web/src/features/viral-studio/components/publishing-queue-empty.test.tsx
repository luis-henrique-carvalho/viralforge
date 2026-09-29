import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PublishingQueueEmpty } from './publishing-queue-empty'

describe('PublishingQueueEmpty', () => {
  it('renders default empty state when selectedStatus is ALL', () => {
    const onResetFilter = vi.fn()
    render(
      <PublishingQueueEmpty
        selectedStatus="ALL"
        onResetFilter={onResetFilter}
      />,
    )

    expect(screen.getByText('Nenhum envio encontrado')).toBeInTheDocument()
    expect(
      screen.getByText(/Quando você agendar ou publicar vídeos no Viral Studio/),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Ver todos os envios/i })).not.toBeInTheDocument()
  })

  it('renders filter-specific message and reset button when filtered', () => {
    const onResetFilter = vi.fn()
    render(
      <PublishingQueueEmpty
        selectedStatus="FAILED"
        onResetFilter={onResetFilter}
      />,
    )

    expect(
      screen.getByText('Nenhum disparo com status "FAILED" foi encontrado na fila.'),
    ).toBeInTheDocument()
    const resetBtn = screen.getByRole('button', { name: /Ver todos os envios/i })
    expect(resetBtn).toBeInTheDocument()
    fireEvent.click(resetBtn)
    expect(onResetFilter).toHaveBeenCalled()
  })
})
