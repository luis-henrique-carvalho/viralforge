import { Group, Text } from 'react-konva'
import type { VisualTemplate } from '../data/template.types'

const CANVAS_WIDTH = 1080

interface KonvaHeadlineGroupProps {
  template: VisualTemplate
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

export function KonvaHeadlineGroup({ template, onDragStart, onDragEnd }: KonvaHeadlineGroupProps) {
  if (!template.headline_enabled) return null
  return (
    <Group
      x={template.headline_margin_x}
      y={template.headline_y}
      draggable
      onDragStart={onDragStart}
      onDragEnd={(e) => {
        const newY = Math.max(40, Math.min(600, Math.round(e.target.y())))
        onDragEnd(newY)
      }}
    >
      <Text
        text="QUEM TEM COZINHA PEQUENA PRECISA VER ISSO! 😱"
        x={0}
        y={0}
        width={CANVAS_WIDTH - 2 * template.headline_margin_x}
        align="center"
        fontSize={template.headline_font_size}
        fontStyle="bold"
        fontFamily={getFontFamily(template.headline_font)}
        fill={template.headline_color}
        lineHeight={1.2}
      />
    </Group>
  )
}
