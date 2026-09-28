import { useCallback, useEffect, useRef, useState } from 'react'
import { AlignCenter, Eye, EyeOff, Maximize2, ZoomIn, ZoomOut } from 'lucide-react'
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

  const handleFitScreen = useCallback(() => {
    if (!containerRef.current) return
    const containerHeight = containerRef.current.clientHeight - 90
    const calculatedScale = Math.min(0.6, Math.max(0.2, containerHeight / 1920))
    setScale(calculatedScale)
  }, [])

  useEffect(() => {
    handleFitScreen()
    window.addEventListener('resize', handleFitScreen)
    return () => window.removeEventListener('resize', handleFitScreen)
  }, [handleFitScreen])

  const handleCenterAll = () => {
    onChange('video_x', null)
    onChange('extra_image_x', null)
  }

  return (
    <div
      ref={containerRef}
      className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-muted/20"
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 bg-card/60 px-4 py-2">
        <div className="flex items-center gap-2">
          <Typography
            variant="small"
            className="text-xs font-semibold text-foreground"
          >
            Canvas Interativo 9:16
          </Typography>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCenterAll}
            title="Centralizar todos os elementos na tela"
            className="h-7 text-xs gap-1"
          >
            <AlignCenter className="h-3.5 w-3.5" />
            Centralizar
          </Button>

          <Button
            size="sm"
            variant={showSafeZones ? 'default' : 'outline'}
            onClick={() => setShowSafeZones(!showSafeZones)}
            className="h-7 text-xs gap-1"
          >
            {showSafeZones ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            Safe Zones
          </Button>

          <div className="h-4 w-px bg-border/60 mx-0.5" />

          <Button
            size="icon"
            variant="outline"
            title="Ajustar à tela"
            aria-label="Ajustar à tela"
            onClick={handleFitScreen}
            className="h-7 w-7"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            title="Diminuir zoom"
            aria-label="Diminuir zoom"
            onClick={() => setScale((s) => Math.max(0.15, Number((s - 0.05).toFixed(2))))}
            className="h-7 w-7"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            title="Aumentar zoom"
            aria-label="Aumentar zoom"
            onClick={() => setScale((s) => Math.min(1.0, Number((s + 0.05).toFixed(2))))}
            className="h-7 w-7"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Scrollable Stage Viewport */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-0">
        <div className="flex items-center justify-center p-2 m-auto">
          <TemplateCanvasKonva
            template={template}
            scale={scale}
            showSafeZones={showSafeZones}
            onChange={onChange}
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex w-full items-center justify-between px-4 py-2 text-[11px] text-muted-foreground border-t border-border/40 bg-card/40">
        <span>Arraste os elementos no canvas ou utilize as alças de redimensionamento</span>
        <span className="font-mono">1080 × 1920 px</span>
      </div>
    </div>
  )
}
