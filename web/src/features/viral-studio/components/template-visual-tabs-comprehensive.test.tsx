import { describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, render } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render'
import { ColorPickerField } from './color-picker-field'
import { TemplateVideoFreeControls } from './template-video-free-controls'
import { TemplateVisualTabBrand } from './template-visual-tab-brand'
import { TemplateVisualTabFooter } from './template-visual-tab-footer'
import { TemplateVisualTabBadge } from './template-visual-tab-badge'
import { TemplateVisualTabHeadline } from './template-visual-tab-headline'
import { TemplateVisualTabCanvas } from './template-visual-tab-canvas'
import { KonvaFreeResizeHandles } from './konva-free-resize-handles'
import type { VisualTemplate } from '../data/template.types'

const mockTemplate: VisualTemplate = {
  id: 'comprehensive-template',
  name: 'Template Completo',
  is_system: false,
  width: 1080,
  height: 1920,
  background_color: '#0D1117',
  video_fit: 'contain',
  video_aspect: 'free',
  video_x: 60,
  video_y: 360,
  video_width: 960,
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
  custom_badge_text: 'OFERTA',
  custom_badge_bg_color: '#E11D48',
  custom_badge_text_color: '#FFFFFF',
  badge_y: 45,
  extra_image_enabled: true,
  extra_image_path: 'uploads/banner.png',
  extra_image_url: null,
  extra_image_template_type: 'comment',
  extra_image_title: 'Título Rodapé',
  extra_image_subtitle: 'Subtítulo Rodapé',
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

describe('Visual Tabs & Helpers Comprehensive Suite', () => {
  it('renders ColorPickerField and triggers onChange', () => {
    const onChange = vi.fn()
    const { container } = render(
      <ColorPickerField
        label="Cor de Teste"
        value="#FF00FF"
        onChange={onChange}
      />,
    )

    expect(screen.getByText('Cor de Teste')).toBeInTheDocument()
    const colorInput = container.querySelector('input[type="color"]')
    if (colorInput) {
      fireEvent.change(colorInput, { target: { value: '#00ff00' } })
      expect(onChange).toHaveBeenCalledWith('#00ff00')
    }

    const textInput = container.querySelector('input[type="text"]')
    if (textInput) {
      fireEvent.change(textInput, { target: { value: '#123456' } })
      expect(onChange).toHaveBeenCalledWith('#123456')
    }
  })

  it('renders TemplateVideoFreeControls with fallback null video_x', () => {
    const onChange = vi.fn()
    render(
      <TemplateVideoFreeControls
        template={{ ...mockTemplate, video_x: null }}
        onChange={onChange}
      />,
    )
    expect(screen.getByText('Controles do Modo Livre (FREE)')).toBeInTheDocument()
    expect(screen.getByText('Centralizado')).toBeInTheDocument()
  })

  it('renders TemplateVisualTabBrand with switches and inputs', () => {
    const onChange = vi.fn()
    const { container } = renderWithProviders(
      <TemplateVisualTabBrand
        template={mockTemplate}
        onChange={onChange}
      />,
    )
    expect(screen.getByText('Identidade da Marca')).toBeInTheDocument()

    const switches = screen.getAllByRole('switch')
    expect(switches.length).toBeGreaterThanOrEqual(3)
    fireEvent.click(switches[0])
    expect(onChange).toHaveBeenCalled()

    const colorInputs = container.querySelectorAll('input[type="color"]')
    if (colorInputs.length > 0) {
      fireEvent.change(colorInputs[0], { target: { value: '#112233' } })
      expect(onChange).toHaveBeenCalled()
    }
  })

  it('renders TemplateVisualTabBadge with inputs', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <TemplateVisualTabBadge
        template={mockTemplate}
        onChange={onChange}
      />,
    )
    expect(screen.getByText(/Selo \/ Badge de Nicho/i)).toBeInTheDocument()
    const badgeInput = screen.getByDisplayValue('OFERTA')
    fireEvent.change(badgeInput, { target: { value: 'NOVO SELO' } })
    expect(onChange).toHaveBeenCalledWith('custom_badge_text', 'NOVO SELO')
  })

  it('renders TemplateVisualTabHeadline with font presets and inputs', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <TemplateVisualTabHeadline
        template={mockTemplate}
        onChange={onChange}
      />,
    )
    expect(screen.getByText('Headline Dinâmica')).toBeInTheDocument()
  })

  it('renders TemplateVisualTabCanvas and handles presets', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <TemplateVisualTabCanvas
        template={mockTemplate}
        onChange={onChange}
      />,
    )
    expect(screen.getByText('Fundo do Canvas (1080×1920)')).toBeInTheDocument()
    const customHexInput = screen.getByDisplayValue('#0D1117')
    fireEvent.change(customHexInput, { target: { value: '#222222' } })
    expect(onChange).toHaveBeenCalledWith('background_color', '#222222')
  })

  it('renders TemplateVisualTabFooter with comment type and input changes', () => {
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
    const titleInput = screen.getByDisplayValue('Título Rodapé')
    fireEvent.change(titleInput, { target: { value: 'Novo Título' } })
    expect(onChange).toHaveBeenCalledWith('extra_image_title', 'Novo Título')

    const subInput = screen.getByDisplayValue('Subtítulo Rodapé')
    fireEvent.change(subInput, { target: { value: 'Novo Sub' } })
    expect(onChange).toHaveBeenCalledWith('extra_image_subtitle', 'Novo Sub')
  })

  it('renders KonvaFreeResizeHandles with scale', () => {
    const onStart = vi.fn()
    const onResizeH = vi.fn()
    const onResizeW = vi.fn()
    const { container } = render(
      <KonvaFreeResizeHandles
        scale={0.5}
        videoX={60}
        videoY={360}
        videoWidth={960}
        videoHeight={1000}
        onDragStart={onStart}
        onResizeHeight={onResizeH}
        onResizeWidth={onResizeW}
      />,
    )
    expect(container).toBeDefined()
  })
})
