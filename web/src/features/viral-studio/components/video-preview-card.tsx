import { useState, useRef } from 'react'
import { AlertCircle, Film, Loader2, Pause, Play, Sparkles } from 'lucide-react'
import type { ViralItem } from '../data/batch.types'

interface VideoPreviewCardProps {
  item: ViralItem
  className?: string
}

export function VideoPreviewCard({ item, className = '' }: VideoPreviewCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const isBusy = ['PENDING', 'DOWNLOADING', 'ANALYZING', 'RENDERING'].includes(item.status)
  const isFailed = item.status === 'FAILED'
  const isReady = ['READY_FOR_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED'].includes(item.status)

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false))
    }
  }

  const posterUrl = item.keyframe_urls?.[0] || undefined
  const videoUrl = item.rendered_path ? `/api/viral-studio/media/${item.id}` : undefined

  return (
    <div
      className={`relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-muted/90 border border-border/80 flex items-center justify-center group select-none shadow-xs ${className}`}
      onClick={isReady && videoUrl ? togglePlay : undefined}
      role={isReady && videoUrl ? 'button' : undefined}
      tabIndex={isReady && videoUrl ? 0 : undefined}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          togglePlay()
        }
      }}
    >
      {/* Video Player when ready and rendered */}
      {isReady && videoUrl ? (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl}
            className="h-full w-full object-cover"
            playsInline
            loop
            onEnded={() => setIsPlaying(false)}
          />
          {/* Play/Pause Overlay */}
          <div
            className={`absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity flex items-center justify-center ${
              isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
            }`}
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-background/80 text-foreground shadow-lg backdrop-blur-md transition-transform group-hover:scale-110">
              {isPlaying ? <Pause className="size-5" /> : <Play className="size-5 ml-0.5" />}
            </div>
          </div>
        </>
      ) : isBusy ? (
        /* Busy State Overlay */
        <div className="flex flex-col items-center justify-center p-4 text-center space-y-3">
          <div className="relative flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Loader2 className="size-7 animate-spin" />
            <Sparkles className="absolute size-3 text-primary top-1 right-1" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {item.status === 'DOWNLOADING'
                ? 'Baixando Fonte'
                : item.status === 'ANALYZING'
                  ? 'IA Analisando'
                  : item.status === 'RENDERING'
                    ? 'Renderizando 9:16'
                    : 'Aguardando Fila'}
            </p>
            <p className="text-[11px] text-muted-foreground line-clamp-2 px-2">
              {item.model ? `Modelo: ${item.model}` : 'Processamento multissinal ativo...'}
            </p>
          </div>
        </div>
      ) : isFailed ? (
        /* Failed State Overlay */
        <div className="flex flex-col items-center justify-center p-4 text-center space-y-2 text-destructive">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="size-6" />
          </div>
          <div>
            <p className="text-xs font-semibold">Falha no Processamento</p>
            <p className="text-[11px] text-muted-foreground line-clamp-3 mt-1 px-1">
              {item.error_message || 'Erro desconhecido durante o pipeline de renderização.'}
            </p>
          </div>
        </div>
      ) : (
        /* Fallback placeholder */
        <div className="flex flex-col items-center justify-center p-4 text-center text-muted-foreground space-y-2">
          <Film className="size-8 opacity-40" />
          <p className="text-xs">Preview Indisponível</p>
        </div>
      )}
    </div>
  )
}
