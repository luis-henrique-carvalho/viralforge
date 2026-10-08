import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import type { VisualTemplate } from '../data/template.types'

interface TemplateVideoBorderControlsProps {
  template: VisualTemplate
  onChange: (field: keyof VisualTemplate, value: unknown) => void
}

export function TemplateVideoBorderControls({
  template,
  onChange,
}: TemplateVideoBorderControlsProps) {
  return (
    <>
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
    </>
  )
}
