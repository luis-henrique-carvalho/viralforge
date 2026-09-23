import { Group, Rect } from 'react-konva'

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 1920

interface KonvaSafeZonesGroupProps {
  showSafeZones: boolean
}

export function KonvaSafeZonesGroup({ showSafeZones }: KonvaSafeZonesGroupProps) {
  if (!showSafeZones) return null
  return (
    <Group opacity={0.35}>
      <Rect
        x={0}
        y={0}
        width={CANVAS_WIDTH}
        height={120}
        fill="#EF4444"
      />
      <Rect
        x={0}
        y={CANVAS_HEIGHT - 380}
        width={CANVAS_WIDTH}
        height={380}
        fill="#EF4444"
      />
      <Rect
        x={CANVAS_WIDTH - 180}
        y={CANVAS_HEIGHT - 900}
        width={180}
        height={520}
        fill="#EF4444"
      />
    </Group>
  )
}
