import { Circle, Group, Text } from 'react-konva'
import type { VisualTemplate } from '../data/template.types'

interface KonvaBrandGroupProps {
  template: VisualTemplate
}

export function KonvaBrandGroup({ template }: KonvaBrandGroupProps) {
  return (
    <Group
      x={template.avatar_x}
      y={template.avatar_y}
    >
      {template.avatar_enabled && (
        <Circle
          x={template.avatar_size / 2}
          y={template.avatar_size / 2}
          radius={template.avatar_size / 2}
          fill="#E2E8F0"
          stroke="#CBD5E1"
          strokeWidth={2}
        />
      )}
      {template.brand_name_enabled && (
        <>
          <Text
            text="Vale o Clique?"
            x={template.avatar_enabled ? template.avatar_size + 24 : 0}
            y={10}
            fontSize={template.brand_name_font_size}
            fontStyle="bold"
            fontFamily="Montserrat"
            fill={template.brand_name_color}
          />
          <Text
            text="@valeoclique"
            x={template.avatar_enabled ? template.avatar_size + 24 : 0}
            y={10 + template.brand_name_font_size + 6}
            fontSize={template.handle_font_size}
            fontFamily="Poppins"
            fill={template.handle_color}
          />
        </>
      )}
    </Group>
  )
}
