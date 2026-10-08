import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { ViralEditorAiTasksTab } from './viral-editor-ai-tasks-tab'
import type { ItemEditorFormData } from '../data/item-editor.schema'
import type { ViralItem } from '../data/batch.types'

const mockItem: ViralItem = {
  id: 'test-item-tasks-1',
  source_url: 'https://tiktok.com/@video/123',
  status: 'READY_FOR_REVIEW',
  selected_headline: 'Headline Teste',
  badge_text: 'SUPER ACHADO 🔥',
  footer_text: 'Comente QUERO para receber o link!',
  social_title: 'Como limpar panela sem esforço',
  ai_copy: {
    product: 'Panela Antiaderente',
    product_description: 'Descrição da panela',
    headlines: ['Headline 1'],
    selected_headline: 'Headline 1',
    caption: 'Legenda',
    hashtags: ['#achadinhos'],
    custom_outputs: {
      badge_text: 'SUPER ACHADO 🔥',
      footer_text: 'Comente QUERO para receber o link!',
      social_title: 'Como limpar panela sem esforço',
      seo_tags: 'panela, limpeza, cozinha',
    },
  },
  keyframe_urls: [],
  logs: [],
  publication_records: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

function WrapperComponent({ item = mockItem }: { item?: ViralItem }) {
  const form = useForm<ItemEditorFormData>({
    defaultValues: {
      selected_headline: item.selected_headline || '',
      caption: item.caption || '',
      product_code: item.product_code || '',
      product_url: item.product_url || '',
      badge_text: item.badge_text || '',
      footer_text: item.footer_text || '',
      social_title: item.social_title || '',
    },
  })

  return (
    <ViralEditorAiTasksTab
      item={item}
      form={form}
    />
  )
}

describe('ViralEditorAiTasksTab', () => {
  it('renders input fields for badge_text, footer_text and social_title', () => {
    render(<WrapperComponent />)

    expect(screen.getByLabelText(/Badge Dinâmico do Canvas/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Texto do Card de Rodapé/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Título Social/i)).toBeInTheDocument()

    expect(screen.getByDisplayValue('SUPER ACHADO 🔥')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Comente QUERO para receber o link!')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Como limpar panela sem esforço')).toBeInTheDocument()
  })

  it('renders extra outputs section when present', () => {
    render(<WrapperComponent />)

    expect(screen.getByText(/Outras Saídas de IA/i)).toBeInTheDocument()
    expect(screen.getByText(/seo tags/i)).toBeInTheDocument()
    expect(screen.getByText('panela, limpeza, cozinha')).toBeInTheDocument()
  })

  it('allows user to type into fields', async () => {
    const user = userEvent.setup()
    render(<WrapperComponent />)

    const badgeInput = screen.getByLabelText(/Badge Dinâmico do Canvas/i)
    await user.clear(badgeInput)
    await user.type(badgeInput, 'NOVO BADGE')

    expect(badgeInput).toHaveValue('NOVO BADGE')
  })
})
