// shadcn-ignore: konva-canvas-group
import { Group, Rect, Text } from 'react-konva'
import type { VisualTemplate } from '../data/template.types'

interface KonvaVideoGroupProps {
  template: VisualTemplate
  videoX: number
  videoY: number
  videoWidth: number
  videoHeight: number
  onDragStart: () => void
  onDragEnd: (y: number) => void
}

export function KonvaVideoGroup({
  template,
  videoX,
  videoY,
  videoWidth,
  videoHeight,
  onDragStart,
  onDragEnd,
}: KonvaVideoGroupProps) {
  return (
    <Group
      x={videoX}
      y={videoY}
      draggable
      onDragStart={onDragStart}
      onDragEnd={(e) => {
        const newY = Math.max(50, Math.min(950, Math.round(e.target.y())))
        onDragEnd(newY)
      }}
    >
      <Rect
        x={0}
        y={0}
        width={videoWidth}
        height={videoHeight}
        fill="#1E293B"
        stroke={template.video_border_color}
        strokeWidth={template.video_border_width}
        cornerRadius={template.video_radius}
        shadowColor={template.video_border_color}
        shadowBlur={template.video_shadow === 'none' ? 0 : 16}
        shadowOpacity={template.video_shadow === 'none' ? 0 : 0.4}
      />
      <Text
        text={`VÍDEO 9:16 (${videoWidth}×${videoHeight}px)`}
        x={0}
        y={videoHeight / 2 - 20}
        width={videoWidth}
        align="center"
        fontSize={28}
        fontStyle="bold"
        fill="#94A3B8"
      />
      <Text
        text="[Arraste para mover / Ajuste a altura nos controles]"
        x={0}
        y={videoHeight / 2 + 20}
        width={videoWidth}
        align="center"
        fontSize={18}
        fill="#64748B"
      />
    </Group>
  )
}
