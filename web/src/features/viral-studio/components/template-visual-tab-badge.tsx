import { Type } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Typography } from '@/components/ui/typography'
import type { VisualTemplate } from '../data/template.types'

interface TemplateVisualTabBadgeProps {
  template: VisualTemplate
  onChange: (field: keyof VisualTemplate, value: unknown) => void
}

export function TemplateVisualTabBadge({ template, onChange }: TemplateVisualTabBadgeProps) {
  return (
    // shadcn-ignore: layout
    <div className="space-y-3 rounded-lg border border-border/60 bg-card/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-rose-500" />
          <Typography
            variant="small"
            className="font-semibold text-foreground"
          >
            Selo / Badge de Nicho
          </Typography>
        </div>
        <Switch
          checked={template.badge_enabled}
          onCheckedChange={(v) => onChange('badge_enabled', v)}
        />
      </div>

      {template.badge_enabled && (
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Texto do Selo</Label>
            <Input
              value={template.custom_badge_text || ''}
              onChange={(e) => onChange('custom_badge_text', e.target.value)}
              placeholder="VOCÊ SABIA? / URGENTE / REVIEW"
              className="h-8 text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Cor Fundo</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={template.custom_badge_bg_color}
                  onChange={(e) => onChange('custom_badge_bg_color', e.target.value)}
                  className="h-8 w-10 p-0.5"
                />
                <Input
                  value={template.custom_badge_bg_color}
                  onChange={(e) => onChange('custom_badge_bg_color', e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cor Texto</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={template.custom_badge_text_color}
                  onChange={(e) => onChange('custom_badge_text_color', e.target.value)}
                  className="h-8 w-10 p-0.5"
                />
                <Input
                  value={template.custom_badge_text_color}
                  onChange={(e) => onChange('custom_badge_text_color', e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Posição Vertical (Y)</span>
              <span>{template.badge_y}px</span>
            </div>
            <Slider
              value={[template.badge_y]}
              min={20}
              max={400}
              step={5}
              onValueChange={([val]) => onChange('badge_y', val)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
