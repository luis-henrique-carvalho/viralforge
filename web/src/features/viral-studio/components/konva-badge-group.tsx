// shadcn-ignore: konva-canvas-badge
import { Group, Rect, Text } from 'react-konva'
import type { VisualTemplate } from '../data/template.types'

const CANVAS_WIDTH = 1080

interface KonvaBadgeGroupProps {
  template: VisualTemplate
  scale: number
  onDragStart: () => void
  onDragEnd: (y: number) => void
}

function getFontFamily(fontName?: string): string {
  if (!fontName) return 'Montserrat'
  if (fontName.includes('Montserrat')) return 'Montserrat'
  if (fontName.includes('Poppins')) return 'Poppins'
  if (fontName.includes('Anton')) return 'Anton'
  if (fontName.includes('NotoSerif') || fontName.includes('Noto Serif')) return 'Noto Serif'
  return fontName
}

export function KonvaBadgeGroup({ template, scale, onDragStart, onDragEnd }: KonvaBadgeGroupProps) {
  if (!template.badge_enabled || !template.custom_badge_text) return null

  const textLength = template.custom_badge_text.length
  const badgeWidth = Math.max(140, Math.min(600, textLength * 14 + 40))
  const badgeHeight = 42

  return (
    <Group
      x={CANVAS_WIDTH / 2}
      y={template.badge_y}
      draggable
      dragBoundFunc={(pos) => {
        const canvasY = pos.y / scale
        const clampedY = Math.max(10, Math.min(500, canvasY))
        return {
          x: (CANVAS_WIDTH / 2) * scale,
          y: clampedY * scale,
        }
      }}
      onDragStart={onDragStart}
      onDragEnd={(e) => {
        const rawY = e?.target && typeof e.target.y === 'function' ? e.target.y() : template.badge_y
        const newY = Math.max(10, Math.min(500, Math.round(rawY)))
        if (e?.target && typeof e.target.x === 'function') {
          e.target.x(CANVAS_WIDTH / 2)
        }
        onDragEnd(newY)
      }}
    >
      <Rect
        x={-badgeWidth / 2}
        y={0}
        width={badgeWidth}
        height={badgeHeight}
        fill={template.custom_badge_bg_color}
        cornerRadius={8}
      />
      <Text
        text={template.custom_badge_text}
        x={-badgeWidth / 2}
        y={10}
        width={badgeWidth}
        align="center"
        fontSize={22}
        fontStyle="bold"
        fontFamily={getFontFamily(template.headline_font)}
        fill={template.custom_badge_text_color}
      />
    </Group>
  )
}
