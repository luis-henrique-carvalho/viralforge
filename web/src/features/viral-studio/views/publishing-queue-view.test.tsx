import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from '@/test-utils/render'
import { PublishingQueueView } from './publishing-queue-view'

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

const mockRefetch = vi.fn()
const mockRetryMutate = vi.fn()

vi.mock('../hooks/use-publishing-queue', () => ({
  usePublishingQueue: vi.fn(() => ({
    data: {
      total: 2,
      active_count: 1,
      failed_count: 1,
      jobs: [
        {
          job_id: 'job-1',
          item_id: 'item-1',
          brand_id: 'brand-alpha',
          brand_name: 'Brand Alpha',
          channel_ids: ['ch-1'],
          channel_names: ['Instagram'],
          provider: 'postiz',
          status: 'QUEUED',
          publish_now: true,
          title: 'Primeiro Envio',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          receipts: [],
        },
        {
          job_id: 'job-2',
          item_id: 'item-2',
          brand_id: 'brand-alpha',
          brand_name: 'Brand Alpha',
          channel_ids: ['ch-2'],
          channel_names: ['TikTok'],
          provider: 'postiz',
          status: 'FAILED',
          error: 'Credenciais inválidas',
          publish_now: true,
          title: 'Segundo Envio',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          receipts: [],
        },
      ],
    },
    isLoading: false,
    isRefetching: false,
    refetch: mockRefetch,
  })),
  useRetryPublishingDispatch: vi.fn(() => ({
    mutate: mockRetryMutate,
    isPending: false,
  })),
}))

describe('PublishingQueueView', () => {
  it('renders header, metrics cards, job list, and handles filter and retry', () => {
    const qc = createTestQueryClient()
    render(
      <QueryClientProvider client={qc}>
        <PublishingQueueView />
      </QueryClientProvider>,
    )

    expect(screen.getByText('Fila de Envios & Auditoria')).toBeInTheDocument()
    expect(screen.getByText('Primeiro Envio')).toBeInTheDocument()
    expect(screen.getByText('Segundo Envio')).toBeInTheDocument()

    // Test refresh button
    const refreshBtn = screen.getByRole('button', { name: /Atualizar/i })
    fireEvent.click(refreshBtn)
    expect(mockRefetch).toHaveBeenCalled()

    // Test filter tabs
    const failedFilterTab = screen.getByRole('tab', { name: /Com Falha/i })
    fireEvent.click(failedFilterTab)

    const uploadingFilterTab = screen.getByRole('tab', { name: /Em Andamento/i })
    fireEvent.click(uploadingFilterTab)

    const scheduledFilterTab = screen.getByRole('tab', { name: /Agendados/i })
    fireEvent.click(scheduledFilterTab)

    const publishedFilterTab = screen.getByRole('tab', { name: /Publicados/i })
    fireEvent.click(publishedFilterTab)

    const allFilterTab = screen.getByRole('tab', { name: /Todos os Envios/i })
    fireEvent.click(allFilterTab)

    // Test retry click on failed card
    const retryBtn = screen.getByRole('button', { name: /Tentar Novamente/i })
    fireEvent.click(retryBtn)
    expect(mockRetryMutate).toHaveBeenCalledWith('job-2')
  })

  it('renders skeleton cards when isLoading is true', async () => {
    const { usePublishingQueue } = await import('../hooks/use-publishing-queue')
    vi.mocked(usePublishingQueue).mockReturnValueOnce({
      data: undefined,
      isLoading: true,
      isRefetching: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof usePublishingQueue>)

    const qc = createTestQueryClient()
    const { container } = render(
      <QueryClientProvider client={qc}>
        <PublishingQueueView />
      </QueryClientProvider>,
    )
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders empty state when there are no jobs and not loading', async () => {
    const { usePublishingQueue } = await import('../hooks/use-publishing-queue')
    vi.mocked(usePublishingQueue).mockReturnValueOnce({
      data: {
        total: 0,
        active_count: 0,
        failed_count: 0,
        jobs: [],
      },
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof usePublishingQueue>)

    const qc = createTestQueryClient()
    render(
      <QueryClientProvider client={qc}>
        <PublishingQueueView />
      </QueryClientProvider>,
    )
    expect(screen.getByText('Nenhum envio encontrado')).toBeInTheDocument()
  })
})
