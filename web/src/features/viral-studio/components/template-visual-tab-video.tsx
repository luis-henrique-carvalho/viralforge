import { Sliders } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Typography } from '@/components/ui/typography'
import type { VisualTemplate } from '../data/template.types'

interface TemplateVisualTabVideoProps {
  template: VisualTemplate
  onChange: (field: keyof VisualTemplate, value: unknown) => void
}

export function TemplateVisualTabVideo({ template, onChange }: TemplateVisualTabVideoProps) {
  return (
    // shadcn-ignore: layout
    <div className="space-y-3 rounded-lg border border-border/60 bg-card/50 p-4">
      <div className="flex items-center gap-2">
        <Sliders className="h-4 w-4 text-primary" />
        <Typography
          variant="small"
          className="font-semibold text-foreground"
        >
          Caixa de Vídeo & Geometria
        </Typography>
      </div>

      <div className="space-y-3 pt-1">
        <div className="space-y-1.5">
          <Label className="text-xs">Proporção Rápida</Label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['1:1', '4:5', '16:9', 'free'] as const).map((asp) => (
              <Button
                key={asp}
                type="button"
                size="sm"
                variant={template.video_aspect === asp ? 'default' : 'outline'}
                onClick={() => {
                  onChange('video_aspect', asp)
                  if (asp === '1:1') onChange('video_height', 1000)
                  if (asp === '4:5') onChange('video_height', 1250)
                  if (asp === '16:9') onChange('video_height', 620)
                }}
                className="h-7 text-xs font-semibold"
              >
                {asp.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Posição Y</span>
            <span>{template.video_y}px</span>
          </div>
          <Slider
            value={[template.video_y]}
            min={50}
            max={950}
            step={10}
            onValueChange={([val]) => onChange('video_y', val)}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Altura do Vídeo</span>
            <span>{template.video_height}px</span>
          </div>
          <Slider
            value={[template.video_height]}
            min={400}
            max={1500}
            step={20}
            onValueChange={([val]) => onChange('video_height', val)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs">Arredondamento</Label>
            <Slider
              value={[template.video_radius]}
              min={0}
              max={48}
              step={2}
              onValueChange={([val]) => onChange('video_radius', val)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Espessura Borda</Label>
            <Slider
              value={[template.video_border_width]}
              min={0}
              max={10}
              step={1}
              onValueChange={([val]) => onChange('video_border_width', val)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Cor da Borda</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={template.video_border_color}
              onChange={(e) => onChange('video_border_color', e.target.value)}
              className="h-8 w-10 p-0.5"
            />
            <Input
              value={template.video_border_color}
              onChange={(e) => onChange('video_border_color', e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
