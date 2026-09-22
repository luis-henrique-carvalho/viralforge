import { Loader2, RefreshCw, Sparkles, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRenderItem } from '../hooks/use-render-item'
import { getViralPosterUrl, getViralVideoUrl } from '../services/viral-media.utils'
import type { ViralItem } from '../data/batch.types'

interface ViralEditorPreviewProps {
  item: ViralItem
  currentHeadline: string
  batchId?: string
  templateId?: string
}

export function ViralEditorPreview({
  item,
  currentHeadline,
  batchId,
  templateId,
}: ViralEditorPreviewProps) {
  const renderMutation = useRenderItem(batchId)
  const isRendering = item.status === 'RENDERING' || renderMutation.isPending

  const videoUrl = getViralVideoUrl(item)
  const posterUrl = getViralPosterUrl(item)

  const handleReRender = async () => {
    await renderMutation.mutateAsync({
      itemId: item.id,
      headline: currentHeadline.trim() || undefined,
      template_id: templateId || undefined,
    })
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-[280px] mx-auto md:max-w-none">
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl border border-border/80 bg-black flex items-center justify-center shadow-md">
        {videoUrl ? (
          <video
            src={videoUrl}
            poster={posterUrl}
            preload="metadata"
            controls
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground space-y-3">
            {isRendering ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="size-8 animate-spin text-primary" />
                <span className="text-xs font-medium text-foreground">
                  Renderizando vídeo 9:16…
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Video className="size-8 opacity-40" />
                <span className="text-xs">Aguardando renderização</span>
              </div>
            )}
          </div>
        )}

        {/* Animated rendering overlay when in progress */}
        {isRendering && videoUrl && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center space-y-2 z-10 animate-fade-in">
            <div className="relative flex size-12 items-center justify-center rounded-full bg-primary/20 text-primary">
              <Loader2 className="size-6 animate-spin" />
              <Sparkles className="absolute size-3 text-primary top-1 right-1" />
            </div>
            <p className="text-xs font-semibold text-white">Re-renderizando Vídeo…</p>
            <p className="text-[10px] text-muted-foreground">Aplicando novo template e headline</p>
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="w-full text-xs gap-1.5 h-8 font-medium"
        onClick={handleReRender}
        disabled={isRendering}
      >
        {isRendering ? (
          <Loader2 className="size-3.5 animate-spin text-primary" />
        ) : (
          <RefreshCw className="size-3.5" />
        )}
        <span>{isRendering ? 'Renderizando…' : 'Re-renderizar vídeo'}</span>
      </Button>
    </div>
  )
}
