import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle2, Clock, Loader2, Sparkles, XCircle } from 'lucide-react'
import type { ViralItemStatus } from '../data/batch.types'

interface BatchStatusBadgeProps {
  status: ViralItemStatus | string
  className?: string
}

export function BatchStatusBadge({ status, className = '' }: BatchStatusBadgeProps) {
  const baseClasses =
    'shrink-0 whitespace-nowrap font-medium gap-1 text-[10px] px-2 py-0.5 rounded-md backdrop-blur-md transition-colors'

  switch (status) {
    case 'READY_FOR_REVIEW':
      return (
        <Badge
          variant="outline"
          className={`border-amber-500/40 bg-amber-500/15 text-amber-300 dark:text-amber-300 shadow-xs ${baseClasses} ${className}`}
        >
          <Sparkles className="size-2.5 shrink-0 text-amber-400" />
          Pronto para Revisão
        </Badge>
      )
    case 'APPROVED':
    case 'PUBLISHED':
    case 'COMPLETED':
      return (
        <Badge
          variant="outline"
          className={`border-emerald-500/40 bg-emerald-500/15 text-emerald-300 dark:text-emerald-300 shadow-xs ${baseClasses} ${className}`}
        >
          <CheckCircle2 className="size-2.5 shrink-0 text-emerald-400" />
          {status === 'APPROVED' ? 'Aprovado' : status === 'PUBLISHED' ? 'Publicado' : 'Concluído'}
        </Badge>
      )
    case 'SCHEDULED':
      return (
        <Badge
          variant="outline"
          className={`border-sky-500/40 bg-sky-500/15 text-sky-300 shadow-xs ${baseClasses} ${className}`}
        >
          <Clock className="size-2.5 shrink-0 text-sky-400" />
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
          className={`border-indigo-500/40 bg-indigo-500/15 text-indigo-300 shadow-xs ${baseClasses} ${className}`}
        >
          <Loader2 className="size-2.5 shrink-0 animate-spin text-indigo-400" />
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
          className={`border-destructive/40 bg-destructive/15 text-rose-300 shadow-xs ${baseClasses} ${className}`}
        >
          <XCircle className="size-2.5 shrink-0 text-rose-400" />
          Falha
        </Badge>
      )
    case 'CANCELLED':
      return (
        <Badge
          variant="outline"
          className={`border-zinc-700/50 bg-zinc-800/60 text-zinc-300 shadow-xs ${baseClasses} ${className}`}
        >
          <AlertTriangle className="size-2.5 shrink-0 text-zinc-400" />
          Cancelado
        </Badge>
      )
    default:
      return (
        <Badge
          variant="outline"
          className={`border-zinc-700/50 bg-zinc-800/60 text-zinc-300 shadow-xs ${baseClasses} ${className}`}
        >
          <Clock className="size-2.5 shrink-0 text-zinc-400" />
          Na Fila
        </Badge>
      )
  }
}
