// shadcn-ignore: konva-canvas-group
import { Group, Rect, Text } from 'react-konva'

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 1920
const HANDLE_SIZE = 24

interface KonvaFreeResizeHandlesProps {
  scale: number
  videoX: number
  videoY: number
  videoWidth: number
  videoHeight: number
  onDragStart: () => void
  onResizeHeight?: (height: number) => void
  onResizeWidth?: (scale: number) => void
}

export function KonvaFreeResizeHandles({
  scale,
  videoX,
  videoY,
  videoWidth,
  videoHeight,
  onDragStart,
  onResizeHeight,
  onResizeWidth,
}: KonvaFreeResizeHandlesProps) {
  return (
    <>
      <Group
        x={videoWidth - HANDLE_SIZE / 2}
        y={videoHeight / 2 - HANDLE_SIZE * 2}
        draggable
        dragBoundFunc={(pos) => {
          const canvasX = pos.x / scale
          const clampedX = Math.max(videoX + 200, Math.min(CANVAS_WIDTH, canvasX))
          return {
            x: clampedX * scale,
            y: (videoY + videoHeight / 2 - HANDLE_SIZE * 2) * scale,
          }
        }}
        onDragStart={(e) => {
          if (e) e.cancelBubble = true
          onDragStart()
        }}
        onDragEnd={(e) => {
          if (e) e.cancelBubble = true
          const targetX =
            e?.target && typeof e.target.x === 'function'
              ? e.target.x()
              : videoWidth - HANDLE_SIZE / 2
          const relativeX = targetX + HANDLE_SIZE / 2
          const newScale = Math.max(20, Math.min(100, Math.round((relativeX / CANVAS_WIDTH) * 100)))
          onResizeWidth?.(newScale)
        }}
      >
        <Rect
          x={0}
          y={0}
          width={HANDLE_SIZE}
          height={HANDLE_SIZE * 4}
          fill="#3B82F6"
          stroke="#FFFFFF"
          strokeWidth={2}
          cornerRadius={4}
        />
        <Text
          text="↔"
          x={0}
          y={HANDLE_SIZE * 1.2}
          width={HANDLE_SIZE}
          align="center"
          fontSize={18}
          fontStyle="bold"
          fill="#FFFFFF"
        />
      </Group>

      <Group
        x={videoWidth - HANDLE_SIZE}
        y={videoHeight - HANDLE_SIZE}
        draggable
        dragBoundFunc={(pos) => {
          const canvasX = pos.x / scale
          const canvasY = pos.y / scale
          const clampedX = Math.max(videoX + 200, Math.min(CANVAS_WIDTH, canvasX))
          const clampedY = Math.max(videoY + 300, Math.min(CANVAS_HEIGHT - 100, canvasY))
          return {
            x: clampedX * scale,
            y: clampedY * scale,
          }
        }}
        onDragStart={(e) => {
          if (e) e.cancelBubble = true
          onDragStart()
        }}
        onDragEnd={(e) => {
          if (e) e.cancelBubble = true
          const targetX =
            e?.target && typeof e.target.x === 'function' ? e.target.x() : videoWidth - HANDLE_SIZE
          const targetY =
            e?.target && typeof e.target.y === 'function' ? e.target.y() : videoHeight - HANDLE_SIZE
          const newScale = Math.max(
            20,
            Math.min(100, Math.round(((targetX + HANDLE_SIZE) / CANVAS_WIDTH) * 100)),
          )
          const clampedHeight = Math.max(300, Math.min(1600, Math.round(targetY + HANDLE_SIZE)))
          onResizeWidth?.(newScale)
          onResizeHeight?.(clampedHeight)
        }}
      >
        <Rect
          x={0}
          y={0}
          width={HANDLE_SIZE * 1.5}
          height={HANDLE_SIZE * 1.5}
          fill="#6366F1"
          stroke="#FFFFFF"
          strokeWidth={2}
          cornerRadius={4}
        />
        <Text
          text="⤡"
          x={0}
          y={4}
          width={HANDLE_SIZE * 1.5}
          align="center"
          fontSize={16}
          fontStyle="bold"
          fill="#FFFFFF"
        />
      </Group>
    </>
  )
}
