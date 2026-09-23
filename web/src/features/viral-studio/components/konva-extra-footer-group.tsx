// shadcn-ignore: konva-canvas-group
import { Group, Rect, Text } from 'react-konva'
import type { VisualTemplate } from '../data/template.types'

interface KonvaExtraFooterGroupProps {
  template: VisualTemplate
  extraX: number
  extraWidth: number
  onDragStart: () => void
  onDragEnd: (y: number) => void
}

export function KonvaExtraFooterGroup({
  template,
  extraX,
  extraWidth,
  onDragStart,
  onDragEnd,
}: KonvaExtraFooterGroupProps) {
  if (!template.extra_image_enabled) return null
  const label =
    template.extra_image_template_type === 'comment'
      ? '💬 DEIXE SEU COMENTÁRIO'
      : template.extra_image_template_type === 'follow'
        ? '🔔 SIGA O PERFIL PARA MAIS'
        : template.extra_image_template_type === 'deal'
          ? '🛒 CONFIRA O LINK NA BIO'
          : '💡 FATO CURIOSO DIÁRIO'

  return (
    <Group
      x={extraX}
      y={template.extra_image_y}
      draggable
      onDragStart={onDragStart}
      onDragEnd={(e) => {
        const newY = Math.max(800, Math.min(1750, Math.round(e.target.y())))
        onDragEnd(newY)
      }}
    >
      <Rect
        x={0}
        y={0}
        width={extraWidth}
        height={template.extra_image_height}
        fill="#18181B"
        stroke="#3F3F46"
        strokeWidth={2}
        cornerRadius={template.extra_image_radius}
        opacity={0.9}
      />
      <Text
        text={label}
        x={0}
        y={template.extra_image_height / 2 - 22}
        width={extraWidth}
        align="center"
        fontSize={24}
        fontStyle="bold"
        fill="#F4F4F5"
      />
      <Text
        text="Participe do debate e compartilhe com seus amigos!"
        x={0}
        y={template.extra_image_height / 2 + 10}
        width={extraWidth}
        align="center"
        fontSize={18}
        fill="#A1A1AA"
      />
    </Group>
  )
}
