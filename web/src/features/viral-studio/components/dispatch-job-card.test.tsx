import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactNode } from 'react'
import { DispatchJobCard } from './dispatch-job-card'
import type { DispatchJobRecord } from '../services/viral-studio.api'

// Mock TanStack Router Link
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: ReactNode
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

describe('DispatchJobCard', () => {
  const baseJob: DispatchJobRecord = {
    job_id: 'job-123',
    item_id: 'item-456',
    brand_id: 'brand-alpha',
    brand_name: 'Brand Alpha',
    channel_ids: ['ch-1', 'ch-2'],
    channel_names: ['Instagram', 'TikTok'],
    provider: 'postiz',
    status: 'QUEUED',
    publish_now: true,
    title: 'Meu Vídeo Viral',
    thumbnail_url: 'https://example.com/thumb.jpg',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    receipts: [],
  }

  it('renders queued job with thumbnail, title, and channel badges', () => {
    render(
      <DispatchJobCard
        job={baseJob}
        onRetry={vi.fn()}
        isRetrying={false}
      />,
    )
    expect(screen.getByText('Meu Vídeo Viral')).toBeInTheDocument()
    expect(screen.getByText('Na Fila')).toBeInTheDocument()
    expect(screen.getByText('Brand Alpha')).toBeInTheDocument()
    expect(screen.getByText('Ver na Marca')).toBeInTheDocument()
    expect(screen.getByText('Instagram')).toBeInTheDocument()
    expect(screen.getByText('TikTok')).toBeInTheDocument()
    expect(screen.getByAltText('Video thumbnail')).toBeInTheDocument()
  })

  it('renders uploading status badge when uploading', () => {
    const job: DispatchJobRecord = { ...baseJob, status: 'UPLOADING' }
    render(
      <DispatchJobCard
        job={job}
        onRetry={vi.fn()}
        isRetrying={false}
      />,
    )
    expect(screen.getByText('Enviando Vídeo...')).toBeInTheDocument()
  })

  it('renders scheduled status badge with slot timestamp', () => {
    const job: DispatchJobRecord = {
      ...baseJob,
      status: 'SCHEDULED',
      scheduled_for: '2026-10-01T15:00:00.000Z',
    }
    render(
      <DispatchJobCard
        job={job}
        onRetry={vi.fn()}
        isRetrying={false}
      />,
    )
    expect(screen.getByText('Agendado')).toBeInTheDocument()
    expect(screen.getByText(/Slot:/)).toBeInTheDocument()
  })

  it('renders published status badge and post link', () => {
    const job: DispatchJobRecord = {
      ...baseJob,
      status: 'PUBLISHED',
      receipts: [{ post_id: 'p-1', post_url: 'https://instagram.com/p/123', status: 'PUBLISHED' }],
    }
    render(
      <DispatchJobCard
        job={job}
        onRetry={vi.fn()}
        isRetrying={false}
      />,
    )
    expect(screen.getByText('Publicado')).toBeInTheDocument()
    expect(screen.getByText('Ver Post')).toBeInTheDocument()
  })

  it('renders failed status with error message and triggers onRetry on click', () => {
    const onRetry = vi.fn()
    const job: DispatchJobRecord = {
      ...baseJob,
      status: 'FAILED',
      error: 'Token expired',
    }
    render(
      <DispatchJobCard
        job={job}
        onRetry={onRetry}
        isRetrying={false}
      />,
    )
    expect(screen.getByText('Falha no Envio')).toBeInTheDocument()
    expect(screen.getByText('Token expired')).toBeInTheDocument()

    const retryBtn = screen.getByRole('button', { name: /Tentar Novamente/i })
    fireEvent.click(retryBtn)
    expect(onRetry).toHaveBeenCalledWith('job-123')
  })

  it('renders placeholder icon when thumbnail_url is missing', () => {
    const job: DispatchJobRecord = { ...baseJob, thumbnail_url: undefined }
    render(
      <DispatchJobCard
        job={job}
        onRetry={vi.fn()}
        isRetrying={false}
      />,
    )
    expect(screen.queryByAltText('Video thumbnail')).not.toBeInTheDocument()
  })

  it('renders loading spinner when isRetrying is true', () => {
    const job: DispatchJobRecord = { ...baseJob, status: 'FAILED' }
    render(
      <DispatchJobCard
        job={job}
        onRetry={vi.fn()}
        isRetrying={true}
      />,
    )
    const retryBtn = screen.getByRole('button', { name: /Tentar Novamente/i })
    expect(retryBtn).toBeDisabled()
  })

  it('renders PARTIAL_FAILED status, fallback title, and channel ID fallback when channel_names is missing', () => {
    const job: DispatchJobRecord = {
      ...baseJob,
      status: 'PARTIAL_FAILED',
      title: '',
      brand_name: undefined,
      channel_names: undefined,
      error: undefined,
    }
    render(
      <DispatchJobCard
        job={job}
        onRetry={vi.fn()}
        isRetrying={false}
      />,
    )
    expect(screen.getByText('Falha no Envio')).toBeInTheDocument()
    expect(screen.getByText('Vídeo #item-456')).toBeInTheDocument()
    expect(screen.getByText('ch-1')).toBeInTheDocument()
    expect(screen.getByText('ch-2')).toBeInTheDocument()
  })
})
