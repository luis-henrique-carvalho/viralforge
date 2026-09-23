import { AlignCenter, AlignLeft } from 'lucide-react'
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

interface TemplateVisualTabBrandProps {
  template: VisualTemplate
  onChange: (field: keyof VisualTemplate, value: unknown) => void
}

export function TemplateVisualTabBrand({ template, onChange }: TemplateVisualTabBrandProps) {
  return (
    // shadcn-ignore: layout
    <div className="space-y-3 rounded-lg border border-border/60 bg-card/50 p-4">
      <Typography
        variant="small"
        className="font-semibold text-foreground"
      >
        Identidade da Marca
      </Typography>

      <div className="space-y-3 pt-1">
        {/* Alignment */}
        <div className="space-y-1.5">
          <Label className="text-xs">Alinhamento do Cabeçalho</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              size="sm"
              variant={template.brand_alignment === 'left' ? 'default' : 'outline'}
              onClick={() => onChange('brand_alignment', 'left')}
              className="h-7 text-xs gap-1.5"
            >
              <AlignLeft className="h-3.5 w-3.5" />
              Esquerda
            </Button>
            <Button
              type="button"
              size="sm"
              variant={template.brand_alignment === 'center' ? 'default' : 'outline'}
              onClick={() => onChange('brand_alignment', 'center')}
              className="h-7 text-xs gap-1.5"
            >
              <AlignCenter className="h-3.5 w-3.5" />
              Centralizado
            </Button>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2 pt-1 border-t border-border/40">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Exibir Avatar</Label>
            <Switch
              checked={template.avatar_enabled}
              onCheckedChange={(v) => onChange('avatar_enabled', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Exibir Nome & Handle</Label>
            <Switch
              checked={template.brand_name_enabled}
              onCheckedChange={(v) => onChange('brand_name_enabled', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Exibir Marca-d'água</Label>
            <Switch
              checked={template.watermark_enabled}
              onCheckedChange={(v) => onChange('watermark_enabled', v)}
            />
          </div>
        </div>

        {/* Position & Sizing */}
        {template.avatar_enabled && (
          <div className="space-y-2.5 pt-2 border-t border-border/40">
            {template.brand_alignment === 'left' && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Posição Horizontal (X)</span>
                  <span>{template.avatar_x}px</span>
                </div>
                <Slider
                  value={[template.avatar_x]}
                  min={20}
                  max={400}
                  step={5}
                  onValueChange={([val]) => onChange('avatar_x', val)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Posição Vertical (Y)</span>
                <span>{template.avatar_y}px</span>
              </div>
              <Slider
                value={[template.avatar_y]}
                min={30}
                max={300}
                step={5}
                onValueChange={([val]) => onChange('avatar_y', val)}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tamanho do Avatar</span>
                <span>{template.avatar_size}px</span>
              </div>
              <Slider
                value={[template.avatar_size]}
                min={40}
                max={180}
                step={5}
                onValueChange={([val]) => onChange('avatar_size', val)}
              />
            </div>
          </div>
        )}

        {/* Typography Colors */}
        {template.brand_name_enabled && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
            <div className="space-y-1.5">
              <Label className="text-xs">Cor do Nome</Label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="color"
                  value={template.brand_name_color}
                  onChange={(e) => onChange('brand_name_color', e.target.value)}
                  className="h-7 w-8 p-0.5"
                />
                <Input
                  value={template.brand_name_color}
                  onChange={(e) => onChange('brand_name_color', e.target.value)}
                  className="h-7 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Cor do @Handle</Label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="color"
                  value={template.handle_color}
                  onChange={(e) => onChange('handle_color', e.target.value)}
                  className="h-7 w-8 p-0.5"
                />
                <Input
                  value={template.handle_color}
                  onChange={(e) => onChange('handle_color', e.target.value)}
                  className="h-7 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Watermark Position & Opacity */}
        {template.watermark_enabled && (
          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="space-y-1.5">
              <Label className="text-xs">Posição da Marca-d'água</Label>
              <Select
                value={template.watermark_position}
                onValueChange={(v) => onChange('watermark_position', v)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top-left">Topo Esquerda</SelectItem>
                  <SelectItem value="top-right">Topo Direita</SelectItem>
                  <SelectItem value="bottom-left">Inferior Esquerda</SelectItem>
                  <SelectItem value="bottom-right">Inferior Direita</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Opacidade da Marca-d'água</span>
                <span>{Math.round(template.watermark_opacity * 100)}%</span>
              </div>
              <Slider
                value={[template.watermark_opacity]}
                min={0.1}
                max={1.0}
                step={0.05}
                onValueChange={([val]) => onChange('watermark_opacity', val)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
