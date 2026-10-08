import { Sliders } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Typography } from '@/components/ui/typography'
import { TemplateVideoBorderControls } from './template-video-border-controls'
import { TemplateVideoFreeControls } from './template-video-free-controls'
import type { VideoAspect, VisualTemplate } from '../data/template.types'

interface TemplateVisualTabVideoProps {
  template: VisualTemplate
  onChange: (field: keyof VisualTemplate, value: unknown) => void
}

const ASPECT_PRESETS: Array<{ id: VideoAspect; label: string }> = [
  { id: '1:1', label: '1:1' },
  { id: '4:5', label: '4:5' },
  { id: '16:9', label: '16:9' },
  { id: '9:16', label: '9:16 (FULL)' },
  { id: 'free', label: 'FREE' },
]

const Y_POSITION_PRESETS = [
  { label: 'Tela Cheia 0px', y: 0 },
  { label: 'Topo 260px', y: 260 },
  { label: 'Centro 380px', y: 380 },
  { label: 'Baixo 550px', y: 550 },
]

export function TemplateVisualTabVideo({ template, onChange }: TemplateVisualTabVideoProps) {
  const isFree = template.video_aspect === 'free'

  const handleAspectChange = (asp: VideoAspect) => {
    onChange('video_aspect', asp)
    if (asp === '9:16') {
      onChange('video_fit', 'cover')
      onChange('video_x', 0)
      onChange('video_y', 0)
      onChange('video_width', 1080)
      onChange('video_height', 1920)
      onChange('video_scale', 100)
      onChange('video_radius', 0)
      onChange('video_border_width', 0)
    } else if (asp === '1:1') {
      onChange('video_height', 1000)
    } else if (asp === '4:5') {
      onChange('video_height', 1250)
    } else if (asp === '16:9') {
      onChange('video_height', 620)
    }
  }

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
          <div className="grid grid-cols-5 gap-1">
            {ASPECT_PRESETS.map((asp) => (
              <Button
                key={asp.id}
                type="button"
                size="sm"
                variant={template.video_aspect === asp.id ? 'default' : 'outline'}
                onClick={() => handleAspectChange(asp.id)}
                className="h-7 px-1 text-[11px] font-semibold truncate"
              >
                {asp.label}
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
            min={0}
            max={950}
            step={10}
            onValueChange={([val]) => onChange('video_y', val)}
          />
          <div className="grid grid-cols-4 gap-1 pt-1">
            {Y_POSITION_PRESETS.map((preset) => (
              <Button
                key={preset.y}
                type="button"
                size="sm"
                variant={template.video_y === preset.y ? 'secondary' : 'outline'}
                onClick={() => onChange('video_y', preset.y)}
                className="h-6 text-[10px] px-1 truncate"
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
            max={1920}
            step={20}
            onValueChange={([val]) => onChange('video_height', val)}
          />
        </div>

        {/* Border, Radius & Color Controls */}
        <TemplateVideoBorderControls
          template={template}
          onChange={onChange}
        />
      </div>
    </div>
  )
}
