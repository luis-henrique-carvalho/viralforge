// shadcn-ignore: konva-canvas-group
import { Group, Text } from 'react-konva'
import type { VisualTemplate } from '../data/template.types'

const CANVAS_WIDTH = 1080

interface KonvaHeadlineGroupProps {
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

export function KonvaHeadlineGroup({
  template,
  scale,
  onDragStart,
  onDragEnd,
}: KonvaHeadlineGroupProps) {
  if (!template.headline_enabled) return null
  return (
    <Group
      x={template.headline_margin_x}
      y={template.headline_y}
      draggable
      dragBoundFunc={(pos) => {
        const canvasY = pos.y / scale
        const clampedY = Math.max(20, Math.min(800, canvasY))
        return {
          x: template.headline_margin_x * scale,
          y: clampedY * scale,
        }
      }}
      onDragStart={onDragStart}
      onDragEnd={(e) => {
        const rawY =
          e?.target && typeof e.target.y === 'function' ? e.target.y() : template.headline_y
        const newY = Math.max(20, Math.min(800, Math.round(rawY)))
        if (e?.target && typeof e.target.x === 'function') {
          e.target.x(template.headline_margin_x)
        }
        onDragEnd(newY)
      }}
    >
      <Text
        text="QUEM TEM COZINHA PEQUENA PRECISA VER ISSO! 😱"
        x={0}
        y={0}
        width={CANVAS_WIDTH - 2 * template.headline_margin_x}
        align={template.headline_alignment || 'center'}
        fontSize={template.headline_font_size}
        fontStyle="bold"
        fontFamily={getFontFamily(template.headline_font)}
        fill={template.headline_color}
        lineHeight={1.2}
      />
    </Group>
  )
}
