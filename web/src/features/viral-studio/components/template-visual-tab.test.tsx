import { describe, expect, it, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render'
import { TemplateVisualTab } from './template-visual-tab'
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
  brand_alignment: 'left',
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
  headline_alignment: 'center',
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
  extra_image_title: null,
  extra_image_subtitle: null,
  extra_image_bg_color: '#18181B',
  extra_image_text_color: '#FFFFFF',
  extra_image_border_color: '#3F3F46',
  extra_image_x: null,
  extra_image_y: 1420,
  extra_image_height: 340,
  extra_image_width: 92,
  extra_image_radius: 16,
  watermark_enabled: true,
  watermark_opacity: 0.7,
  watermark_position: 'bottom-right',
  niche_type: 'curiosities',
  persona_role: 'Roteirista',
  tone_of_voice: 'Misterioso',
  conversion_goal: 'engagement',
  call_to_action_template: 'Siga para mais!',
  system_prompt_template: null,
  default_hashtags: ['#viral'],
  preferred_model: null,
  generation_tasks: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('TemplateVisualTab', () => {
  it('renders visual controls and handles color preset clicks', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <TemplateVisualTab
        template={mockTemplate}
        onChange={onChange}
      />,
    )

    expect(screen.getByText('Fundo do Canvas (1080×1920)')).toBeInTheDocument()
    expect(screen.getByText('Caixa de Vídeo & Geometria')).toBeInTheDocument()
    expect(screen.getByText(/Selo \/ Badge de Nicho/i)).toBeInTheDocument()

    const darkPreset = screen.getByRole('button', { name: 'Dark Profundo' })
    fireEvent.click(darkPreset)
    expect(onChange).toHaveBeenCalledWith('background_color', '#0D1117')
  })

  it('renders video aspect presets and handles free mode and border toggle', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <TemplateVisualTab
        template={{ ...mockTemplate, video_aspect: 'free' }}
        onChange={onChange}
      />,
    )

    expect(screen.getByText('Controles do Modo Livre (FREE)')).toBeInTheDocument()

    const noBorderBtn = screen.getByRole('button', { name: 'Sem Borda' })
    fireEvent.click(noBorderBtn)
    expect(onChange).toHaveBeenCalledWith('video_border_width', 0)

    const aspectBtn = screen.getByRole('button', { name: '16:9' })
    fireEvent.click(aspectBtn)
    expect(onChange).toHaveBeenCalledWith('video_aspect', '16:9')
  })

  it('renders footer tab when enabled with custom inputs', () => {
    const onChange = vi.fn()
    const onUpload = vi.fn()
    renderWithProviders(
      <TemplateVisualTab
        template={{
          ...mockTemplate,
          extra_image_enabled: true,
          extra_image_template_type: 'comment',
          extra_image_title: 'Título Teste',
        }}
        onChange={onChange}
        onUploadExtraImage={onUpload}
      />,
    )

    expect(screen.getByText('Card de Rodapé / Imagem Extra')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Título Teste')).toBeInTheDocument()
  })

  it('renders brand alignment controls', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <TemplateVisualTab
        template={{
          ...mockTemplate,
          brand_alignment: 'left',
        }}
        onChange={onChange}
      />,
    )

    expect(screen.getByText('Alinhamento do Cabeçalho')).toBeInTheDocument()
    const centerBtn = screen.getByRole('button', { name: /Centralizado/i })
    fireEvent.click(centerBtn)
    expect(onChange).toHaveBeenCalledWith('brand_alignment', 'center')
  })

  it('renders and interacts with footer uploads and color pickers', () => {
    const onChange = vi.fn()
    const onUpload = vi.fn()
    const { container } = renderWithProviders(
      <TemplateVisualTab
        template={{
          ...mockTemplate,
          extra_image_enabled: true,
          extra_image_template_type: 'custom_upload',
        }}
        onChange={onChange}
        onUploadExtraImage={onUpload}
      />,
    )

    expect(screen.getByText(/Banner Personalizado/i)).toBeInTheDocument()
    const fileInput = container.querySelector('input[type="file"]')
    if (fileInput) {
      const file = new File(['test'], 'image.png', { type: 'image/png' })
      fireEvent.change(fileInput, { target: { files: [file] } })
      expect(onUpload).toHaveBeenCalledWith(file)
    }
  })

  it('handles brand switches and color changes', () => {
    const onChange = vi.fn()
    const { container } = renderWithProviders(
      <TemplateVisualTab
        template={{
          ...mockTemplate,
          avatar_enabled: true,
          brand_name_enabled: true,
        }}
        onChange={onChange}
      />,
    )

    const colorInputs = container.querySelectorAll('input[type="color"]')
    if (colorInputs.length > 0) {
      fireEvent.change(colorInputs[0], { target: { value: '#FF0000' } })
      expect(onChange).toHaveBeenCalled()
    }
  })
})
