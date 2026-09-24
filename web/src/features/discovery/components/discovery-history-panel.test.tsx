import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DiscoveryHistoryPanel } from './discovery-history-panel'
import type { DiscoverySearchSummary } from '../data/discovery.types'

describe('DiscoveryHistoryPanel', () => {
  const mockSearches: DiscoverySearchSummary[] = [
    {
      id: 's-1',
      platform: 'tiktok',
      query: 'achadinhos',
      status: 'SEARCHING',
      total_found: 0,
      created_at: '2026-09-24T12:00:00Z',
    },
    {
      id: 's-2',
      platform: 'instagram',
      query: 'decoracao',
      status: 'COMPLETED',
      total_found: 12,
      created_at: '2026-09-24T11:00:00Z',
    },
    {
      id: 's-3',
      platform: 'youtube',
      query: 'gadgets',
      status: 'CANCELLED',
      total_found: 0,
      created_at: '2026-09-24T10:00:00Z',
    },
    {
      id: 's-4',
      platform: 'tiktok',
      query: 'falha_total',
      status: 'FAILED',
      total_found: 0,
      created_at: '2026-09-24T09:00:00Z',
    },
  ]

  it('renders nothing when searches list is empty', () => {
    const { container } = render(
      <DiscoveryHistoryPanel
        searches={[]}
        activeSearchId={null}
        onSelectSearch={vi.fn()}
        onCancelSearch={vi.fn()}
        onDeleteSearch={vi.fn()}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders searches with appropriate status badges and handles select, cancel, and delete', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onCancel = vi.fn()
    const onDelete = vi.fn()

    render(
      <DiscoveryHistoryPanel
        searches={mockSearches}
        activeSearchId="s-2"
        onSelectSearch={onSelect}
        onCancelSearch={onCancel}
        onDeleteSearch={onDelete}
      />,
    )

    expect(screen.getByText('Histórico de Buscas')).toBeInTheDocument()
    expect(screen.getByText('4 salvas')).toBeInTheDocument()

    // Check status badges
    expect(screen.getByText('Minerando...')).toBeInTheDocument()
    expect(screen.getByText('Concluído (12)')).toBeInTheDocument()
    expect(screen.getByText('Cancelada')).toBeInTheDocument()
    expect(screen.getByText('Falha')).toBeInTheDocument()

    // Test select search
    await user.click(screen.getByText('decoracao'))
    expect(onSelect).toHaveBeenCalledWith('s-2')

    // Test cancel active search
    const cancelBtn = screen.getByTitle('Cancelar busca')
    await user.click(cancelBtn)
    expect(onCancel).toHaveBeenCalledWith('s-1')

    // Test delete completed search
    const deleteBtns = screen.getAllByTitle('Excluir do histórico')
    await user.click(deleteBtns[0])
    expect(onDelete).toHaveBeenCalledWith('s-2')
  })
})
