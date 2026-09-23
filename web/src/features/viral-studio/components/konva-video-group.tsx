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
  onResizeHeight?: (height: number) => void
}

export function KonvaVideoGroup({
  template,
  videoX,
  videoY,
  videoWidth,
  videoHeight,
  onDragStart,
  onDragEnd,
  onResizeHeight,
}: KonvaVideoGroupProps) {
  const handleSize = 24
  const isContain = template.video_fit === 'contain'
  const containW = Math.min(videoWidth, Math.round(videoHeight * (9 / 16)))
  const containX = (videoWidth - containW) / 2

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
      {/* Outer Container Frame */}
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

      {/* Inner Video Area for Contain Fit */}
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
        x={videoWidth / 2 - handleSize * 2}
        y={videoHeight - handleSize / 2}
        draggable
        dragBoundFunc={(pos) => ({
          x: videoX + videoWidth / 2 - handleSize * 2,
          y: Math.max(videoY + 400, Math.min(videoY + 1500, pos.y)),
        })}
        onDragStart={(e) => {
          if (e) {
            e.cancelBubble = true
          }
          onDragStart()
        }}
        onDragEnd={(e) => {
          if (e) {
            e.cancelBubble = true
          }
          const targetY = e?.target ? e.target.y() : videoHeight - handleSize / 2
          const relativeY = targetY + handleSize / 2
          const clampedHeight = Math.max(400, Math.min(1500, Math.round(relativeY)))
          onResizeHeight?.(clampedHeight)
        }}
      >
        <Rect
          x={0}
          y={0}
          width={handleSize * 4}
          height={handleSize}
          fill="#3B82F6"
          stroke="#FFFFFF"
          strokeWidth={2}
          cornerRadius={4}
        />
        <Text
          text="↕ Altura"
          x={0}
          y={4}
          width={handleSize * 4}
          align="center"
          fontSize={14}
          fontStyle="bold"
          fill="#FFFFFF"
        />
      </Group>
    </Group>
  )
}
