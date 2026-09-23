import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render'
import { ViralEditorObservabilityTab } from './viral-editor-observability-tab'
import type { ViralItem } from '../data/batch.types'

const fullItem: ViralItem = {
  id: 'item-1',
  batch_id: 'batch-101',
  brand_id: 'vale-o-clique',
  model: 'gemini-2.5-flash',
  source_url: 'https://tiktok.com/@user/video/1',
  product_code: 'PROD-01',
  product_url: null,
  manual_headline: null,
  additional_instructions: null,
  selected_headline: 'Headline',
  caption: 'Legenda',
  ai_copy: null,
  status: 'READY_FOR_REVIEW',
  source_path: null,
  rendered_path: null,
  error_message: null,
  job_id: null,
  source_metadata: { title: 'Post Original', uploader: '@canal' },
  ai_context_summary: {
    transcript: 'Transcrição do áudio gravado',
    keyframe_urls: ['https://example.com/k1.jpg'],
  },
  ai_telemetry: {
    model: 'gemini-2.5-flash',
    prompt_tokens: 300,
    candidate_tokens: 80,
    latency_ms: 540,
  },
  keyframe_urls: ['https://example.com/k1.jpg'],
  logs: [{ stage: 'RENDER', message: 'Renderização concluída', timestamp: '2026-09-22T00:00:00Z' }],
  publication_records: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('ViralEditorObservabilityTab', () => {
  it('switches between signals, telemetry, and timeline sub-tabs', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ViralEditorObservabilityTab item={fullItem} />)

    expect(screen.getByText('Sinais Extraídos')).toBeInTheDocument()
    expect(screen.getByText('Transcrição do áudio gravado')).toBeInTheDocument()

    const telemetryTab = screen.getByRole('tab', { name: /Telemetria da LLM/i })
    await user.click(telemetryTab)
    expect(screen.getByText('Prompt Tokens')).toBeInTheDocument()

    const timelineTab = screen.getByRole('tab', { name: /Linha do Tempo/i })
    await user.click(timelineTab)
    expect(screen.getByText(/Renderização concluída/i)).toBeInTheDocument()
  })
})
