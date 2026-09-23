import { describe, expect, it, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render'
import { TemplatePersonaTab } from './template-persona-tab'
import type { VisualTemplate } from '../data/template.types'

const mockTemplate: VisualTemplate = {
  id: 'test-template',
  name: 'Template Teste',
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
  persona_role: 'Roteirista investigativo focado em fatos curiosos e mistérios',
  tone_of_voice: 'Intrigante e misterioso',
  conversion_goal: 'engagement',
  call_to_action_template: 'Siga para mais conteúdos!',
  system_prompt_template: null,
  default_hashtags: ['#viral', '#fatos'],
  preferred_model: null,
  generation_tasks: [
    {
      id: 'task-1',
      label: 'Gancho Visual',
      target: 'canvas_headline',
      instruction: 'Gere uma pergunta intrigante.',
      output_type: 'text',
      is_required: true,
    },
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('TemplatePersonaTab', () => {
  it('renders persona role, tone of voice, and task list', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <TemplatePersonaTab
        template={mockTemplate}
        onChange={onChange}
      />,
    )

    expect(screen.getByText('Estratégia Editorial & Nicho')).toBeInTheDocument()
    expect(screen.getByText('Papel / Persona da IA')).toBeInTheDocument()
    expect(screen.getByText(/Tarefas Modulares de Geração/)).toBeInTheDocument()
    expect(screen.getByText('Gancho Visual')).toBeInTheDocument()

    const roleInput = screen.getByDisplayValue(
      'Roteirista investigativo focado em fatos curiosos e mistérios',
    )
    fireEvent.change(roleInput, { target: { value: 'Novo Roteirista' } })
    expect(onChange).toHaveBeenCalledWith('persona_role', 'Novo Roteirista')

    const toneInput = screen.getByDisplayValue('Intrigante e misterioso')
    fireEvent.change(toneInput, { target: { value: 'Divertido' } })
    expect(onChange).toHaveBeenCalledWith('tone_of_voice', 'Divertido')

    const ctaInput = screen.getByDisplayValue('Siga para mais conteúdos!')
    fireEvent.change(ctaInput, { target: { value: 'Clique no link' } })
    expect(onChange).toHaveBeenCalledWith('call_to_action_template', 'Clique no link')
  })

  it('updates task instruction and removes task', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <TemplatePersonaTab
        template={mockTemplate}
        onChange={onChange}
      />,
    )

    const textarea = screen.getByDisplayValue('Gere uma pergunta intrigante.')
    fireEvent.change(textarea, { target: { value: 'Nova instrução' } })
    expect(onChange).toHaveBeenCalledWith('generation_tasks', [
      {
        id: 'task-1',
        label: 'Gancho Visual',
        target: 'canvas_headline',
        instruction: 'Nova instrução',
        output_type: 'text',
        is_required: true,
      },
    ])

    const deleteBtn = screen.getByRole('button', { name: '' }) // Trash icon button
    fireEvent.click(deleteBtn)
    expect(onChange).toHaveBeenCalledWith('generation_tasks', [])
  })

  it('opens catalog dialog and adds a task', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <TemplatePersonaTab
        template={{ ...mockTemplate, generation_tasks: [] }}
        onChange={onChange}
      />,
    )

    expect(screen.getByText(/Nenhuma tarefa de IA configurada/i)).toBeInTheDocument()

    const addBtn = screen.getByRole('button', { name: /Adicionar Tarefa/i })
    fireEvent.click(addBtn)

    expect(screen.getByText('Catálogo de Tarefas Modulares de IA')).toBeInTheDocument()

    const addCatalogBtns = screen.getAllByRole('button', { name: /Adicionar/i })
    fireEvent.click(addCatalogBtns[0])

    expect(onChange).toHaveBeenCalledWith('generation_tasks', expect.any(Array))
  })
})
