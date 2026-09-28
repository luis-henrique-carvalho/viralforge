import { Sparkles, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Typography } from '@/components/ui/typography'
import { ColorPickerField } from './color-picker-field'
import type { VisualTemplate } from '../data/template.types'

const BADGE_PRESETS = [
  { text: '💡 VOCÊ SABIA?', bg: '#2563EB', text_color: '#FFFFFF' },
  { text: '🔥 ACHADINHO', bg: '#EA580C', text_color: '#FFFFFF' },
  { text: '⚡ URGENTE', bg: '#DC2626', text_color: '#FFFFFF' },
  { text: '⭐ DICA DO DIA', bg: '#059669', text_color: '#FFFFFF' },
  { text: '🛒 OFERTA DO DIA', bg: '#7C3AED', text_color: '#FFFFFF' },
  { text: '🧠 FATO CURIOSO', bg: '#0284C7', text_color: '#FFFFFF' },
]

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
          <Tag className="h-4 w-4 text-rose-500" />
          <Typography
            variant="small"
            className="font-semibold text-foreground"
          >
            Selo / Badge de Nicho (Hook Tag)
          </Typography>
        </div>
        <Switch
          checked={template.badge_enabled}
          onCheckedChange={(v) => onChange('badge_enabled', v)}
        />
      </div>

      {template.badge_enabled && (
        <div className="space-y-3 pt-2">
          {/* Quick Hook Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Ganchos e Categorias Prontas</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {BADGE_PRESETS.map((preset) => (
                <Button
                  key={preset.text}
                  type="button"
                  size="sm"
                  variant={template.custom_badge_text === preset.text ? 'default' : 'outline'}
                  onClick={() => {
                    onChange('custom_badge_text', preset.text)
                    onChange('custom_badge_bg_color', preset.bg)
                    onChange('custom_badge_text_color', preset.text_color)
                  }}
                  className="h-6 text-[11px] px-2"
                >
                  {preset.text}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Texto Personalizado do Selo</Label>
            <Input
              value={template.custom_badge_text || ''}
              onChange={(e) => onChange('custom_badge_text', e.target.value)}
              placeholder="Ex: VOCÊ SABIA? / REVIEW / SEGREDO"
              className="h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ColorPickerField
              label="Cor Fundo"
              value={template.custom_badge_bg_color || '#E11D48'}
              defaultValue="#E11D48"
              onChange={(c) => onChange('custom_badge_bg_color', c)}
            />
            <ColorPickerField
              label="Cor Texto"
              value={template.custom_badge_text_color || '#FFFFFF'}
              defaultValue="#FFFFFF"
              onChange={(c) => onChange('custom_badge_text_color', c)}
            />
          </div>

          <div className="space-y-1.5 pt-1 border-t border-border/40">
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
                {template.badge_y}px
              </Typography>
            </div>
            <Slider
              value={[template.badge_y]}
              min={10}
              max={450}
              step={5}
              onValueChange={([val]) => onChange('badge_y', val)}
            />
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {[
                { label: 'Topo 40px', y: 40 },
                { label: 'Meio 120px', y: 120 },
                { label: 'Baixo 300px', y: 300 },
              ].map((pos) => (
                <Button
                  key={pos.y}
                  type="button"
                  size="sm"
                  variant={template.badge_y === pos.y ? 'secondary' : 'outline'}
                  onClick={() => onChange('badge_y', pos.y)}
                  className="h-6 text-[10px] px-1"
                >
                  {pos.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
