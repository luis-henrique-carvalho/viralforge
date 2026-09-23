import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render'
import { CopyRegenerationCard } from './copy-regeneration-card'
import type { ViralItem } from '../data/batch.types'

const mockItem: ViralItem = {
  id: 'item-1',
  batch_id: 'batch-101',
  brand_id: 'vale-o-clique',
  model: 'gemini-2.5-flash',
  source_url: 'https://www.tiktok.com/@user/video/111111',
  product_code: 'PROD-01',
  product_url: null,
  manual_headline: null,
  additional_instructions: null,
  selected_headline: 'Headline Original',
  caption: 'Legenda Original',
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
  logs: [],
  publication_records: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('CopyRegenerationCard', () => {
  it('renders model selector and triggers copy regeneration', async () => {
    const user = userEvent.setup()
    const onCopyRegenerated = vi.fn()

    renderWithProviders(
      <CopyRegenerationCard
        item={mockItem}
        batchId="batch-101"
        onCopyRegenerated={onCopyRegenerated}
      />,
    )

    expect(screen.getByText(/Regerar Copy Comercial com IA/i)).toBeInTheDocument()

    const instructionsInput = screen.getByPlaceholderText(/Ex: Focar no desconto/i)
    await user.type(instructionsInput, 'Focar em praticidade e desconto de 20%')

    const regenBtn = screen.getByRole('button', { name: /Regerar Copy/i })
    await user.click(regenBtn)

    await waitFor(() => {
      expect(onCopyRegenerated).toHaveBeenCalled()
    })
  })
})
