import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ViralPublishDialog } from './viral-publish-dialog'
import type { ViralItem } from '../data/batch.types'
import type { SocialAccount, SlotProjection, ViralPublishResult } from '../data/publishing.types'

const mockAccounts: SocialAccount[] = [
  {
    id: 'acc-tiktok-1',
    name: '@canaltech_achadinhos',
    platform: 'tiktok',
    connected: true,
  },
  {
    id: 'acc-insta-1',
    name: '@achadinhos_insta',
    platform: 'instagram',
    connected: true,
  },
]

const mockSlots: SlotProjection[] = [
  {
    index: 0,
    datetime: '2026-10-15T18:00:00Z',
    formatted: '15/10/2026 18:00',
  },
  {
    index: 1,
    datetime: '2026-10-16T18:00:00Z',
    formatted: '16/10/2026 18:00',
  },
]

const mockMutateAsync = vi.fn()

vi.mock('../hooks/use-publishing', () => ({
  usePublishingAccounts: vi.fn(() => ({
    data: mockAccounts,
    isLoading: false,
  })),
  usePreviewSlots: vi.fn(() => ({
    data: {
      account_id: 'acc-tiktok-1',
      count: 2,
      projected_slots: mockSlots,
    },
    isLoading: false,
  })),
  usePublishItems: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}))

describe('ViralPublishDialog', () => {
  const items: ViralItem[] = [
    {
      id: 'item-1',
      batch_id: 'batch-1',
      source_url: 'https://tiktok.com/@u/1',
      product_code: 'P-1',
      selected_headline: 'Vídeo 1 Incrível',
      caption: 'Legenda 1',
      status: 'APPROVED',
      keyframe_urls: [],
      logs: [],
      publication_records: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'item-2',
      batch_id: 'batch-1',
      source_url: 'https://tiktok.com/@u/2',
      product_code: 'P-2',
      selected_headline: 'Vídeo 2 Top',
      caption: 'Legenda 2',
      status: 'APPROVED',
      keyframe_urls: [],
      logs: [],
      publication_records: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dialog header, account options, and projected slots for auto mode', () => {
    render(
      <ViralPublishDialog
        isOpen={true}
        onClose={vi.fn()}
        items={items}
        batchId="batch-1"
      />,
    )

    expect(screen.getByText('Publicar / Agendar 2 Vídeos')).toBeInTheDocument()
    expect(screen.getByText('@canaltech_achadinhos')).toBeInTheDocument()
    expect(screen.getByText('@achadinhos_insta')).toBeInTheDocument()
    expect(screen.getByText('Fila Inteligente Contínua')).toBeInTheDocument()
    expect(screen.getAllByText('15/10/2026 18:00').length).toBeGreaterThan(0)
    expect(screen.getByText('Confirmar Agendamento')).toBeInTheDocument()
  })

  it('allows switching to Publicar Agora mode', async () => {
    const user = userEvent.setup()

    render(
      <ViralPublishDialog
        isOpen={true}
        onClose={vi.fn()}
        items={items}
        batchId="batch-1"
      />,
    )

    const nowOption = screen.getByText('Publicar Agora')
    await user.click(nowOption)

    expect(screen.getByText('Confirmar Publicação')).toBeInTheDocument()
  })

  it('submits publishing request and displays results table on success', async () => {
    const user = userEvent.setup()
    const onPublished = vi.fn()
    const onClose = vi.fn()

    const publishResults: ViralPublishResult[] = [
      {
        item_id: 'item-1',
        status: 'scheduled',
        scheduled_for: '2026-10-15T18:00:00Z',
        post_id: 'post-100',
      },
      {
        item_id: 'item-2',
        status: 'scheduled',
        scheduled_for: '2026-10-16T18:00:00Z',
        post_id: 'post-101',
      },
    ]

    mockMutateAsync.mockResolvedValueOnce({
      batch_id: 'batch-1',
      total_items: 2,
      scheduled_count: 2,
      published_count: 0,
      failed_count: 0,
      results: publishResults,
    })

    render(
      <ViralPublishDialog
        isOpen={true}
        onClose={onClose}
        items={items}
        batchId="batch-1"
        onPublished={onPublished}
      />,
    )

    const confirmBtn = screen.getByText('Confirmar Agendamento')
    await user.click(confirmBtn)

    expect(mockMutateAsync).toHaveBeenCalledWith({
      item_ids: ['item-1', 'item-2'],
      platforms: [{ platform: 'tiktok', accountId: 'acc-tiktok-1' }],
      schedule_mode: 'auto',
    })

    await waitFor(() => {
      expect(screen.getByText(/2 de 2/)).toBeInTheDocument()
      expect(screen.getByText('Concluir')).toBeInTheDocument()
    })

    expect(onPublished).toHaveBeenCalledTimes(1)

    await user.click(screen.getByText('Concluir'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('displays error message if publish mutation rejects', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockRejectedValueOnce(new Error('Quota exceeded on TikTok'))

    render(
      <ViralPublishDialog
        isOpen={true}
        onClose={vi.fn()}
        items={items}
        batchId="batch-1"
      />,
    )

    const confirmBtn = screen.getByText('Confirmar Agendamento')
    await user.click(confirmBtn)

    await waitFor(() => {
      expect(screen.getByText('Quota exceeded on TikTok')).toBeInTheDocument()
    })
  })

  it('calls onClose when Cancelar is clicked', () => {
    const onClose = vi.fn()

    render(
      <ViralPublishDialog
        isOpen={true}
        onClose={onClose}
        items={items}
        batchId="batch-1"
      />,
    )

    fireEvent.click(screen.getByText('Cancelar'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
