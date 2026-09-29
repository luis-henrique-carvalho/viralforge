import { CheckCircle2, Clock, ExternalLink, Tag, Zap } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { VideoPreviewCard } from '@/features/viral-studio/components/video-preview-card'
import type { ViralItem } from '@/features/viral-studio/data/batch.types'

interface BrandVideoCardProps {
  video: ViralItem
  onApprove: (video: ViralItem) => void
  onAutoSchedule: (video: ViralItem) => void
  onOpenPublishModal: (video: ViralItem) => void
  onNavigateToTab?: (tab: string) => void
  isAutoSchedulePending: boolean
}

export function BrandVideoCard({
  video,
  onApprove,
  onAutoSchedule,
  onOpenPublishModal,
  onNavigateToTab,
  isAutoSchedulePending,
}: BrandVideoCardProps) {
  const statusUpper = (video.status || 'PENDING').toUpperCase()
  const isReady = statusUpper === 'READY_FOR_REVIEW'
  const isApproved = statusUpper === 'APPROVED'
  const isScheduled = statusUpper === 'SCHEDULED'
  const isPublished = statusUpper === 'PUBLISHED'

  const lastPubRecord = video.publication_records?.[video.publication_records.length - 1]
  const hasPublishError = isApproved && lastPubRecord?.status === 'failed'

  return (
    <Card className="flex flex-col justify-between border-border bg-card/60 backdrop-blur-xs transition-all hover:border-primary/40 overflow-hidden group">
      <div className="p-2 pb-0">
        <VideoPreviewCard item={video}>
          <div
            className="flex items-center justify-between gap-1.5 w-full pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {video.product_code ? (
                <Badge
                  variant="secondary"
                  className="gap-1 font-mono text-[10px] py-0.5 px-2 h-5 bg-black/65 backdrop-blur-md text-white border border-white/20 shadow-xs truncate"
                >
                  <Tag className="size-2.5 text-primary shrink-0" />
                  <span className="truncate">{video.product_code}</span>
                </Badge>
              ) : (
                <span
                  className="font-mono text-[10px] text-zinc-300 bg-black/65 backdrop-blur-md border border-white/20 px-1.5 py-0.5 rounded-md truncate shadow-xs shrink-0"
                  title={video.id}
                >
                  #{video.id.slice(0, 8)}
                </span>
              )}
            </div>

            <div className="pointer-events-auto shrink-0">
              <Badge
                variant={
                  isPublished
                    ? 'default'
                    : isScheduled
                      ? 'secondary'
                      : isApproved
                        ? 'default'
                        : 'outline'
                }
                className={`text-[10px] font-semibold tracking-wide ${
                  hasPublishError
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : isApproved
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isScheduled
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : isPublished
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {hasPublishError
                  ? '⚠️ Falha no Envio'
                  : isApproved
                    ? 'Aprovado'
                    : isScheduled
                      ? 'Agendado'
                      : isPublished
                        ? 'Publicado'
                        : isReady
                          ? 'Pronto p/ Revisão'
                          : video.status}
              </Badge>
            </div>
          </div>
        </VideoPreviewCard>
      </div>

      <CardContent className="p-3 space-y-2 text-xs flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <Typography
            variant="small"
            className="font-medium line-clamp-2 text-foreground text-xs leading-snug"
          >
            {video.selected_headline || 'Vídeo sem headline selecionada'}
          </Typography>
          {video.caption && (
            <Typography
              variant="muted"
              className="line-clamp-2 text-[11px]"
            >
              {video.caption}
            </Typography>
          )}

          {hasPublishError && Boolean(lastPubRecord?.error) && (
            <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 line-clamp-2">
              Erro de envio: {String(lastPubRecord?.error)}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <span>ID: {video.id.slice(0, 8)}</span>
          <span>{video.model || 'gemini'}</span>
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0 gap-1.5 flex-col">
        {isReady && (
          <Button
            size="sm"
            onClick={() => onApprove(video)}
            className="w-full gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle2 className="size-3.5" />
            Aprovar Vídeo
          </Button>
        )}

        {hasPublishError && (
          <div className="grid grid-cols-2 gap-1.5 w-full">
            <Button
              size="sm"
              onClick={() => onAutoSchedule(video)}
              disabled={isAutoSchedulePending}
              className="gap-1 text-xs bg-amber-600 hover:bg-amber-700 text-white px-2"
              title="Tentar reenviar imediatamente"
            >
              <Zap className="size-3 fill-current" />
              Retentar Envio
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenPublishModal(video)}
              className="text-xs px-2"
            >
              Opções...
            </Button>
          </div>
        )}

        {isApproved && !hasPublishError && (
          <div className="grid grid-cols-2 gap-1.5 w-full">
            <Button
              size="sm"
              onClick={() => onAutoSchedule(video)}
              disabled={isAutoSchedulePending}
              className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2"
              title="Auto-agendar no próximo horário vago"
            >
              <Zap className="size-3 fill-current" />
              Auto-Agendar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenPublishModal(video)}
              className="text-xs px-2"
            >
              Personalizar...
            </Button>
          </div>
        )}

        {isScheduled && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onNavigateToTab?.('schedule')}
            className="w-full gap-1.5 text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20"
          >
            <Clock className="size-3.5" />
            Ver na Fila
          </Button>
        )}

        {isPublished && (
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-1.5 text-xs text-muted-foreground"
            onClick={() => onNavigateToTab?.('schedule')}
          >
            <ExternalLink className="size-3.5" />
            Ver Métricas
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
