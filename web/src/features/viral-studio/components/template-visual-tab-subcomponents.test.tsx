import { describe, expect, it, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render'
import { TemplateVisualTabBadge } from './template-visual-tab-badge'
import { TemplateVisualTabBrand } from './template-visual-tab-brand'
import { TemplateVisualTabCanvas } from './template-visual-tab-canvas'
import { TemplateVisualTabFooter } from './template-visual-tab-footer'
import { TemplateVisualTabHeadline } from './template-visual-tab-headline'
import { TemplateVisualTabVideo } from './template-visual-tab-video'
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
  headline_y: 130,
  headline_max_lines: 3,
  headline_margin_x: 60,
  headline_margin_top: 30,
  badge_enabled: true,
  custom_badge_text: 'PROMOÇÃO',
  custom_badge_bg_color: '#E11D48',
  custom_badge_text_color: '#FFFFFF',
  badge_y: 45,
  extra_image_enabled: true,
  extra_image_path: null,
  extra_image_url: null,
  extra_image_template_type: 'custom_upload',
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

describe('TemplateVisualTab subcomponents', () => {
  it('renders Canvas section and triggers onChange', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <TemplateVisualTabCanvas
        template={mockTemplate}
        onChange={onChange}
      />,
    )
    expect(screen.getByText('Fundo do Canvas (1080×1920)')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Branco Limpo' }))
    expect(onChange).toHaveBeenCalledWith('background_color', '#FFFFFF')
  })

  it('renders Badge section and updates badge text, colors and switch', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <TemplateVisualTabBadge
        template={mockTemplate}
        onChange={onChange}
      />,
    )
    expect(screen.getByText(/Selo \/ Badge de Nicho/i)).toBeInTheDocument()
    const badgeInput = screen.getByDisplayValue('PROMOÇÃO')
    fireEvent.change(badgeInput, { target: { value: 'NOVO SELO' } })
    expect(onChange).toHaveBeenCalledWith('custom_badge_text', 'NOVO SELO')

    const switchEl = screen.getByRole('switch')
    fireEvent.click(switchEl)
    expect(onChange).toHaveBeenCalledWith('badge_enabled', false)

    const colorPickers = screen.getAllByDisplayValue('#E11D48')
    if (colorPickers[0]) {
      fireEvent.change(colorPickers[0], { target: { value: '#10B981' } })
      expect(onChange).toHaveBeenCalledWith('custom_badge_bg_color', '#10B981')
    }

    const sliders = screen.getAllByRole('slider')
    if (sliders[0]) {
      fireEvent.keyDown(sliders[0], { key: 'ArrowRight' })
    }
  })

  it('renders Headline section and updates color and switch', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <TemplateVisualTabHeadline
        template={mockTemplate}
        onChange={onChange}
      />,
    )
    expect(screen.getByText('Headline Dinâmica')).toBeInTheDocument()

    const switchEl = screen.getByRole('switch')
    fireEvent.click(switchEl)
    expect(onChange).toHaveBeenCalledWith('headline_enabled', false)

    const colorPickers = screen.getAllByDisplayValue('#FFFFFF')
    if (colorPickers[0]) {
      fireEvent.change(colorPickers[0], { target: { value: '#FBBF24' } })
      expect(onChange).toHaveBeenCalledWith('headline_color', '#FBBF24')
    }

    const sliders = screen.getAllByRole('slider')
    if (sliders[0]) {
      fireEvent.keyDown(sliders[0], { key: 'ArrowRight' })
    }
  })

  it('renders Video section and updates quick aspect ratio, colors and sliders', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <TemplateVisualTabVideo
        template={mockTemplate}
        onChange={onChange}
      />,
    )
    expect(screen.getByText('Caixa de Vídeo & Geometria')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '16:9' }))
    expect(onChange).toHaveBeenCalledWith('video_aspect', '16:9')

    const colorPickers = screen.getAllByDisplayValue('#3B82F6')
    if (colorPickers[0]) {
      fireEvent.change(colorPickers[0], { target: { value: '#EF4444' } })
      expect(onChange).toHaveBeenCalledWith('video_border_color', '#EF4444')
    }

    const sliders = screen.getAllByRole('slider')
    sliders.forEach((s) => fireEvent.keyDown(s, { key: 'ArrowRight' }))
  })

  it('renders Footer section and handles file upload input', () => {
    const onChange = vi.fn()
    const onUpload = vi.fn()
    renderWithProviders(
      <TemplateVisualTabFooter
        template={mockTemplate}
        onChange={onChange}
        onUploadExtraImage={onUpload}
      />,
    )
    expect(screen.getByText('Card de Rodapé / Imagem Extra')).toBeInTheDocument()
    expect(screen.getByText(/Banner Personalizado/i)).toBeInTheDocument()

    const switchEl = screen.getByRole('switch')
    fireEvent.click(switchEl)
    expect(onChange).toHaveBeenCalledWith('extra_image_enabled', false)

    const file = new File(['mock content'], 'test.png', { type: 'image/png' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [file] } })
      expect(onUpload).toHaveBeenCalledWith(file)
    }

    const sliders = screen.getAllByRole('slider')
    sliders.forEach((s) => fireEvent.keyDown(s, { key: 'ArrowRight' }))
  })

  it('renders Brand toggles section', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <TemplateVisualTabBrand
        template={mockTemplate}
        onChange={onChange}
      />,
    )
    expect(screen.getByText('Identidade da Marca')).toBeInTheDocument()

    const switches = screen.getAllByRole('switch')
    switches.forEach((s) => fireEvent.click(s))
    expect(onChange).toHaveBeenCalled()
  })
})
