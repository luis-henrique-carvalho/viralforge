// shadcn-ignore: konva-canvas-group
import { Group, Rect, Text } from 'react-konva'
import { KonvaFreeResizeHandles } from './konva-free-resize-handles'
import type { VisualTemplate } from '../data/template.types'

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 1920
const HANDLE_SIZE = 24

interface KonvaVideoGroupProps {
  template: VisualTemplate
  scale: number
  videoX: number
  videoY: number
  videoWidth: number
  videoHeight: number
  onDragStart: () => void
  onDragEnd: (y: number, x?: number) => void
  onResizeHeight?: (height: number) => void
  onResizeWidth?: (scale: number) => void
}

export function KonvaVideoGroup({
  template,
  scale,
  videoX,
  videoY,
  videoWidth,
  videoHeight,
  onDragStart,
  onDragEnd,
  onResizeHeight,
  onResizeWidth,
}: KonvaVideoGroupProps) {
  const isContain = template.video_fit === 'contain'
  const isFree = template.video_aspect === 'free'
  const containW = Math.min(videoWidth, Math.round(videoHeight * (9 / 16)))
  const containX = (videoWidth - containW) / 2

  return (
    <Group
      x={videoX}
      y={videoY}
      draggable
      dragBoundFunc={(pos) => {
        const canvasX = pos.x / scale
        const canvasY = pos.y / scale
        const clampedX = Math.max(0, Math.min(CANVAS_WIDTH - videoWidth, canvasX))
        const clampedY = Math.max(40, Math.min(CANVAS_HEIGHT - videoHeight - 50, canvasY))
        return {
          x: clampedX * scale,
          y: clampedY * scale,
        }
      }}
      onDragStart={onDragStart}
      onDragEnd={(e) => {
        const rawY = e?.target && typeof e.target.y === 'function' ? e.target.y() : videoY
        const rawX = e?.target && typeof e.target.x === 'function' ? e.target.x() : videoX
        const newY = Math.max(40, Math.min(CANVAS_HEIGHT - videoHeight - 50, Math.round(rawY)))
        const newX = Math.max(0, Math.min(CANVAS_WIDTH - videoWidth, Math.round(rawX)))
        onDragEnd(newY, newX)
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

      {isContain && containW < videoWidth && (
        <Rect
          x={containX}
          y={0}
          width={containW}
          height={videoHeight}
          fill="#0F172A"
          stroke="#475569"
          strokeWidth={1}
          dash={[8, 8]}
        />
      )}

      <Text
        text={
          isContain
            ? `VÍDEO 9:16 CONTAIN (${containW}×${videoHeight}px)`
            : `VÍDEO 9:16 COVER (${videoWidth}×${videoHeight}px)`
        }
        x={0}
        y={videoHeight / 2 - 20}
        width={videoWidth}
        align="center"
        fontSize={28}
        fontStyle="bold"
        fill="#94A3B8"
      />
      <Text
        text={
          isContain
            ? `[Modo Contain: Preserva proporção original com moldura lateral]`
            : `[Modo Cover: Preenche 100% da caixa com recorte central]`
        }
        x={0}
        y={videoHeight / 2 + 20}
        width={videoWidth}
        align="center"
        fontSize={18}
        fill="#64748B"
      />

      {/* Bottom Resize Handle */}
      <Group
        x={videoWidth / 2 - HANDLE_SIZE * 2}
        y={videoHeight - HANDLE_SIZE / 2}
        draggable
        dragBoundFunc={(pos) => {
          const canvasY = pos.y / scale
          const clampedY = Math.max(videoY + 300, Math.min(videoY + 1600, canvasY))
          return {
            x: (videoX + videoWidth / 2 - HANDLE_SIZE * 2) * scale,
            y: clampedY * scale,
          }
        }}
        onDragStart={(e) => {
          if (e) e.cancelBubble = true
          onDragStart()
        }}
        onDragEnd={(e) => {
          if (e) e.cancelBubble = true
          const targetY =
            e?.target && typeof e.target.y === 'function'
              ? e.target.y()
              : videoHeight - HANDLE_SIZE / 2
          const relativeY = targetY + HANDLE_SIZE / 2
          const clampedHeight = Math.max(300, Math.min(1600, Math.round(relativeY)))
          onResizeHeight?.(clampedHeight)
        }}
      >
        <Rect
          x={0}
          y={0}
          width={HANDLE_SIZE * 4}
          height={HANDLE_SIZE}
          fill="#3B82F6"
          stroke="#FFFFFF"
          strokeWidth={2}
          cornerRadius={4}
        />
        <Text
          text="↕ Altura"
          x={0}
          y={4}
          width={HANDLE_SIZE * 4}
          align="center"
          fontSize={14}
          fontStyle="bold"
          fill="#FFFFFF"
        />
      </Group>

      {isFree && (
        <KonvaFreeResizeHandles
          scale={scale}
          videoX={videoX}
          videoY={videoY}
          videoWidth={videoWidth}
          videoHeight={videoHeight}
          onDragStart={onDragStart}
          onResizeHeight={onResizeHeight}
          onResizeWidth={onResizeWidth}
        />
      )}
    </Group>
  )
}
