import { describe, expect, it } from 'vitest'
import { renderHook, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { renderWithProviders } from '@/test-utils/render'
import { ViralEditorDetailsTab } from './viral-editor-details-tab'
import type { ItemEditorFormData } from '../data/item-editor.schema'
import type { Brand, ViralItem } from '../data/batch.types'

const mockItem: ViralItem = {
  id: 'item-1',
  batch_id: 'batch-101',
  brand_id: 'vale-o-clique',
  model: 'gemini-2.5-flash',
  source_url: 'https://tiktok.com/@user/video/1',
  product_code: 'PROD-01',
  product_url: 'https://amzn.to/prod01',
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
  logs: [],
  publication_records: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const mockBrand: Brand = {
  id: 'vale-o-clique',
  name: 'Vale o Clique?',
  handle: '@valeoclique',
  avatar_path: null,
  logo_path: null,
  default_cta: 'CTA padrão',
  default_affiliate_url: 'https://amzn.to/default',
  template_id: 'classic-affiliate',
  publishing_profiles: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('ViralEditorDetailsTab', () => {
  it('renders product code, affiliate url, and original source url', () => {
    const { result } = renderHook(() =>
      useForm<ItemEditorFormData>({
        defaultValues: {
          selected_headline: 'Headline',
          caption: 'Legenda',
          product_code: 'PROD-01',
          product_url: 'https://amzn.to/prod01',
        },
      }),
    )

    renderWithProviders(
      <ViralEditorDetailsTab
        item={mockItem}
        form={result.current}
        brand={mockBrand}
      />,
    )

    expect(screen.getByLabelText(/Código do Produto/i)).toHaveValue('PROD-01')
    expect(screen.getByLabelText(/Link Individual de Afiliado/i)).toHaveValue(
      'https://amzn.to/prod01',
    )
    expect(screen.getByText('https://tiktok.com/@user/video/1')).toBeInTheDocument()
  })
})
