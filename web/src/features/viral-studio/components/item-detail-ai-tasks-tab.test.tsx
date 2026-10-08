import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/react'
import { ItemDetailAiTasksTab } from './item-detail-ai-tasks-tab'
import { Tabs } from '@/components/ui/tabs'
import type { ViralItem } from '../data/batch.types'

const baseItem: ViralItem = {
  id: 'test-item-detail-tasks',
  source_url: 'https://tiktok.com/@video/456',
  status: 'READY_FOR_REVIEW',
  selected_headline: 'Headline Teste',
  badge_text: 'OFERTA RELÂMPAGO ⚡',
  footer_text: 'Deixe sua opinião nos comentários!',
  social_title: 'Como montar seu setup minimalista',
  ai_copy: {
    product: 'Luminária LED',
    product_description: 'Luminária LED de mesa articulada',
    headlines: ['Headline 1'],
    selected_headline: 'Headline 1',
    caption: 'Legenda',
    hashtags: ['#setup', '#tech'],
    custom_outputs: {
      badge_text: 'OFERTA RELÂMPAGO ⚡',
      footer_text: 'Deixe sua opinião nos comentários!',
      social_title: 'Como montar seu setup minimalista',
      quiz: {
        question: 'Você prefere luz quente ou fria?',
        options: ['Luz quente', 'Luz fria', 'RGB'],
      },
      keyword_tags: 'led, iluminação, homeoffice',
    },
  },
  keyframe_urls: [],
  logs: [],
  publication_records: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('ItemDetailAiTasksTab', () => {
  it('renders all task cards with values and handles copy', async () => {
    const user = userEvent.setup()
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText')

    render(
      <Tabs defaultValue="tasks">
        <ItemDetailAiTasksTab item={baseItem} />
      </Tabs>,
    )

    expect(screen.getByText('Badge Dinâmico do Canvas')).toBeInTheDocument()
    expect(screen.getByText('OFERTA RELÂMPAGO ⚡')).toBeInTheDocument()

    expect(screen.getByText('Texto de Rodapé / Comentário')).toBeInTheDocument()
    expect(screen.getByText('Deixe sua opinião nos comentários!')).toBeInTheDocument()

    expect(screen.getByText('Título Social (YouTube Shorts / TikTok)')).toBeInTheDocument()
    expect(screen.getByText('Como montar seu setup minimalista')).toBeInTheDocument()

    expect(screen.getByText('Enquete / Quiz Interativo')).toBeInTheDocument()
    expect(screen.getByText('Você prefere luz quente ou fria?')).toBeInTheDocument()
    expect(screen.getByText('Luz quente')).toBeInTheDocument()

    expect(screen.getByText(/keyword tags/i)).toBeInTheDocument()
    expect(screen.getByText('led, iluminação, homeoffice')).toBeInTheDocument()

    // Test copy button
    const copyButtons = screen.getAllByRole('button', { name: /copiar/i })
    await user.click(copyButtons[0])
    expect(writeTextSpy).toHaveBeenCalled()
  })

  it('renders empty state when item has no tasks', () => {
    const emptyItem: ViralItem = {
      ...baseItem,
      badge_text: null,
      footer_text: null,
      social_title: null,
      ai_copy: {
        ...baseItem.ai_copy!,
        custom_outputs: {},
      },
    }

    render(
      <Tabs defaultValue="tasks">
        <ItemDetailAiTasksTab item={emptyItem} />
      </Tabs>,
    )

    expect(screen.getByText('Nenhuma tarefa de IA gerada')).toBeInTheDocument()
  })
})
