import { describe, expect, it } from 'vitest'
import { renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { renderWithProviders } from '@/test-utils/render'
import { ViralEditorCaptionTab } from './viral-editor-caption-tab'
import type { ItemEditorFormData } from '../data/item-editor.schema'
import type { Brand } from '../data/batch.types'

const mockBrand: Brand = {
  id: 'vale-o-clique',
  name: 'Vale o Clique?',
  handle: '@valeoclique',
  avatar_path: null,
  logo_path: null,
  default_cta: 'Confira os achadinhos no link da bio!',
  default_affiliate_url: 'https://amzn.to/default',
  template_id: 'classic-affiliate',
  publishing_profiles: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('ViralEditorCaptionTab', () => {
  it('renders caption textarea, brand CTA, and triggers copy button', async () => {
    const user = userEvent.setup()
    const { result } = renderHook(() =>
      useForm<ItemEditorFormData>({
        defaultValues: {
          selected_headline: 'Headline',
          caption: 'Minha Legenda Comercial com #achadinhos',
          product_code: '',
          product_url: '',
        },
      }),
    )

    renderWithProviders(
      <ViralEditorCaptionTab
        form={result.current}
        brand={mockBrand}
      />,
    )

    expect(screen.getByDisplayValue(/Minha Legenda Comercial/i)).toBeInTheDocument()
    expect(screen.getByText(/Confira os achadinhos no link da bio!/i)).toBeInTheDocument()

    const copyBtn = screen.getByRole('button', { name: /Copiar/i })
    await user.click(copyBtn)
    expect(screen.getByText('Copiado')).toBeInTheDocument()
  })
})
