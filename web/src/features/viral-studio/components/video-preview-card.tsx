import { useState, useRef } from 'react'
import { AlertCircle, Film, Loader2, Pause, Play, Sparkles } from 'lucide-react'
import { getViralVideoUrl } from '../services/viral-media.utils'
import type { ViralItem } from '../data/batch.types'

interface VideoPreviewCardProps {
  item: ViralItem
  className?: string
  children?: React.ReactNode
}

export function VideoPreviewCard({ item, className = '', children }: VideoPreviewCardProps) {
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
      try {
        const playPromise = videoRef.current.play()
        if (playPromise && typeof playPromise.then === 'function') {
          playPromise.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
        } else {
          setIsPlaying(true)
        }
      } catch {
        setIsPlaying(false)
      }
    }
  }

  const posterUrl = item.keyframe_urls?.[0] || undefined
  const videoUrl = getViralVideoUrl(item)

  return (
    <div
      className={`relative aspect-[9/16] w-full overflow-hidden rounded-[11px] bg-zinc-950 border border-zinc-800/80 flex items-center justify-center group select-none shadow-sm transition-all ${className}`}
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
      {/* Video Player when ready */}
      {isReady && videoUrl ? (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            playsInline
            loop
            onEnded={() => setIsPlaying(false)}
          />
          {/* Subtle gradient scrims for contrast */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/70 via-black/20 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Play/Pause Overlay */}
          <div
            className={`absolute inset-0 bg-black/30 backdrop-blur-[1px] transition-all duration-200 flex items-center justify-center ${
              isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
            }`}
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white shadow-2xl backdrop-blur-md transition-all duration-200 group-hover:scale-110 cursor-pointer border border-white/30">
              {isPlaying ? (
                <Pause className="size-5 text-white" />
              ) : (
                <Play className="size-5 ml-0.5 text-white" />
              )}
            </div>
          </div>
        </>
      ) : isReady && posterUrl ? (
        /* Poster Only when videoUrl is not available */
        <div className="relative size-full">
          <img
            src={posterUrl}
            alt="Keyframe preview"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30 shadow-xl transition-transform duration-200 group-hover:scale-110">
              <Play className="size-5 ml-0.5" />
            </div>
          </div>
        </div>
      ) : isBusy ? (
        /* Busy State Overlay */
        <div className="flex flex-col items-center justify-center p-4 text-center gap-3">
          <div className="relative flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
            <Loader2 className="size-6 animate-spin" />
            <Sparkles className="absolute size-2.5 text-primary -top-0.5 -right-0.5" />
          </div>
          <div className="flex flex-col gap-1">
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
        <div className="flex flex-col items-center justify-center p-4 text-center gap-2 text-destructive">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20">
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
        <div className="flex flex-col items-center justify-center p-4 text-center text-muted-foreground gap-2">
          <Film className="size-8 opacity-40" />
          <p className="text-xs">Preview Indisponível</p>
        </div>
      )}

      {/* Floating Children Overlays (Badges, Chips, Selectors) */}
      {children && (
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2.5 z-10">
          {children}
        </div>
      )}
    </div>
  )
}
