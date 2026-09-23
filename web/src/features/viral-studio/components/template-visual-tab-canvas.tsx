import { Layout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Typography } from '@/components/ui/typography'
import type { VisualTemplate } from '../data/template.types'

const BG_PRESETS = [
  { label: 'Dark Profundo', color: '#0D1117' },
  { label: 'Grafite Sóbrio', color: '#18181B' },
  { label: 'Azul Espacial', color: '#0F172A' },
  { label: 'Branco Limpo', color: '#FFFFFF' },
  { label: 'Vinho Escuro', color: '#1E1015' },
]

interface TemplateVisualTabCanvasProps {
  template: VisualTemplate
  onChange: (field: keyof VisualTemplate, value: unknown) => void
}

export function TemplateVisualTabCanvas({ template, onChange }: TemplateVisualTabCanvasProps) {
  return (
    // shadcn-ignore: layout
    <div className="space-y-3 rounded-lg border border-border/60 bg-card/50 p-4">
      <div className="flex items-center gap-2">
        <Layout className="h-4 w-4 text-primary" />
        <Typography
          variant="small"
          className="font-semibold text-foreground"
        >
          Fundo do Canvas (1080×1920)
        </Typography>
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        {BG_PRESETS.map((preset) => (
          <Button
            key={preset.color}
            type="button"
            variant={template.background_color === preset.color ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange('background_color', preset.color)}
            className="h-7 text-xs gap-1.5"
          >
            <span
              className="h-3 w-3 rounded-full border border-border"
              style={{ backgroundColor: preset.color }}
            />
            {preset.label}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Input
          type="color"
          value={template.background_color}
          onChange={(e) => onChange('background_color', e.target.value)}
          className="h-8 w-12 cursor-pointer p-0.5"
        />
        <Input
          type="text"
          value={template.background_color}
          onChange={(e) => onChange('background_color', e.target.value)}
          className="h-8 font-mono text-xs max-w-[120px]"
        />
      </div>
    </div>
  )
}
