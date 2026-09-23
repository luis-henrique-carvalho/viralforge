import { Image as ImageIcon, Upload } from 'lucide-react'
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
    if (file && onUploadExtraImage) {
      onUploadExtraImage(file)
    }
  }

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
              <SelectTrigger className="h-8 text-xs">
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

          {template.extra_image_template_type === 'custom_upload' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Enviar Arquivo (PNG/JPG)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="h-8 text-xs cursor-pointer file:cursor-pointer"
                />
                <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Posição Vertical (Y)</span>
              <span>{template.extra_image_y}px</span>
            </div>
            <Slider
              value={[template.extra_image_y]}
              min={800}
              max={1750}
              step={10}
              onValueChange={([val]) => onChange('extra_image_y', val)}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Altura</span>
              <span>{template.extra_image_height}px</span>
            </div>
            <Slider
              value={[template.extra_image_height]}
              min={100}
              max={700}
              step={10}
              onValueChange={([val]) => onChange('extra_image_height', val)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
