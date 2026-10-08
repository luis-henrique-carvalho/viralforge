import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render'
import { useForm } from 'react-hook-form'
import { ViralEditorTabsSection } from './viral-editor-tabs-section'
import type { ItemEditorFormData } from '../data/item-editor.schema'
import type { ViralItem } from '../data/batch.types'

const mockItem: ViralItem = {
  id: 'test-item-editor-tabs',
  source_url: 'https://tiktok.com/@video/123',
  status: 'READY_FOR_REVIEW',
  selected_headline: 'Headline Teste',
  badge_text: 'BADGE TESTE',
  footer_text: 'RODAPE TESTE',
  social_title: 'TITULO SOCIAL TESTE',
  ai_copy: {
    product: 'Produto Teste',
    product_description: 'Descrição do produto teste',
    headlines: ['Headline Teste'],
    selected_headline: 'Headline Teste',
    caption: 'Legenda Teste',
    hashtags: ['#teste'],
    custom_outputs: {},
  },
  keyframe_urls: [],
  logs: [],
  publication_records: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

function WrapperTabsSection({
  activeTab = 'headlines',
  onActiveTabChange = vi.fn(),
}: {
  activeTab?: string
  onActiveTabChange?: (tab: string) => void
}) {
  const form = useForm<ItemEditorFormData>({
    defaultValues: {
      selected_headline: 'Headline Teste',
      caption: 'Legenda Teste',
      product_code: 'PROD-01',
      product_url: '',
      badge_text: 'BADGE TESTE',
      footer_text: 'RODAPE TESTE',
      social_title: 'TITULO SOCIAL TESTE',
    },
  })

  return (
    <ViralEditorTabsSection
      item={mockItem}
      activeTab={activeTab}
      onActiveTabChange={onActiveTabChange}
      form={form}
      batchId="batch-1"
      applyHeadline={vi.fn()}
      applyRegeneratedData={vi.fn()}
    />
  )
}

describe('ViralEditorTabsSection', () => {
  it('renders all 5 tabs including Tarefas IA', async () => {
    const handleActiveTabChange = vi.fn()
    const user = userEvent.setup()

    renderWithProviders(
      <WrapperTabsSection
        activeTab="headlines"
        onActiveTabChange={handleActiveTabChange}
      />,
    )

    expect(screen.getByRole('tab', { name: /Headlines/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Legenda/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Tarefas IA/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Detalhes/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Observabilidade/i })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /Tarefas IA/i }))
    expect(handleActiveTabChange).toHaveBeenCalledWith('tasks')
  })

  it('renders ViralEditorAiTasksTab content when activeTab is tasks', () => {
    renderWithProviders(<WrapperTabsSection activeTab="tasks" />)

    expect(screen.getByLabelText(/Badge Dinâmico do Canvas/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('BADGE TESTE')).toBeInTheDocument()
    expect(screen.getByLabelText(/Texto do Card de Rodapé/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('RODAPE TESTE')).toBeInTheDocument()
    expect(screen.getByLabelText(/Título Social/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('TITULO SOCIAL TESTE')).toBeInTheDocument()
  })
})
