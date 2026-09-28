import { Sliders } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Typography } from '@/components/ui/typography'
import { TemplateVideoFreeControls } from './template-video-free-controls'
import type { VisualTemplate } from '../data/template.types'

interface TemplateVisualTabVideoProps {
  template: VisualTemplate
  onChange: (field: keyof VisualTemplate, value: unknown) => void
}

export function TemplateVisualTabVideo({ template, onChange }: TemplateVisualTabVideoProps) {
  const isFree = template.video_aspect === 'free'

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
        {/* Aspect Ratio Presets */}
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

        {/* Video Fit */}
        <div className="space-y-1.5">
          <Label className="text-xs">Ajuste do Vídeo (Enquadramento)</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'cover', label: 'Preencher / Cover' },
              { id: 'contain', label: 'Conter / Contain' },
            ].map((fitOpt) => (
              <Button
                key={fitOpt.id}
                type="button"
                size="sm"
                variant={template.video_fit === fitOpt.id ? 'default' : 'outline'}
                onClick={() => onChange('video_fit', fitOpt.id)}
                className="h-7 text-xs font-medium"
              >
                {fitOpt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* FREE Mode Width & Scale Sliders */}
        {isFree && (
          <TemplateVideoFreeControls
            template={template}
            onChange={onChange}
          />
        )}

        {/* Video Y Position */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <Typography
              variant="muted"
              className="text-xs"
            >
              Posição Vertical (Y)
            </Typography>
            <Typography
              variant="muted"
              className="text-xs font-mono"
            >
              {template.video_y}px
            </Typography>
          </div>
          <Slider
            value={[template.video_y]}
            min={40}
            max={950}
            step={10}
            onValueChange={([val]) => onChange('video_y', val)}
          />
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {[
              { label: 'Topo 260px', y: 260 },
              { label: 'Centro 380px', y: 380 },
              { label: 'Baixo 550px', y: 550 },
            ].map((preset) => (
              <Button
                key={preset.y}
                type="button"
                size="sm"
                variant={template.video_y === preset.y ? 'secondary' : 'outline'}
                onClick={() => onChange('video_y', preset.y)}
                className="h-6 text-[11px] px-1"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Video Height */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <Typography
              variant="muted"
              className="text-xs"
            >
              Altura do Vídeo
            </Typography>
            <Typography
              variant="muted"
              className="text-xs font-mono"
            >
              {template.video_height}px
            </Typography>
          </div>
          <Slider
            value={[template.video_height]}
            min={300}
            max={1600}
            step={20}
            onValueChange={([val]) => onChange('video_height', val)}
          />
        </div>

        {/* Border & Radius */}
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
            <div className="flex items-center justify-between">
              <Label className="text-xs">Borda</Label>
              <Button
                type="button"
                size="sm"
                variant={template.video_border_width === 0 ? 'secondary' : 'ghost'}
                onClick={() =>
                  onChange('video_border_width', template.video_border_width === 0 ? 2 : 0)
                }
                className="h-5 px-1.5 text-[10px]"
              >
                {template.video_border_width === 0 ? 'Sem Borda ✓' : 'Sem Borda'}
              </Button>
            </div>
            <Slider
              value={[template.video_border_width]}
              min={0}
              max={10}
              step={1}
              onValueChange={([val]) => onChange('video_border_width', val)}
            />
          </div>
        </div>

        {/* Border Color */}
        {template.video_border_width > 0 && (
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
        )}
      </div>
    </div>
  )
}
