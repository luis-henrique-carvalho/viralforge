// shadcn-ignore: konva-canvas-badge
import { Group, Rect, Text } from 'react-konva'
import type { VisualTemplate } from '../data/template.types'

const CANVAS_WIDTH = 1080

interface KonvaBadgeGroupProps {
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

export function KonvaBadgeGroup({ template, onDragStart, onDragEnd }: KonvaBadgeGroupProps) {
  if (!template.badge_enabled || !template.custom_badge_text) return null
  return (
    <Group
      x={CANVAS_WIDTH / 2}
      y={template.badge_y}
      draggable
      onDragStart={onDragStart}
      onDragEnd={(e) => {
        const newY = Math.max(20, Math.min(400, Math.round(e.target.y())))
        onDragEnd(newY)
      }}
    >
      <Rect
        x={-140}
        y={0}
        width={280}
        height={50}
        fill={template.custom_badge_bg_color}
        cornerRadius={10}
      />
      <Text
        text={template.custom_badge_text}
        x={-130}
        y={14}
        width={260}
        align="center"
        fontSize={24}
        fontStyle="bold"
        fontFamily={getFontFamily(template.headline_font)}
        fill={template.custom_badge_text_color}
      />
    </Group>
  )
}
