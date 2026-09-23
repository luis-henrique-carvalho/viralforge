import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render'
import { BatchCard } from './batch-card'
import type { BatchResponse } from '../data/batch.types'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    className,
  }: {
    children: React.ReactNode
    to: string
    className?: string
  }) => (
    <a
      href={to}
      className={className}
    >
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}))

describe('BatchCard', () => {
  const mockBatch: BatchResponse = {
    id: 'batch-abc',
    batch_id: 'batch-abc',
    brand_id: 'vale-o-clique',
    model: 'gemini-2.5-flash',
    status: 'PROCESSING',
    total_items: 2,
    items: [
      {
        id: 'item-1',
        source_url: 'https://tiktok.com/@user/video/1',
        status: 'READY_FOR_REVIEW',
        keyframe_urls: [],
        logs: [],
        publication_records: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'item-2',
        source_url: 'https://tiktok.com/@user/video/2',
        status: 'ANALYZING',
        keyframe_urls: [],
        logs: [],
        publication_records: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  it('renders batch card with brand, model, and item counts', () => {
    renderWithProviders(<BatchCard batch={mockBatch} />)

    expect(screen.getByText('batch-abc')).toBeInTheDocument()
    expect(screen.getByText('vale-o-clique')).toBeInTheDocument()
    expect(screen.getByText('gemini-2.5-flash')).toBeInTheDocument()
    expect(screen.getByText('2 vídeos')).toBeInTheDocument()
    expect(screen.getByText('1 prontos')).toBeInTheDocument()
    expect(screen.getByText('1 processando')).toBeInTheDocument()
    expect(screen.getByText('Ver Resultados do Lote')).toBeInTheDocument()
  })

  it('renders FAILED badge when all items in batch fail', () => {
    const failedBatch: BatchResponse = {
      ...mockBatch,
      items: [
        {
          id: 'item-1',
          source_url: 'https://tiktok.com/@user/video/1',
          status: 'FAILED',
          keyframe_urls: [],
          logs: [],
          publication_records: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    }
    renderWithProviders(<BatchCard batch={failedBatch} />)
    expect(screen.getByText('Falha')).toBeInTheDocument()
    expect(screen.getByText('1 falha')).toBeInTheDocument()
  })
})
