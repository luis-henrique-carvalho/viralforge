import { CheckCircle2, Upload } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import { resolveImageUrl } from '../hooks/use-konva-image'
import type { VisualTemplate } from '../data/template.types'

interface TemplateFooterUploadPanelProps {
  template: VisualTemplate
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function TemplateFooterUploadPanel({
  template,
  onFileChange,
}: TemplateFooterUploadPanelProps) {
  const previewSrc = resolveImageUrl(template.extra_image_url || template.extra_image_path)

  return (
    // shadcn-ignore: layout
    <div className="space-y-2.5 p-2.5 rounded-lg border border-border/60 bg-muted/20">
      <Label className="text-xs">Banner Personalizado (PNG/JPG)</Label>
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="h-8 text-xs cursor-pointer file:cursor-pointer"
        />
        <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
      {previewSrc && (
        <div className="space-y-1.5 pt-1">
          {/* shadcn-ignore: layout */}
          <div className="relative h-20 w-full overflow-hidden rounded border border-border bg-black/40 flex items-center justify-center">
            <img
              src={previewSrc}
              alt="Banner Preview"
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      )}
      {template.extra_image_path && (
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-500">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <Typography
            variant="muted"
            className="truncate text-emerald-500 text-[11px]"
          >
            Arquivo: {template.extra_image_path.split('/').pop()}
          </Typography>
        </div>
      )}
    </div>
  )
}
