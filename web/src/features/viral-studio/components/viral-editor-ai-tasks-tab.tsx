import type { UseFormReturn } from 'react-hook-form'
import { Sparkles, Tag, MessageSquare, Type } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import { Card, CardContent } from '@/components/ui/card'
import type { ItemEditorFormData } from '../data/item-editor.schema'
import type { ViralItem } from '../data/batch.types'

interface ViralEditorAiTasksTabProps {
  item: ViralItem
  form: UseFormReturn<ItemEditorFormData>
}

export function ViralEditorAiTasksTab({ item, form }: ViralEditorAiTasksTabProps) {
  const customOutputs = (item.ai_copy?.custom_outputs || {}) as Record<string, unknown>

  const otherOutputs = Object.entries(customOutputs).filter(
    ([k]) =>
      ![
        'badge_text',
        'canvas_badge',
        'footer_text',
        'canvas_extra_image',
        'social_title',
        'post_title',
      ].includes(k),
  )

  return (
    <div className="space-y-4 text-xs">
      {/* Intro info */}
      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
        <Sparkles className="size-4 shrink-0" />
        <Typography
          variant="muted"
          className="text-xs text-primary font-medium"
        >
          As saídas de IA configuradas no template são aplicadas dinamicamente no vídeo e nos canais
          de publicação.
        </Typography>
      </div>

      {/* Dynamic Canvas Badge */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="badge-text"
            className="flex items-center gap-1.5 text-[11px] uppercase font-semibold text-muted-foreground"
          >
            <Tag className="size-3.5 text-rose-500" />
            Badge Dinâmico do Canvas
          </Label>
          <span className="text-[10px] text-muted-foreground">
            {form.watch('badge_text')?.length || 0}/60
          </span>
        </div>
        <Input
          id="badge-text"
          {...form.register('badge_text')}
          placeholder="Ex: ACHADINHO 🔥 ou SUPER OFERTA"
          maxLength={60}
          className="h-9 text-xs"
        />
        {form.formState.errors.badge_text && (
          <Typography variant="destructive">{form.formState.errors.badge_text.message}</Typography>
        )}
        <Typography variant="muted">
          Texto de destaque no topo do canvas 1080x1920. Substitui o badge estático do template ao
          renderizar.
        </Typography>
      </div>

      {/* Dynamic Footer / Comment Text */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="footer-text"
            className="flex items-center gap-1.5 text-[11px] uppercase font-semibold text-muted-foreground"
          >
            <MessageSquare className="size-3.5 text-emerald-500" />
            Texto do Card de Rodapé
          </Label>
          <span className="text-[10px] text-muted-foreground">
            {form.watch('footer_text')?.length || 0}/240
          </span>
        </div>
        <Input
          id="footer-text"
          {...form.register('footer_text')}
          placeholder="Ex: Já conhecia esse achado? Comente EU QUERO!"
          maxLength={240}
          className="h-9 text-xs"
        />
        {form.formState.errors.footer_text && (
          <Typography variant="destructive">{form.formState.errors.footer_text.message}</Typography>
        )}
        <Typography variant="muted">
          Pergunta ou chamada de retenção exibida no card inferior do canvas.
        </Typography>
      </div>

      {/* Social Title */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="social-title"
            className="flex items-center gap-1.5 text-[11px] uppercase font-semibold text-muted-foreground"
          >
            <Type className="size-3.5 text-primary" />
            Título Social (YouTube Shorts / TikTok)
          </Label>
          <span className="text-[10px] text-muted-foreground">
            {form.watch('social_title')?.length || 0}/120
          </span>
        </div>
        <Input
          id="social-title"
          {...form.register('social_title')}
          placeholder="Ex: Como economizar tempo na cozinha com isso"
          maxLength={120}
          className="h-9 text-xs"
        />
        {form.formState.errors.social_title && (
          <Typography variant="destructive">
            {form.formState.errors.social_title.message}
          </Typography>
        )}
        <Typography variant="muted">
          Título de alta conversão para o feed de publicação (tem prioridade sobre a headline do
          vídeo).
        </Typography>
      </div>

      {/* Additional outputs read-only preview */}
      {otherOutputs.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/40">
          <Typography
            variant="small"
            className="text-[11px] uppercase font-semibold text-muted-foreground"
          >
            Outras Saídas de IA ({otherOutputs.length})
          </Typography>
          <div className="space-y-2">
            {otherOutputs.map(([key, val]) => (
              <Card
                key={key}
                className="border-border bg-muted/20 shadow-none"
              >
                <CardContent className="p-2.5 text-xs">
                  <div className="font-semibold text-foreground capitalize mb-1">
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="font-mono text-muted-foreground whitespace-pre-wrap text-[11px]">
                    {typeof val === 'string'
                      ? val
                      : typeof val === 'object'
                        ? JSON.stringify(val, null, 2)
                        : String(val)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
