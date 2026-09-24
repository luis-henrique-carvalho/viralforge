import { Type, AlignLeft, AlignCenter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Typography } from '@/components/ui/typography'
import type { VisualTemplate } from '../data/template.types'

interface TemplateVisualTabHeadlineProps {
  template: VisualTemplate
  onChange: (field: keyof VisualTemplate, value: unknown) => void
}

export function TemplateVisualTabHeadline({ template, onChange }: TemplateVisualTabHeadlineProps) {
  return (
    // shadcn-ignore: layout
    <div className="space-y-3 rounded-lg border border-border/60 bg-card/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-primary" />
          <Typography
            variant="small"
            className="font-semibold text-foreground"
          >
            Headline Dinâmica
          </Typography>
        </div>
        <Switch
          checked={template.headline_enabled}
          onCheckedChange={(v) => onChange('headline_enabled', v)}
        />
      </div>

      {template.headline_enabled && (
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Fonte</Label>
              <Select
                value={template.headline_font}
                onValueChange={(v) => onChange('headline_font', v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Fonte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Montserrat-ExtraBold">Montserrat ExtraBold</SelectItem>
                  <SelectItem value="Poppins-Medium">Poppins Medium</SelectItem>
                  <SelectItem value="Anton-Regular">Anton Display</SelectItem>
                  <SelectItem value="NotoSerif-Bold">Noto Serif Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cor do Texto</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={template.headline_color}
                  onChange={(e) => onChange('headline_color', e.target.value)}
                  className="h-8 w-10 p-0.5"
                />
                <Input
                  value={template.headline_color}
                  onChange={(e) => onChange('headline_color', e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Alinhamento</Label>
            <div className="flex gap-1.5">
              <Button
                type="button"
                variant={template.headline_alignment === 'left' ? 'default' : 'outline'}
                size="sm"
                className="flex-1 h-8 text-xs gap-1.5"
                onClick={() => onChange('headline_alignment', 'left')}
              >
                <AlignLeft className="h-3.5 w-3.5" />
                Esquerda
              </Button>
              <Button
                type="button"
                variant={template.headline_alignment !== 'left' ? 'default' : 'outline'}
                size="sm"
                className="flex-1 h-8 text-xs gap-1.5"
                onClick={() => onChange('headline_alignment', 'center')}
              >
                <AlignCenter className="h-3.5 w-3.5" />
                Centro
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Tamanho da Fonte Base</span>
              <span>{template.headline_font_size}px</span>
            </div>
            <Slider
              value={[template.headline_font_size]}
              min={24}
              max={96}
              step={2}
              onValueChange={([val]) => onChange('headline_font_size', val)}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Posição Vertical (Y)</span>
              <span>{template.headline_y}px</span>
            </div>
            <Slider
              value={[template.headline_y]}
              min={40}
              max={600}
              step={10}
              onValueChange={([val]) => onChange('headline_y', val)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
