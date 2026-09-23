import { Image as ImageIcon } from 'lucide-react'
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
import { TemplateFooterTextPanel } from './template-footer-text-panel'
import { TemplateFooterUploadPanel } from './template-footer-upload-panel'
import type { VisualTemplate } from '../data/template.types'

interface TemplateVisualTabFooterProps {
  template: VisualTemplate
  onChange: (field: keyof VisualTemplate, value: unknown) => void
  onUploadExtraImage?: (file: File) => void
}

export function TemplateVisualTabFooter({
  template,
  onChange,
  onUploadExtraImage,
}: TemplateVisualTabFooterProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        if (
          typeof window !== 'undefined' &&
          window.URL &&
          typeof window.URL.createObjectURL === 'function'
        ) {
          const localUrl = window.URL.createObjectURL(file)
          if (localUrl) {
            onChange('extra_image_url', localUrl)
          }
        }
      } catch {
        // Fallback safely in mock/test environments
      }
      onChange('extra_image_path', file.name)
      onChange('extra_image_template_type', 'custom_upload')
      onChange('extra_image_enabled', true)
      if (onUploadExtraImage) {
        onUploadExtraImage(file)
      }
    }
  }

  const isCustomUpload = template.extra_image_template_type === 'custom_upload'

  return (
    // shadcn-ignore: layout
    <div className="space-y-3 rounded-lg border border-border/60 bg-card/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-emerald-500" />
          <Typography
            variant="small"
            className="font-semibold text-foreground"
          >
            Card de Rodapé / Imagem Extra
          </Typography>
        </div>
        <Switch
          checked={template.extra_image_enabled}
          onCheckedChange={(v) => onChange('extra_image_enabled', v)}
        />
      </div>

      {template.extra_image_enabled && (
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de Card de Rodapé</Label>
            <Select
              value={template.extra_image_template_type}
              onValueChange={(v) => onChange('extra_image_template_type', v)}
            >
              <SelectTrigger
                aria-label="Tipo de Card de Rodapé"
                className="h-8 text-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comment">💬 Caixa de Comentário</SelectItem>
                <SelectItem value="follow">🔔 Chamada para Seguir</SelectItem>
                <SelectItem value="deal">🛒 Card de Oferta / Bio</SelectItem>
                <SelectItem value="fact">💡 Fato Curioso / Salvar</SelectItem>
                <SelectItem value="custom_upload">📁 Upload Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isCustomUpload ? (
            <TemplateFooterUploadPanel
              template={template}
              onFileChange={handleFileChange}
            />
          ) : (
            <TemplateFooterTextPanel
              template={template}
              onChange={onChange}
            />
          )}

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
                {template.extra_image_y}px
              </Typography>
            </div>
            <Slider
              value={[template.extra_image_y]}
              min={600}
              max={1750}
              step={10}
              onValueChange={([val]) => onChange('extra_image_y', val)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <Typography
                  variant="muted"
                  className="text-xs"
                >
                  Altura
                </Typography>
                <Typography
                  variant="muted"
                  className="text-xs font-mono"
                >
                  {template.extra_image_height}px
                </Typography>
              </div>
              <Slider
                value={[template.extra_image_height]}
                min={80}
                max={700}
                step={10}
                onValueChange={([val]) => onChange('extra_image_height', val)}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <Typography
                  variant="muted"
                  className="text-xs"
                >
                  Arredondamento
                </Typography>
                <Typography
                  variant="muted"
                  className="text-xs font-mono"
                >
                  {template.extra_image_radius}px
                </Typography>
              </div>
              <Slider
                value={[template.extra_image_radius]}
                min={0}
                max={48}
                step={2}
                onValueChange={([val]) => onChange('extra_image_radius', val)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
