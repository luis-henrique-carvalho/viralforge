import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ItemCard } from './item-card'
import type { ViralItem } from '../data/batch.types'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

describe('ItemCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const item: ViralItem = {
    id: 'item-10',
    batch_id: 'batch-10',
    source_url: 'https://tiktok.com/@user/video/10',
    product_code: 'PROD-10',
    selected_headline: 'Review do Suporte Magnético',
    caption: 'Compre com cupom no link da bio! #achados',
    status: 'READY_FOR_REVIEW',
    rendered_path: '/data/rendered/10.mp4',
    keyframe_urls: [],
    logs: [],
    publication_records: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  it('renders item card details and triggers inspect, copy and approve', () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })

    const onInspect = vi.fn()
    const onApprove = vi.fn()

    render(
      <ItemCard
        item={item}
        onInspect={onInspect}
        onApprove={onApprove}
      />,
    )

    expect(screen.getByText('PROD-10')).toBeInTheDocument()
    expect(screen.getByText('Review do Suporte Magnético')).toBeInTheDocument()

    // Copy caption
    fireEvent.click(screen.getByText('Legenda'))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'Compre com cupom no link da bio! #achados',
    )

    // Click Logs
    fireEvent.click(screen.getByText('Logs'))
    expect(onInspect).toHaveBeenCalledWith(item)

    // Click Approve
    fireEvent.click(screen.getByText('Aprovar Vídeo'))
    expect(onApprove).toHaveBeenCalledWith('item-10')
  })

  it('renders retry button when status is FAILED and triggers onRetry', () => {
    const onRetry = vi.fn()
    const failedItem: ViralItem = {
      ...item,
      status: 'FAILED',
      error_message: 'Download error',
    }

    render(
      <ItemCard
        item={failedItem}
        onRetry={onRetry}
      />,
    )

    const retryBtn = screen.getByText('Tentar Novamente')
    expect(retryBtn).toBeInTheDocument()
    fireEvent.click(retryBtn)
    expect(onRetry).toHaveBeenCalledWith('item-10')
  })

  it('renders selectable checkbox when isSelectable is true', () => {
    const onToggleSelect = vi.fn()
    render(
      <ItemCard
        item={item}
        isSelectable
        isSelected={false}
        onToggleSelect={onToggleSelect}
      />,
    )

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeInTheDocument()
    fireEvent.click(checkbox)
    expect(onToggleSelect).toHaveBeenCalledWith('item-10')
  })

  it('triggers onEdit when custom callback is supplied', () => {
    const onEdit = vi.fn()
    render(
      <ItemCard
        item={item}
        onEdit={onEdit}
      />,
    )

    const editBtn = screen.getByRole('button', { name: /Editar/i })
    fireEvent.click(editBtn)
    expect(onEdit).toHaveBeenCalledWith(item)
  })

  it('navigates to dedicated page when clicking Editar without onEdit callback', () => {
    render(
      <ItemCard
        item={item}
        batchId="batch-10"
      />,
    )

    const editBtn = screen.getByRole('button', { name: /Editar/i })
    fireEvent.click(editBtn)
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/viral-studio/$id/items/$itemId',
      params: { id: 'batch-10', itemId: 'item-10' },
    })

    const headlineBtn = screen.getByText('Review do Suporte Magnético')
    fireEvent.click(headlineBtn)
    expect(mockNavigate).toHaveBeenCalledTimes(2)
  })

  it('renders publish button for APPROVED item and triggers onPublish', () => {
    const onPublish = vi.fn()
    const approvedItem: ViralItem = {
      ...item,
      status: 'APPROVED',
    }

    render(
      <ItemCard
        item={approvedItem}
        onPublish={onPublish}
      />,
    )

    const publishBtn = screen.getByTitle('Publicar Vídeo')
    expect(publishBtn).toBeInTheDocument()
    fireEvent.click(publishBtn)
    expect(onPublish).toHaveBeenCalledWith(approvedItem)
  })

  it('renders scheduled badge and triggers onCancelSchedule when SCHEDULED', () => {
    const onCancelSchedule = vi.fn()
    const scheduledItem: ViralItem = {
      ...item,
      status: 'SCHEDULED',
      scheduled_for: '2026-10-15T18:00:00Z',
    }

    render(
      <ItemCard
        item={scheduledItem}
        onCancelSchedule={onCancelSchedule}
      />,
    )

    expect(screen.getByTitle('Cancelar Agendamento')).toBeInTheDocument()
    fireEvent.click(screen.getByTitle('Cancelar Agendamento'))
    expect(onCancelSchedule).toHaveBeenCalledWith('item-10')
  })

  it('renders published badge and link to post when PUBLISHED', () => {
    const publishedItem: ViralItem = {
      ...item,
      status: 'PUBLISHED',
      post_url: 'https://tiktok.com/@brand/video/999',
    }

    render(<ItemCard item={publishedItem} />)

    expect(screen.getAllByText('Publicado').length).toBeGreaterThan(0)
    expect(screen.getByTitle('Ver Post')).toHaveAttribute(
      'href',
      'https://tiktok.com/@brand/video/999',
    )
  })
})
