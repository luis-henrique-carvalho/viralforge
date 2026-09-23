import { describe, expect, it, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render'
import { TemplateCard } from './template-card'
import type { VisualTemplate } from '../data/template.types'

const mockTemplate: VisualTemplate = {
  id: 'test-template',
  name: 'Template de Teste',
  is_system: false,
  width: 1080,
  height: 1920,
  background_color: '#0D1117',
  video_fit: 'contain',
  video_aspect: '1:1',
  video_x: null,
  video_y: 360,
  video_width: null,
  video_height: 1000,
  video_scale: 92,
  video_radius: 20,
  video_border_width: 2,
  video_border_color: '#3B82F6',
  video_shadow: 'deep',
  avatar_enabled: true,
  avatar_x: 60,
  avatar_y: 80,
  avatar_size: 100,
  brand_name_enabled: true,
  brand_name_font_size: 36,
  brand_name_color: '#F0F6FC',
  handle_font_size: 26,
  handle_color: '#8B949E',
  headline_enabled: true,
  headline_font: 'Montserrat-ExtraBold',
  headline_font_size: 48,
  headline_color: '#FFFFFF',
  headline_y: 130,
  headline_max_lines: 3,
  headline_margin_x: 60,
  headline_margin_top: 30,
  badge_enabled: true,
  custom_badge_text: 'PROMOÇÃO',
  custom_badge_bg_color: '#E11D48',
  custom_badge_text_color: '#FFFFFF',
  badge_y: 45,
  extra_image_enabled: false,
  extra_image_path: null,
  extra_image_url: null,
  extra_image_template_type: 'comment',
  extra_image_x: null,
  extra_image_y: 1420,
  extra_image_height: 340,
  extra_image_width: 92,
  extra_image_radius: 16,
  watermark_enabled: true,
  watermark_opacity: 0.7,
  watermark_position: 'bottom-right',
  niche_type: 'curiosities',
  persona_role: 'Roteirista focado em mistérios',
  tone_of_voice: 'Misterioso',
  conversion_goal: 'engagement',
  call_to_action_template: 'Siga para mais!',
  system_prompt_template: null,
  default_hashtags: ['#viral'],
  preferred_model: null,
  generation_tasks: [
    {
      id: 'task-1',
      label: 'Gancho',
      target: 'canvas_headline',
      instruction: 'Instrução',
      output_type: 'text',
      is_required: true,
    },
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('TemplateCard', () => {
  it('renders template information correctly', () => {
    const onOpen = vi.fn()
    const onDuplicate = vi.fn()
    const onDelete = vi.fn()

    renderWithProviders(
      <TemplateCard
        template={mockTemplate}
        onOpen={onOpen}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />,
    )

    expect(screen.getAllByText('Template de Teste').length).toBeGreaterThan(0)
    expect(screen.getByText('PROMOÇÃO')).toBeInTheDocument()
    expect(screen.getByText('Roteirista focado em mistérios')).toBeInTheDocument()
    expect(screen.getByText('1 Tarefas IA')).toBeInTheDocument()
  })

  it('triggers onOpen when button clicked', () => {
    const onOpen = vi.fn()
    const onDuplicate = vi.fn()

    renderWithProviders(
      <TemplateCard
        template={mockTemplate}
        onOpen={onOpen}
        onDuplicate={onDuplicate}
      />,
    )

    const openBtn = screen.getByRole('button', { name: /Estúdio 9:16/i })
    fireEvent.click(openBtn)
    expect(onOpen).toHaveBeenCalledWith(mockTemplate)
  })

  it('triggers dropdown menu actions for duplicate and delete', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    const onDuplicate = vi.fn()
    const onDelete = vi.fn()

    renderWithProviders(
      <TemplateCard
        template={mockTemplate}
        onOpen={onOpen}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />,
    )

    const menuBtn = screen.getByRole('button', { name: /Opções do template/i })
    await user.click(menuBtn)

    const duplicateItem = await screen.findByText('Duplicar Template')
    await user.click(duplicateItem)
    expect(onDuplicate).toHaveBeenCalledWith(mockTemplate)

    await user.click(menuBtn)
    const deleteItem = await screen.findByText('Excluir')
    await user.click(deleteItem)
    expect(onDelete).toHaveBeenCalledWith(mockTemplate)
  })
})
