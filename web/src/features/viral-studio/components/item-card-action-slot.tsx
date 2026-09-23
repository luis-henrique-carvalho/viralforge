import { CheckCircle2, Clock, ExternalLink, RefreshCw, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ViralItem } from '../data/batch.types'

export interface ItemCardActionSlotProps {
  item: ViralItem
  onApprove?: (itemId: string) => void
  onRetry?: (itemId: string) => void
  onPublish?: (item: ViralItem) => void
  onCancelSchedule?: (itemId: string) => void
  isApproving?: boolean
  isRetrying?: boolean
  isCancelling?: boolean
}

export function ItemCardActionSlot({
  item,
  onApprove,
  onRetry,
  onPublish,
  onCancelSchedule,
  isApproving = false,
  isRetrying = false,
  isCancelling = false,
}: ItemCardActionSlotProps) {
  const isReady = item.status === 'READY_FOR_REVIEW'
  const isFailed = item.status === 'FAILED'

  if (isReady) {
    return (
      <Button
        variant="outline"
        size="icon-xs"
        className="size-8 rounded-lg p-0 flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-500 hover:text-emerald-400 transition-all shadow-2xs"
        onClick={() => onApprove?.(item.id)}
        disabled={isApproving}
        title="Aprovar Vídeo"
        aria-label="Aprovar Vídeo"
      >
        <CheckCircle2 className="size-3.5" />
        <span className="sr-only">Aprovar Vídeo</span>
      </Button>
    )
  }

  if (item.status === 'APPROVED') {
    return (
      <div className="flex items-center gap-1.5">
        <div
          className="size-8 rounded-lg flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 select-none shadow-2xs"
          title="Vídeo Aprovado"
        >
          <CheckCircle2 className="size-3.5" />
          <span className="sr-only">Vídeo Aprovado</span>
        </div>
        {onPublish && (
          <Button
            variant="outline"
            size="icon-xs"
            className="size-8 rounded-lg p-0 flex items-center justify-center bg-blue-500/10 hover:bg-blue-500/25 border-blue-500/40 text-blue-500 hover:text-blue-400 transition-all shadow-2xs"
            onClick={() => onPublish(item)}
            title="Publicar Vídeo"
            aria-label="Publicar Vídeo"
          >
            <Send className="size-3.5" />
            <span className="sr-only">Publicar Vídeo</span>
          </Button>
        )}
      </div>
    )
  }

  if (item.status === 'SCHEDULED') {
    return (
      <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-500 text-xs font-medium">
        <Clock className="size-3.5 shrink-0" />
        <span
          className="truncate text-[11px]"
          title={item.scheduled_for || 'Agendado'}
        >
          {item.scheduled_for
            ? new Date(item.scheduled_for).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
              })
            : 'Agendado'}
        </span>
        {onCancelSchedule && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="size-5 ml-0.5 p-0 hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded"
            onClick={() => onCancelSchedule(item.id)}
            disabled={isCancelling}
            title="Cancelar Agendamento"
            aria-label="Cancelar Agendamento"
          >
            <X className="size-3" />
          </Button>
        )}
      </div>
    )
  }

  if (item.status === 'PUBLISHED') {
    return (
      <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
        <CheckCircle2 className="size-3.5 shrink-0" />
        <span className="text-[11px]">Publicado</span>
        {item.post_url && (
          <a
            href={item.post_url}
            target="_blank"
            rel="noreferrer"
            className="hover:text-emerald-300 ml-0.5"
            title="Ver Post"
          >
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>
    )
  }

  if (isFailed) {
    return (
      <Button
        variant="outline"
        size="icon-xs"
        className="size-8 rounded-lg p-0 flex items-center justify-center bg-destructive/10 hover:bg-destructive/20 border-destructive/30 text-destructive transition-all"
        onClick={() => onRetry?.(item.id)}
        disabled={isRetrying}
        title="Tentar Novamente"
        aria-label="Tentar Novamente"
      >
        <RefreshCw className={`size-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
        <span className="sr-only">Tentar Novamente</span>
      </Button>
    )
  }

  return (
    <div
      className="size-8 rounded-lg flex items-center justify-center bg-muted/20 border border-border/40 text-muted-foreground"
      title="Processando"
    >
      <Clock className="size-3.5 animate-pulse text-muted-foreground/80" />
      <span className="sr-only">Processando</span>
    </div>
  )
}
