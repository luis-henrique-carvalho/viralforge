import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render'
import { ViralEditorPreview } from './viral-editor-preview'
import type { ViralItem } from '../data/batch.types'

const baseItem: ViralItem = {
  id: 'item-1',
  batch_id: 'batch-101',
  brand_id: 'vale-o-clique',
  model: 'gemini-2.5-flash',
  source_url: 'https://tiktok.com/@user/video/1',
  product_code: 'PROD-01',
  product_url: null,
  manual_headline: null,
  additional_instructions: null,
  selected_headline: 'Headline Preview',
  caption: null,
  ai_copy: null,
  status: 'READY_FOR_REVIEW',
  source_path: '/data/sources/item-1.mp4',
  rendered_path: '/data/rendered/item-1.mp4',
  error_message: null,
  job_id: null,
  source_metadata: null,
  ai_context_summary: null,
  ai_telemetry: null,
  keyframe_urls: ['/data/keyframes/item-1-0.jpg'],
  logs: [],
  publication_records: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('ViralEditorPreview', () => {
  it('renders video element when rendered_path is present and handles re-render click', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <ViralEditorPreview
        item={baseItem}
        currentHeadline="Minha Nova Headline"
        batchId="batch-101"
      />,
    )

    const reRenderBtn = screen.getByRole('button', { name: /Re-renderizar vídeo/i })
    expect(reRenderBtn).toBeInTheDocument()

    await user.click(reRenderBtn)
  })

  it('renders rendering state overlay when status is RENDERING', () => {
    const renderingItem: ViralItem = {
      ...baseItem,
      status: 'RENDERING',
      rendered_path: null,
    }

    renderWithProviders(
      <ViralEditorPreview
        item={renderingItem}
        currentHeadline="Headline em Render"
        batchId="batch-101"
      />,
    )

    expect(screen.getByText(/Renderizando vídeo 9:16…/i)).toBeInTheDocument()
  })
})
