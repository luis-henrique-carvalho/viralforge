import { Link } from '@tanstack/react-router'
import { ArrowLeft, CheckSquare, Cpu, Layers, LayoutTemplate, Sparkles, Tag, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Typography } from '@/components/ui/typography'
import { BatchStatusBadge } from './batch-status-badge'
import type { BatchResponse } from '../data/batch.types'

interface BatchResultsHeaderProps {
  batch: BatchResponse
  isSelectionMode: boolean
  onToggleSelectionMode: () => void
  selectedCount: number
  onCancelBatch?: () => void
  isCancellingBatch?: boolean
}

export function BatchResultsHeader({
  batch,
  isSelectionMode,
  onToggleSelectionMode,
  selectedCount,
  onCancelBatch,
  isCancellingBatch = false,
}: BatchResultsHeaderProps) {
  const items = batch.items || []
  const total = items.length || batch.total_items || 0
  const readyCount = items.filter((i) =>
    ['READY_FOR_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED'].includes(i.status),
  ).length
  const failedCount = items.filter((i) => i.status === 'FAILED').length
  const cancelledCount = items.filter((i) => i.status === 'CANCELLED').length
  const processingCount = items.filter((i) =>
    ['PENDING', 'DOWNLOADING', 'ANALYZING', 'RENDERING'].includes(i.status),
  ).length
  const completedOrFailed = readyCount + failedCount + cancelledCount
  const progressPercent = total > 0 ? Math.round((completedOrFailed / total) * 100) : 0
  const isAllCancelled = total > 0 && cancelledCount === total
  const isAllFailed = total > 0 && failedCount === total
  const isCompleted = total > 0 && readyCount > 0 && progressPercent === 100
  const badgeStatus = isAllCancelled
    ? 'CANCELLED'
    : isAllFailed || (readyCount === 0 && progressPercent === 100)
      ? 'FAILED'
      : isCompleted
        ? 'COMPLETED'
        : batch.status

  const rawId = batch.batch_id || batch.id

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card/60 p-4 sm:p-5 backdrop-blur-xs w-full min-w-0">
      {/* Top Bar: Back & Main Details */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg shrink-0"
              title="Voltar aos Lotes"
            >
              <Link to="/viral-studio">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2 min-w-0 truncate">
              <Layers className="size-5 text-primary shrink-0" />
              <Typography
                variant="h3"
                as="h1"
                className="min-w-0 truncate"
              >
                Lote #{rawId.length > 12 ? `${rawId.slice(0, 8)}...` : rawId}
              </Typography>
            </div>
            <BatchStatusBadge status={badgeStatus} />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-0.5 pl-0 sm:pl-10 text-xs text-muted-foreground">
            <Badge
              variant="secondary"
              className="gap-1 font-medium"
            >
              <Tag className="size-3 text-primary" />
              Marca: {batch.brand_id}
            </Badge>

            {batch.template_id && (
              <Badge
                variant="outline"
                className="gap-1 font-mono text-[11px]"
              >
                <LayoutTemplate className="size-3 text-muted-foreground" />
                {batch.template_id}
              </Badge>
            )}

            {batch.model && (
              <Badge
                variant="outline"
                className="gap-1 font-mono text-[11px]"
              >
                <Cpu className="size-3 text-indigo-500" />
                {batch.model}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions: Cancel Batch & Selection mode toggle */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {processingCount > 0 && onCancelBatch && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5"
                  disabled={isCancellingBatch}
                >
                  <X className="size-3.5" />
                  <span>Cancelar Lote</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar processamento do lote?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação interromperá o processamento de todos os vídeos pendentes deste lote.
                    Os vídeos já prontos ou aprovados serão preservados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onCancelBatch}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Confirmar Cancelamento
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Button
            variant={isSelectionMode ? 'default' : 'outline'}
            size="sm"
            className="gap-2"
            onClick={onToggleSelectionMode}
          >
            <CheckSquare className="size-4" />
            {isSelectionMode ? (
              <span>Modo Seleção ({selectedCount})</span>
            ) : (
              <span>Ações em Massa</span>
            )}
          </Button>
        </div>
      </div>

      {/* Progress Bar & Counter */}
      <div className="space-y-1.5 pt-2 border-t border-border/40">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 flex-wrap">
            <Sparkles className="size-3 text-primary" />
            Progresso Geral:{' '}
            <strong className="text-foreground">
              {readyCount} de {total}
            </strong>{' '}
            vídeos prontos
            {failedCount > 0 && (
              <span className="text-destructive font-medium">({failedCount} falhas)</span>
            )}
            {cancelledCount > 0 && (
              <span className="text-muted-foreground font-medium">
                ({cancelledCount} cancelados)
              </span>
            )}
          </span>
          <span className="font-mono font-medium text-foreground">{progressPercent}%</span>
        </div>
        <Progress
          value={progressPercent}
          className="h-2"
        />
      </div>
    </div>
  )
}
