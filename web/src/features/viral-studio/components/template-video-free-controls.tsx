import { Slider } from '@/components/ui/slider'
import { Typography } from '@/components/ui/typography'
import type { VisualTemplate } from '../data/template.types'

interface TemplateVideoFreeControlsProps {
  template: VisualTemplate
  onChange: (field: keyof VisualTemplate, value: unknown) => void
}

export function TemplateVideoFreeControls({ template, onChange }: TemplateVideoFreeControlsProps) {
  const currentX = template.video_x ?? Math.round((1080 - 1080 * (template.video_scale / 100)) / 2)
  const maxX = Math.max(0, 1080 - Math.round(1080 * (template.video_scale / 100)))

  return (
    // shadcn-ignore: layout
    <div className="space-y-2 p-2.5 rounded bg-muted/30 border border-border/50">
      <Typography
        variant="muted"
        className="text-[11px] font-semibold text-primary"
      >
        Controles do Modo Livre (FREE)
      </Typography>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <Typography
            variant="muted"
            className="text-xs"
          >
            Largura / Escala
          </Typography>
          <Typography
            variant="muted"
            className="text-xs font-mono"
          >
            {template.video_scale}%
          </Typography>
        </div>
        <Slider
          value={[template.video_scale]}
          min={20}
          max={100}
          step={1}
          onValueChange={([val]) => onChange('video_scale', val)}
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <Typography
            variant="muted"
            className="text-xs"
          >
            Posição Horizontal (X)
          </Typography>
          <Typography
            variant="muted"
            className="text-xs font-mono"
          >
            {template.video_x ?? 'Centralizado'}
          </Typography>
        </div>
        <Slider
          value={[currentX]}
          min={0}
          max={maxX}
          step={5}
          onValueChange={([val]) => onChange('video_x', val)}
        />
      </div>
    </div>
  )
}
