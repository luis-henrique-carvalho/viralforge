import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render'
import { ObservabilityTimelineView } from './observability-timeline-view'
import type { ViralItem } from '../data/batch.types'

const itemWithLogs: ViralItem = {
  id: 'item-1',
  batch_id: 'batch-101',
  brand_id: 'vale-o-clique',
  model: 'gemini-2.5-flash',
  source_url: 'https://tiktok.com/@user/video/1',
  product_code: 'PROD-01',
  product_url: null,
  manual_headline: null,
  additional_instructions: null,
  selected_headline: 'Headline Teste',
  caption: 'Legenda Teste',
  ai_copy: null,
  status: 'READY_FOR_REVIEW',
  source_path: null,
  rendered_path: null,
  error_message: null,
  job_id: null,
  source_metadata: null,
  ai_context_summary: null,
  ai_telemetry: null,
  keyframe_urls: [],
  logs: [
    {
      stage: 'DOWNLOAD',
      level: 'info',
      message: 'Vídeo baixado com sucesso',
      timestamp: '2026-09-22T00:00:00Z',
    },
    {
      stage: 'ERROR',
      level: 'error',
      message: 'Falha temporária',
      details: { code: 500, reason: 'Timeout' },
      timestamp: '2026-09-22T00:01:00Z',
    },
    {
      stage: 'COMPLETE',
      level: 'info',
      message: 'Etapa concluída',
      timestamp: '2026-09-22T00:02:00Z',
    },
  ],
  publication_records: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('ObservabilityTimelineView', () => {
  it('renders log entries with formatted stages and details', () => {
    renderWithProviders(<ObservabilityTimelineView item={itemWithLogs} />)

    expect(screen.getByText('3 eventos')).toBeInTheDocument()
    expect(screen.getByText(/Vídeo baixado com sucesso/i)).toBeInTheDocument()
    expect(screen.getByText(/Falha temporária/i)).toBeInTheDocument()
    expect(screen.getByText(/Etapa concluída/i)).toBeInTheDocument()
    expect(screen.getByText(/Timeout/i)).toBeInTheDocument()
  })

  it('renders fallback message when logs array is empty', () => {
    const emptyItem: ViralItem = {
      ...itemWithLogs,
      logs: [],
    }

    renderWithProviders(<ObservabilityTimelineView item={emptyItem} />)
    expect(screen.getByText('Nenhum log registrado para este item.')).toBeInTheDocument()
  })

  it('copies formatted logs to clipboard when clicking Copiar Logs button', async () => {
    const user = userEvent.setup()
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText')

    renderWithProviders(<ObservabilityTimelineView item={itemWithLogs} />)
    const copyBtn = screen.getByRole('button', { name: /Copiar Logs/i })
    await user.click(copyBtn)

    expect(writeTextSpy).toHaveBeenCalled()
    expect(screen.getByText('Copiado')).toBeInTheDocument()
  })
})

