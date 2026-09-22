import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle2, Clock, Loader2, Sparkles, XCircle } from 'lucide-react'
import type { ViralItemStatus } from '../data/batch.types'

interface BatchStatusBadgeProps {
  status: ViralItemStatus | string
  className?: string
}

export function BatchStatusBadge({ status, className }: BatchStatusBadgeProps) {
  switch (status) {
    case 'READY_FOR_REVIEW':
      return (
        <Badge
          variant="outline"
          className={`border-amber-500/30 bg-amber-500/10 text-amber-500 dark:text-amber-400 gap-1.5 font-medium ${className}`}
        >
          <Sparkles className="size-3 shrink-0" />
          Pronto para Revisão
        </Badge>
      )
    case 'APPROVED':
    case 'PUBLISHED':
    case 'COMPLETED':
      return (
        <Badge
          variant="outline"
          className={`border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1.5 font-medium ${className}`}
        >
          <CheckCircle2 className="size-3 shrink-0" />
          {status === 'APPROVED' ? 'Aprovado' : status === 'PUBLISHED' ? 'Publicado' : 'Concluído'}
        </Badge>
      )
    case 'SCHEDULED':
      return (
        <Badge
          variant="outline"
          className={`border-blue-500/30 bg-blue-500/10 text-blue-500 gap-1.5 font-medium ${className}`}
        >
          <Clock className="size-3 shrink-0" />
          Agendado
        </Badge>
      )
    case 'DOWNLOADING':
    case 'ANALYZING':
    case 'RENDERING':
    case 'PROCESSING':
      return (
        <Badge
          variant="outline"
          className={`border-indigo-500/30 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 gap-1.5 font-medium animate-pulse ${className}`}
        >
          <Loader2 className="size-3 shrink-0 animate-spin" />
          {status === 'DOWNLOADING'
            ? 'Baixando'
            : status === 'ANALYZING'
              ? 'IA Analisando'
              : status === 'RENDERING'
                ? 'Renderizando'
                : 'Processando'}
        </Badge>
      )
    case 'FAILED':
      return (
        <Badge
          variant="outline"
          className={`border-destructive/30 bg-destructive/10 text-destructive gap-1.5 font-medium ${className}`}
        >
          <XCircle className="size-3 shrink-0" />
          Falha
        </Badge>
      )
    case 'CANCELLED':
      return (
        <Badge
          variant="outline"
          className={`border-muted-foreground/30 bg-muted/40 text-muted-foreground gap-1.5 font-medium ${className}`}
        >
          <AlertTriangle className="size-3 shrink-0" />
          Cancelado
        </Badge>
      )
    default:
      return (
        <Badge
          variant="outline"
          className={`border-muted-foreground/30 bg-muted/20 text-muted-foreground gap-1.5 font-medium ${className}`}
        >
          <Clock className="size-3 shrink-0" />
          Na Fila
        </Badge>
      )
  }
}
