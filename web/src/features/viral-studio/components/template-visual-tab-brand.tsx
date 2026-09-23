import { Label } from '@/components/ui/label'
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
      <div className="space-y-2 pt-1">
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
    </div>
  )
}
