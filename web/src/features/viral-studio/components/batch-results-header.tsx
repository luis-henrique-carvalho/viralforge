import { Link } from '@tanstack/react-router'
import { ArrowLeft, CheckSquare, Cpu, Layers, LayoutTemplate, Sparkles, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
}

export function BatchResultsHeader({
  batch,
  isSelectionMode,
  onToggleSelectionMode,
  selectedCount,
}: BatchResultsHeaderProps) {
  const items = batch.items || []
  const total = items.length || batch.total_items || 0
  const readyCount = items.filter((i) =>
    ['READY_FOR_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED'].includes(i.status),
  ).length
  const failedCount = items.filter((i) => i.status === 'FAILED').length
  const completedOrFailed = readyCount + failedCount
  const progressPercent = total > 0 ? Math.round((completedOrFailed / total) * 100) : 0
  const isAllFailed = total > 0 && failedCount === total
  const isCompleted = total > 0 && progressPercent === 100 && !isAllFailed

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
            <BatchStatusBadge
              status={isAllFailed ? 'FAILED' : isCompleted ? 'COMPLETED' : batch.status}
            />
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

        {/* Selection mode toggle */}
        <div className="flex items-center gap-2 self-end sm:self-center">
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
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-3 text-primary" />
            Progresso Geral:{' '}
            <strong className="text-foreground">
              {readyCount} de {total}
            </strong>{' '}
            vídeos prontos
            {failedCount > 0 && (
              <span className="text-destructive font-medium">({failedCount} falhas)</span>
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
