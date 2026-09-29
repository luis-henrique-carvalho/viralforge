import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BatchResultsHeader } from './batch-results-header'
import type { BatchResponse, ViralItem } from '../data/batch.types'

// Mock TanStack Router Link
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode
    to: string
    [key: string]: unknown
  }) => (
    <a
      href={to}
      {...props}
    >
      {children}
    </a>
  ),
}))

describe('BatchResultsHeader', () => {
  const baseBatch: BatchResponse = {
    id: 'batch-test-12345678',
    batch_id: 'batch-test-12345678',
    brand_id: 'brand-alpha',
    template_id: 'classic-affiliate',
    model: 'gemini-2.5-flash',
    status: 'PENDING',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_items: 2,
    items: [],
  }

  it('renders general progress and batch metadata', () => {
    const batch: BatchResponse = {
      ...baseBatch,
      items: [
        { id: 'item-1', status: 'READY_FOR_REVIEW' } as ViralItem,
        { id: 'item-2', status: 'DOWNLOADING' } as ViralItem,
      ],
    }

    render(
      <BatchResultsHeader
        batch={batch}
        isSelectionMode={false}
        onToggleSelectionMode={vi.fn()}
        selectedCount={0}
      />,
    )

    expect(screen.getByText(/1 de 2/)).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('Marca: brand-alpha')).toBeInTheDocument()
    expect(screen.getByText('classic-affiliate')).toBeInTheDocument()
    expect(screen.getByText('gemini-2.5-flash')).toBeInTheDocument()
  })

  it('correctly derives COMPLETED status badge when at least 1 item is ready and all are done', () => {
    const batch: BatchResponse = {
      ...baseBatch,
      items: [
        { id: 'item-1', status: 'READY_FOR_REVIEW' } as ViralItem,
        { id: 'item-2', status: 'CANCELLED' } as ViralItem,
      ],
    }

    render(
      <BatchResultsHeader
        batch={batch}
        isSelectionMode={false}
        onToggleSelectionMode={vi.fn()}
        selectedCount={0}
      />,
    )

    expect(screen.getByText('Concluído')).toBeInTheDocument()
    expect(screen.getByText('(1 cancelados)')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('derives FAILED badge when 1 failed and 1 cancelled (0 ready videos)', () => {
    const batch: BatchResponse = {
      ...baseBatch,
      items: [
        { id: 'item-1', status: 'FAILED' } as ViralItem,
        { id: 'item-2', status: 'CANCELLED' } as ViralItem,
      ],
    }

    render(
      <BatchResultsHeader
        batch={batch}
        isSelectionMode={false}
        onToggleSelectionMode={vi.fn()}
        selectedCount={0}
      />,
    )

    // Must NOT be "Concluído" — it must show "Falha"
    expect(screen.queryByText('Concluído')).not.toBeInTheDocument()
    expect(screen.getByText('Falha')).toBeInTheDocument()
    expect(screen.getByText('(1 falhas)')).toBeInTheDocument()
    expect(screen.getByText('(1 cancelados)')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('derives CANCELLED badge when all items are cancelled', () => {
    const batch: BatchResponse = {
      ...baseBatch,
      items: [
        { id: 'item-1', status: 'CANCELLED' } as ViralItem,
        { id: 'item-2', status: 'CANCELLED' } as ViralItem,
      ],
    }

    render(
      <BatchResultsHeader
        batch={batch}
        isSelectionMode={false}
        onToggleSelectionMode={vi.fn()}
        selectedCount={0}
      />,
    )

    expect(screen.getByText('Cancelado')).toBeInTheDocument()
    expect(screen.getByText('(2 cancelados)')).toBeInTheDocument()
  })

  it('renders Cancelar Lote button and triggers onCancelBatch when confirmed in AlertDialog', async () => {
    const onCancelBatch = vi.fn()
    const batch: BatchResponse = {
      ...baseBatch,
      items: [
        { id: 'item-1', status: 'DOWNLOADING' } as ViralItem,
        { id: 'item-2', status: 'ANALYZING' } as ViralItem,
      ],
    }

    render(
      <BatchResultsHeader
        batch={batch}
        isSelectionMode={false}
        onToggleSelectionMode={vi.fn()}
        selectedCount={0}
        onCancelBatch={onCancelBatch}
      />,
    )

    const cancelBatchBtn = screen.getByText('Cancelar Lote')
    expect(cancelBatchBtn).toBeInTheDocument()

    // Clicking button opens AlertDialog
    fireEvent.click(cancelBatchBtn)

    expect(screen.getByText('Cancelar processamento do lote?')).toBeInTheDocument()
    const confirmBtn = screen.getByText('Confirmar Cancelamento')
    expect(confirmBtn).toBeInTheDocument()

    fireEvent.click(confirmBtn)
    expect(onCancelBatch).toHaveBeenCalledTimes(1)
  })

  it('does NOT render Cancelar Lote button when processingCount is 0', () => {
    const onCancelBatch = vi.fn()
    const batch: BatchResponse = {
      ...baseBatch,
      items: [
        { id: 'item-1', status: 'READY_FOR_REVIEW' } as ViralItem,
        { id: 'item-2', status: 'CANCELLED' } as ViralItem,
      ],
    }

    render(
      <BatchResultsHeader
        batch={batch}
        isSelectionMode={false}
        onToggleSelectionMode={vi.fn()}
        selectedCount={0}
        onCancelBatch={onCancelBatch}
      />,
    )

    expect(screen.queryByText('Cancelar Lote')).not.toBeInTheDocument()
  })
})
