import { useEffect, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import { CopyRegenerationCard } from './copy-regeneration-card'
import type { ItemEditorFormData } from '../data/item-editor.schema'
import type { ViralItem } from '../data/batch.types'

interface HeadlinesTabProps {
  item: ViralItem
  form: UseFormReturn<ItemEditorFormData>
  batchId?: string
  onApplyHeadline: (headline: string) => void
  onCopyRegenerated: (updated: ViralItem) => void
}

export function ViralEditorHeadlinesTab({
  item,
  form,
  batchId,
  onApplyHeadline,
  onCopyRegenerated,
}: HeadlinesTabProps) {
  const currentHeadline = form.watch('selected_headline')
  const [headlinesList, setHeadlinesList] = useState<string[]>(item.ai_copy?.headlines || [])

  useEffect(() => {
    if (item.ai_copy?.headlines) {
      setHeadlinesList(item.ai_copy.headlines)
    }
  }, [item.ai_copy?.headlines])

  const context = item.ai_context_summary as Record<string, unknown> | null
  const scenesCount = (context?.scenes_count as number) || 1
  const keyframesCount = (context?.keyframes_count as number) || item.keyframe_urls?.length || 0
  const hasAudio = context?.has_audio ?? Boolean(context?.transcript)
  const hasOriginalCaption = context?.has_original_caption ?? Boolean(context?.original_caption)
  const duration = (context?.duration as number) || 0

  const handleCopyRegen = (updated: ViralItem) => {
    if (updated.ai_copy?.headlines) {
      setHeadlinesList(updated.ai_copy.headlines)
    }
    onCopyRegenerated(updated)
  }

  return (
    <div className="space-y-4">
      {/* Context Badges */}
      {context && (
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant="secondary"
            className="gap-1 text-[11px] font-normal"
          >
            🎬 {scenesCount} cenas ({keyframesCount} frames)
          </Badge>
          <Badge
            variant="secondary"
            className="gap-1 text-[11px] font-normal"
          >
            {hasAudio ? '🎙️ Áudio com fala' : '🎵 Sem fala / Música'}
          </Badge>
          {hasOriginalCaption && (
            <Badge
              variant="secondary"
              className="gap-1 text-[11px] font-normal"
            >
              📝 Post original capturado
            </Badge>
          )}
          {duration > 0 && (
            <Badge
              variant="secondary"
              className="gap-1 text-[11px] font-normal"
            >
              ⏱️ {duration}s
            </Badge>
          )}
        </div>
      )}

      {/* Suggested Headlines */}
      <div className="space-y-2">
        <Typography variant="muted">
          Escolha uma das opções magnéticas geradas pela IA ou personalize abaixo:
        </Typography>

        {headlinesList.length > 0 ? (
          <div className="space-y-1.5">
            {headlinesList.map((h) => {
              const isSelected = currentHeadline === h
              return (
                /* shadcn-ignore: seletor de lista de cards de títulos magnéticos */
                <button
                  key={h}
                  type="button"
                  onClick={() => onApplyHeadline(h)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-foreground font-medium ring-1 ring-primary'
                      : 'border-border/70 bg-card/60 hover:border-primary/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="flex-1 break-words">{h}</span>
                  {isSelected && <Check className="size-4 text-primary shrink-0" />}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border/80 p-4 text-center text-xs text-muted-foreground">
            Nenhuma sugestão da IA disponível para este item.
          </div>
        )}
      </div>

      {/* Active Headline Input */}
      <div className="space-y-1.5">
        <Label
          htmlFor="active-headline"
          className="text-[11px] uppercase font-semibold text-muted-foreground"
        >
          Headline Ativa no Vídeo
        </Label>
        <Input
          id="active-headline"
          {...form.register('selected_headline')}
          placeholder="Digite a headline que aparecerá no topo do vídeo"
          className="text-xs h-9"
        />
        {form.formState.errors.selected_headline && (
          <Typography variant="destructive">
            {form.formState.errors.selected_headline.message}
          </Typography>
        )}
        <Typography variant="muted">
          Ao alterar a headline, clique em <strong>Re-renderizar vídeo</strong> para gerar o novo
          MP4 com o template visual.
        </Typography>
      </div>

      {/* AI Copy Regeneration Card */}
      <CopyRegenerationCard
        item={item}
        batchId={batchId}
        onCopyRegenerated={handleCopyRegen}
      />
    </div>
  )
}
