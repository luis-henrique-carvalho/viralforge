// shadcn-ignore: konva-canvas-group
import { Group, Rect, Text } from 'react-konva'
import type { VisualTemplate } from '../data/template.types'

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 1920

interface KonvaWatermarkGroupProps {
  template: VisualTemplate
}

export function KonvaWatermarkGroup({ template }: KonvaWatermarkGroupProps) {
  if (!template.watermark_enabled) return null

  const pos = template.watermark_position || 'bottom-right'
  const margin = 40
  const boxWidth = 240
  const boxHeight = 44

  let x = CANVAS_WIDTH - boxWidth - margin
  let y = CANVAS_HEIGHT - boxHeight - margin

  if (pos === 'top-left') {
    x = margin
    y = margin
  } else if (pos === 'top-right') {
    x = CANVAS_WIDTH - boxWidth - margin
    y = margin
  } else if (pos === 'bottom-left') {
    x = margin
    y = CANVAS_HEIGHT - boxHeight - margin
  } else if (pos === 'center') {
    x = (CANVAS_WIDTH - boxWidth) / 2
    y = (CANVAS_HEIGHT - boxHeight) / 2
  }

  return (
    <Group
      x={x}
      y={y}
      opacity={template.watermark_opacity ?? 0.7}
      listening={false}
    >
      <Rect
        x={0}
        y={0}
        width={boxWidth}
        height={boxHeight}
        fill="#000000"
        opacity={0.4}
        cornerRadius={8}
      />
      <Text
        text="@valeoclique"
        x={0}
        y={12}
        width={boxWidth}
        align="center"
        fontSize={20}
        fontStyle="bold"
        fontFamily="Montserrat"
        fill="#FFFFFF"
      />
    </Group>
  )
}
