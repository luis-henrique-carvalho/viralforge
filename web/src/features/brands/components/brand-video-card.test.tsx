import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { BrandVideoCard } from './brand-video-card'
import type { ViralItem } from '@/features/viral-studio/data/batch.types'

const baseVideo: ViralItem = {
  id: 'item-101',
  batch_id: 'batch-101',
  brand_id: 'vale-o-clique',
  model: 'gemini-2.5-flash',
  source_url: 'https://tiktok.com/@test/1',
  product_code: 'P-1',
  product_url: null,
  manual_headline: null,
  additional_instructions: null,
  selected_headline: 'Headline Incrível de Teste',
  caption: 'Legenda explicativa do vídeo',
  ai_copy: null,
  status: 'READY_FOR_REVIEW',
  source_path: null,
  rendered_path: '/data/rendered/item-101.mp4',
  error_message: null,
  job_id: null,
  source_metadata: null,
  ai_context_summary: null,
  ai_telemetry: null,
  keyframe_urls: [],
  logs: [],
  publication_records: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('BrandVideoCard', () => {
  it('renders READY_FOR_REVIEW state and triggers approve', () => {
    const onApprove = vi.fn()
    render(
      <BrandVideoCard
        video={baseVideo}
        onApprove={onApprove}
        onAutoSchedule={vi.fn()}
        onOpenPublishModal={vi.fn()}
        isAutoSchedulePending={false}
      />,
    )

    expect(screen.getByText('Pronto p/ Revisão')).toBeInTheDocument()
    expect(screen.getByText('Headline Incrível de Teste')).toBeInTheDocument()
    const approveBtn = screen.getByRole('button', { name: /Aprovar Vídeo/i })
    fireEvent.click(approveBtn)
    expect(onApprove).toHaveBeenCalledWith(baseVideo)
  })

  it('renders APPROVED state and triggers auto-schedule and publish modal', () => {
    const onAutoSchedule = vi.fn()
    const onOpenPublishModal = vi.fn()
    const approvedVideo: ViralItem = { ...baseVideo, status: 'APPROVED' }

    render(
      <BrandVideoCard
        video={approvedVideo}
        onApprove={vi.fn()}
        onAutoSchedule={onAutoSchedule}
        onOpenPublishModal={onOpenPublishModal}
        isAutoSchedulePending={false}
      />,
    )

    expect(screen.getByText('Aprovado')).toBeInTheDocument()
    const autoScheduleBtn = screen.getByRole('button', { name: /Auto-Agendar/i })
    fireEvent.click(autoScheduleBtn)
    expect(onAutoSchedule).toHaveBeenCalledWith(approvedVideo)

    const customizeBtn = screen.getByRole('button', { name: /Personalizar\.\.\./i })
    fireEvent.click(customizeBtn)
    expect(onOpenPublishModal).toHaveBeenCalledWith(approvedVideo)
  })

  it('renders SCHEDULED state and triggers navigation to schedule tab', () => {
    const onNavigateToTab = vi.fn()
    const scheduledVideo: ViralItem = { ...baseVideo, status: 'SCHEDULED' }

    render(
      <BrandVideoCard
        video={scheduledVideo}
        onApprove={vi.fn()}
        onAutoSchedule={vi.fn()}
        onOpenPublishModal={vi.fn()}
        onNavigateToTab={onNavigateToTab}
        isAutoSchedulePending={false}
      />,
    )

    expect(screen.getByText('Agendado')).toBeInTheDocument()
    const viewQueueBtn = screen.getByRole('button', { name: /Ver na Fila/i })
    fireEvent.click(viewQueueBtn)
    expect(onNavigateToTab).toHaveBeenCalledWith('schedule')
  })

  it('renders PUBLISHED state and triggers metrics view', () => {
    const onNavigateToTab = vi.fn()
    const publishedVideo: ViralItem = { ...baseVideo, status: 'PUBLISHED', rendered_path: null }

    render(
      <BrandVideoCard
        video={publishedVideo}
        onApprove={vi.fn()}
        onAutoSchedule={vi.fn()}
        onOpenPublishModal={vi.fn()}
        onNavigateToTab={onNavigateToTab}
        isAutoSchedulePending={false}
      />,
    )

    expect(screen.getByText('Publicado')).toBeInTheDocument()
    const metricsBtn = screen.getByRole('button', { name: /Ver Métricas/i })
    fireEvent.click(metricsBtn)
    expect(onNavigateToTab).toHaveBeenCalledWith('schedule')
  })
})
