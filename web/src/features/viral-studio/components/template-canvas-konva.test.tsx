import { describe, expect, it, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import { KonvaBadgeGroup } from './konva-badge-group'
import { KonvaBrandGroup } from './konva-brand-group'
import { KonvaHeadlineGroup } from './konva-headline-group'
import { KonvaVideoGroup } from './konva-video-group'
import { KonvaExtraFooterGroup } from './konva-extra-footer-group'
import { KonvaSafeZonesGroup } from './konva-safe-zones-group'
import { TemplateCanvasKonva } from './template-canvas-konva'
import type { VisualTemplate } from '../data/template.types'

vi.mock('react-konva', () => ({
  Stage: ({ children }: { children: React.ReactNode }) => <div data-testid="stage">{children}</div>,
  Layer: ({ children }: { children: React.ReactNode }) => <div data-testid="layer">{children}</div>,
  Group: ({
    children,
    onDragStart,
    onDragEnd,
    ...props
  }: {
    children: React.ReactNode
    onDragStart?: () => void
    onDragEnd?: (e: { target: { y: () => number } }) => void
  }) => (
    <div
      data-testid="group"
      onClick={() => {
        onDragStart?.()
        onDragEnd?.({ target: { y: () => 150 } })
      }}
      {...props}
    >
      {children}
    </div>
  ),
  Rect: (props: Record<string, unknown>) => (
    <div
      data-testid="rect"
      {...props}
    />
  ),
  Text: (props: Record<string, unknown>) => (
    <div
      data-testid="text"
      {...props}
    />
  ),
  Line: (props: Record<string, unknown>) => (
    <div
      data-testid="line"
      {...props}
    />
  ),
  Circle: (props: Record<string, unknown>) => (
    <div
      data-testid="circle"
      {...props}
    />
  ),
}))

const mockTemplate: VisualTemplate = {
  id: 'curiosities-viral',
  name: 'Curiosidades',
  is_system: true,
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
  custom_badge_text: 'VOCÊ SABIA?',
  custom_badge_bg_color: '#E11D48',
  custom_badge_text_color: '#FFFFFF',
  badge_y: 45,
  extra_image_enabled: true,
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

describe('Konva Canvas & Groups', () => {
  it('renders KonvaBadgeGroup', () => {
    const onStart = vi.fn()
    const onEnd = vi.fn()
    const { container } = render(
      <KonvaBadgeGroup
        template={mockTemplate}
        scale={1}
        onDragStart={onStart}
        onDragEnd={onEnd}
      />,
    )
    expect(container).toBeDefined()
  })

  it('renders KonvaBrandGroup', () => {
    const { container } = render(<KonvaBrandGroup template={mockTemplate} />)
    expect(container).toBeDefined()
  })

  it('renders KonvaHeadlineGroup', () => {
    const onStart = vi.fn()
    const onEnd = vi.fn()
    const { container } = render(
      <KonvaHeadlineGroup
        template={mockTemplate}
        scale={1}
        onDragStart={onStart}
        onDragEnd={onEnd}
      />,
    )
    expect(container).toBeDefined()
  })

  it('renders KonvaVideoGroup', () => {
    const onStart = vi.fn()
    const onEnd = vi.fn()
    const { container } = render(
      <KonvaVideoGroup
        template={mockTemplate}
        scale={1}
        videoX={100}
        videoY={360}
        videoWidth={880}
        videoHeight={1000}
        onDragStart={onStart}
        onDragEnd={onEnd}
      />,
    )
    expect(container).toBeDefined()
  })

  it('renders KonvaExtraFooterGroup', () => {
    const onStart = vi.fn()
    const onEnd = vi.fn()
    const { container } = render(
      <KonvaExtraFooterGroup
        template={mockTemplate}
        scale={1}
        extraX={100}
        extraWidth={880}
        onDragStart={onStart}
        onDragEnd={onEnd}
      />,
    )
    expect(container).toBeDefined()
  })

  it('renders KonvaSafeZonesGroup', () => {
    const { container } = render(<KonvaSafeZonesGroup showSafeZones={true} />)
    expect(container).toBeDefined()
  })

  it('renders KonvaBrandGroup in center alignment mode', () => {
    const { container } = render(
      <KonvaBrandGroup template={{ ...mockTemplate, brand_alignment: 'center' }} />,
    )
    expect(container).toBeDefined()
  })

  it('renders KonvaWatermarkGroup when enabled and disabled', () => {
    const { container: enabledCont } = render(
      <TemplateCanvasKonva
        template={{ ...mockTemplate, watermark_enabled: true, watermark_position: 'top-left' }}
        scale={0.35}
        showSafeZones={false}
        onChange={vi.fn()}
      />,
    )
    expect(enabledCont.querySelector('[data-testid="stage"]')).toBeInTheDocument()

    const { container: disabledCont } = render(
      <TemplateCanvasKonva
        template={{ ...mockTemplate, watermark_enabled: false }}
        scale={0.35}
        showSafeZones={false}
        onChange={vi.fn()}
      />,
    )
    expect(disabledCont.querySelector('[data-testid="stage"]')).toBeInTheDocument()
  })

  it('renders TemplateCanvasKonva complete stage', () => {
    const onChange = vi.fn()
    const { container } = render(
      <TemplateCanvasKonva
        template={mockTemplate}
        scale={0.35}
        showSafeZones={true}
        onChange={onChange}
      />,
    )
    expect(container.querySelector('[data-testid="stage"]')).toBeInTheDocument()

    const groups = container.querySelectorAll('[data-testid="group"]')
    act(() => {
      groups.forEach((g) => g.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    })
    expect(onChange).toHaveBeenCalled()
  })

  it('renders KonvaVideoGroup in free mode with resize handles', () => {
    const onStart = vi.fn()
    const onEnd = vi.fn()
    const onResizeH = vi.fn()
    const onResizeW = vi.fn()
    const { container } = render(
      <KonvaVideoGroup
        template={{ ...mockTemplate, video_aspect: 'free' }}
        scale={1}
        videoX={100}
        videoY={360}
        videoWidth={880}
        videoHeight={1000}
        onDragStart={onStart}
        onDragEnd={onEnd}
        onResizeHeight={onResizeH}
        onResizeWidth={onResizeW}
      />,
    )
    expect(container).toBeDefined()
  })
})
