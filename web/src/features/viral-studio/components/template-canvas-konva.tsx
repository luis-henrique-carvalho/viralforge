// shadcn-ignore: konva-canvas-group
import { useState } from 'react'
import { Layer, Line, Rect, Stage } from 'react-konva'
import { KonvaBadgeGroup } from './konva-badge-group'
import { KonvaBrandGroup } from './konva-brand-group'
import { KonvaExtraFooterGroup } from './konva-extra-footer-group'
import { KonvaHeadlineGroup } from './konva-headline-group'
import { KonvaSafeZonesGroup } from './konva-safe-zones-group'
import { KonvaVideoGroup } from './konva-video-group'
import { KonvaWatermarkGroup } from './konva-watermark-group'
import type { VisualTemplate } from '../data/template.types'

interface TemplateCanvasKonvaProps {
  template: VisualTemplate
  scale: number
  showSafeZones: boolean
  onChange: (field: keyof VisualTemplate, value: unknown) => void
}

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 1920

export function TemplateCanvasKonva({
  template,
  scale,
  showSafeZones,
  onChange,
}: TemplateCanvasKonvaProps) {
  const [isDragging, setIsDragging] = useState(false)

  const videoWidth = Math.round(CANVAS_WIDTH * (template.video_scale / 100))
  const videoX = template.video_x ?? Math.round((CANVAS_WIDTH - videoWidth) / 2)
  const videoY = template.video_y
  const videoHeight = template.video_height

  const extraWidth = Math.round(CANVAS_WIDTH * (template.extra_image_width / 100))
  const extraX = template.extra_image_x ?? Math.round((CANVAS_WIDTH - extraWidth) / 2)

  return (
    <Stage
      width={CANVAS_WIDTH * scale}
      height={CANVAS_HEIGHT * scale}
      scaleX={scale}
      scaleY={scale}
      className="rounded-xl overflow-hidden shadow-2xl border border-border/80"
    >
      <Layer>
        <Rect
          x={0}
          y={0}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          fill={template.background_color}
        />

        {isDragging && (
          <Line
            points={[CANVAS_WIDTH / 2, 0, CANVAS_WIDTH / 2, CANVAS_HEIGHT]}
            stroke="#38BDF8"
            strokeWidth={2}
            dash={[10, 5]}
            opacity={0.8}
          />
        )}

        <KonvaBadgeGroup
          template={template}
          scale={scale}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(y) => {
            setIsDragging(false)
            onChange('badge_y', y)
          }}
        />

        <KonvaBrandGroup template={template} />

        <KonvaHeadlineGroup
          template={template}
          scale={scale}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(y) => {
            setIsDragging(false)
            onChange('headline_y', y)
          }}
        />

        <KonvaVideoGroup
          template={template}
          scale={scale}
          videoX={videoX}
          videoY={videoY}
          videoWidth={videoWidth}
          videoHeight={videoHeight}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(y, x) => {
            setIsDragging(false)
            onChange('video_y', y)
            if (x !== undefined) {
              onChange('video_x', x)
            }
          }}
          onResizeHeight={(height) => {
            setIsDragging(false)
            onChange('video_height', height)
          }}
          onResizeWidth={(newScale) => {
            setIsDragging(false)
            onChange('video_scale', newScale)
          }}
        />

        <KonvaExtraFooterGroup
          template={template}
          scale={scale}
          extraX={extraX}
          extraWidth={extraWidth}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(y) => {
            setIsDragging(false)
            onChange('extra_image_y', y)
          }}
        />

        <KonvaWatermarkGroup template={template} />

        <KonvaSafeZonesGroup showSafeZones={showSafeZones} />
      </Layer>
    </Stage>
  )
}
