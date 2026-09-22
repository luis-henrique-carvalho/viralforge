import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle2, Clock, Loader2, Sparkles, XCircle } from 'lucide-react'
import type { ViralItemStatus } from '../data/batch.types'

interface BatchStatusBadgeProps {
  status: ViralItemStatus | string
  className?: string
}

export function BatchStatusBadge({ status, className = '' }: BatchStatusBadgeProps) {
  const baseClasses = 'shrink-0 whitespace-nowrap font-medium gap-1 text-[11px] px-2 py-0.5'

  switch (status) {
    case 'READY_FOR_REVIEW':
      return (
        <Badge
          variant="outline"
          className={`border-amber-500/30 bg-amber-500/10 text-amber-500 dark:text-amber-400 ${baseClasses} ${className}`}
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
          className={`border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ${baseClasses} ${className}`}
        >
          <CheckCircle2 className="size-3 shrink-0" />
          {status === 'APPROVED' ? 'Aprovado' : status === 'PUBLISHED' ? 'Publicado' : 'Concluído'}
        </Badge>
      )
    case 'SCHEDULED':
      return (
        <Badge
          variant="outline"
          className={`border-blue-500/30 bg-blue-500/10 text-blue-500 ${baseClasses} ${className}`}
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
          className={`border-indigo-500/30 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 animate-pulse ${baseClasses} ${className}`}
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
          className={`border-destructive/30 bg-destructive/10 text-destructive ${baseClasses} ${className}`}
        >
          <XCircle className="size-3 shrink-0" />
          Falha
        </Badge>
      )
    case 'CANCELLED':
      return (
        <Badge
          variant="outline"
          className={`border-muted-foreground/30 bg-muted/40 text-muted-foreground ${baseClasses} ${className}`}
        >
          <AlertTriangle className="size-3 shrink-0" />
          Cancelado
        </Badge>
      )
    default:
      return (
        <Badge
          variant="outline"
          className={`border-muted-foreground/30 bg-muted/20 text-muted-foreground ${baseClasses} ${className}`}
        >
          <Clock className="size-3 shrink-0" />
          Na Fila
        </Badge>
      )
  }
}
