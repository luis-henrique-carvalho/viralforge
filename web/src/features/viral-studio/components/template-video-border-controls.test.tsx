import { describe, expect, it, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render'
import { TemplateVideoBorderControls } from './template-video-border-controls'
import type { VisualTemplate } from '../data/template.types'

const mockTemplate: VisualTemplate = {
  id: 'test-border-tpl',
  name: 'Template Borda',
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
  persona_role: 'Roteirista investigativo',
  tone_of_voice: 'Intrigante',
  conversion_goal: 'engagement',
  call_to_action_template: null,
  system_prompt_template: null,
  default_hashtags: [],
  preferred_model: null,
  generation_tasks: [],
  created_at: '2026-03-29T10:00:00Z',
  updated_at: '2026-03-29T10:00:00Z',
}

describe('TemplateVideoBorderControls', () => {
  it('toggles border width between 0 and 2', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <TemplateVideoBorderControls
        template={mockTemplate}
        onChange={onChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Sem Borda' }))
    expect(onChange).toHaveBeenCalledWith('video_border_width', 0)
  })

  it('updates border color when changed', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <TemplateVideoBorderControls
        template={mockTemplate}
        onChange={onChange}
      />,
    )

    const inputs = screen.getAllByDisplayValue('#3B82F6')
    if (inputs[0]) {
      fireEvent.change(inputs[0], { target: { value: '#10B981' } })
      expect(onChange).toHaveBeenCalledWith('video_border_color', '#10B981')
    }
  })
})
