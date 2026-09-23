import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { TemplateCanvasKonva } from './template-canvas-konva'
import type { VisualTemplate } from '../data/template.types'

interface TemplateCanvasViewportProps {
  template: VisualTemplate
  onChange: (field: keyof VisualTemplate, value: unknown) => void
}

export function TemplateCanvasViewport({ template, onChange }: TemplateCanvasViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.35)
  const [showSafeZones, setShowSafeZones] = useState(false)

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return
      const containerHeight = containerRef.current.clientHeight - 60
      const calculatedScale = Math.min(0.48, Math.max(0.25, containerHeight / 1920))
      setScale(calculatedScale)
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative flex h-full flex-col items-center justify-between overflow-hidden rounded-xl border border-border/60 bg-muted/20 p-4"
    >
      {/* Top Toolbar */}
      <div className="flex w-full items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Typography
            variant="small"
            className="text-xs font-semibold text-foreground"
          >
            Canvas Interativo 9:16
          </Typography>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant={showSafeZones ? 'default' : 'outline'}
            onClick={() => setShowSafeZones(!showSafeZones)}
            className="h-7 text-xs gap-1"
          >
            {showSafeZones ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            Safe Zones
          </Button>

          <Button
            size="icon"
            variant="outline"
            aria-label="Aumentar zoom"
            onClick={() => setScale((s) => Math.min(0.55, s + 0.05))}
            className="h-7 w-7"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            aria-label="Diminuir zoom"
            onClick={() => setScale((s) => Math.max(0.2, s - 0.05))}
            className="h-7 w-7"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Konva Stage Render */}
      <div className="flex flex-1 items-center justify-center">
        <TemplateCanvasKonva
          template={template}
          scale={scale}
          showSafeZones={showSafeZones}
          onChange={onChange}
        />
      </div>

      {/* Footer Info */}
      <div className="flex w-full items-center justify-between pt-2 text-[11px] text-muted-foreground border-t border-border/40">
        <span>Arraste os elementos no canvas para reposicionar no eixo vertical</span>
        <span className="font-mono">1080 × 1920 px</span>
      </div>
    </div>
  )
}
