import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ColorPickerField } from './color-picker-field'
import type { VisualTemplate } from '../data/template.types'

interface TemplateFooterTextPanelProps {
  template: VisualTemplate
  onChange: (field: keyof VisualTemplate, value: unknown) => void
}

export function TemplateFooterTextPanel({ template, onChange }: TemplateFooterTextPanelProps) {
  return (
    <div className="space-y-2.5 pt-1 border-t border-border/40">
      <div className="space-y-1.5">
        <Label className="text-xs">Título Principal do Card (Opcional)</Label>
        <Input
          value={template.extra_image_title ?? ''}
          placeholder="Ex: O QUE VOCÊ ACHOU?"
          onChange={(e) => onChange('extra_image_title', e.target.value || null)}
          className="h-8 text-xs"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Subtítulo / Chamada Secundária (Opcional)</Label>
        <Input
          value={template.extra_image_subtitle ?? ''}
          placeholder="Ex: Deixe seu comentário e compartilhe!"
          onChange={(e) => onChange('extra_image_subtitle', e.target.value || null)}
          className="h-8 text-xs"
        />
      </div>

      <div className="grid grid-cols-3 gap-2 pt-1">
        <ColorPickerField
          label="Cor Fundo"
          value={template.extra_image_bg_color || '#18181B'}
          onChange={(c) => onChange('extra_image_bg_color', c)}
        />
        <ColorPickerField
          label="Cor Texto"
          value={template.extra_image_text_color || '#FFFFFF'}
          onChange={(c) => onChange('extra_image_text_color', c)}
        />
        <ColorPickerField
          label="Cor Borda"
          value={template.extra_image_border_color || '#3F3F46'}
          onChange={(c) => onChange('extra_image_border_color', c)}
        />
      </div>
    </div>
  )
}
