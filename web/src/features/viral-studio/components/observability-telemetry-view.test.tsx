import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render'
import { ObservabilityTelemetryView } from './observability-telemetry-view'
import type { ViralItem } from '../data/batch.types'

const itemWithTelemetry: ViralItem = {
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
  ai_telemetry: {
    model: 'gemini-2.5-flash',
    prompt_tokens: 450,
    candidate_tokens: 120,
    total_tokens: 570,
    estimated_cost_usd: 0.00015,
    latency_ms: 820,
    prompt: 'Prompt de teste para a LLM',
    raw_response: '{"product": "Teste"}',
  },
  keyframe_urls: [],
  logs: [{ stage: 'AI_ROUTING', details: { target_model: 'gemini-2.5-flash' } }],
  publication_records: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('ObservabilityTelemetryView', () => {
  it('renders all 6 metric cards and prompt/response viewers with copy action', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ObservabilityTelemetryView item={itemWithTelemetry} />)

    expect(screen.getByText('gemini-2.5-flash')).toBeInTheDocument()
    expect(screen.getByText('450')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.getByText('570')).toBeInTheDocument()
    expect(screen.getByText('$0.00015')).toBeInTheDocument()
    expect(screen.getByText('820 ms')).toBeInTheDocument()

    const copyBtns = screen.getAllByRole('button', { name: /Copiar/i })
    expect(copyBtns.length).toBe(2)
    await user.click(copyBtns[0])
  })

  it('renders dashes when telemetry data is missing', () => {
    const emptyItem: ViralItem = {
      ...itemWithTelemetry,
      ai_telemetry: null,
      logs: [],
    }

    renderWithProviders(<ObservabilityTelemetryView item={emptyItem} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })
})
