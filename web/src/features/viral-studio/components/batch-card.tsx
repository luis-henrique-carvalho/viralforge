import { Link } from '@tanstack/react-router'
import { ArrowRight, Film, Layers, Sparkles } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { BatchStatusBadge } from './batch-status-badge'
import type { BatchResponse } from '../data/batch.types'

interface BatchCardProps {
  batch: BatchResponse
}

export function BatchCard({ batch }: BatchCardProps) {
  const items = batch.items || []
  const total = items.length || batch.total_items || 0
  const readyCount = items.filter((i) =>
    ['READY_FOR_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED'].includes(i.status),
  ).length
  const failedCount = items.filter((i) => i.status === 'FAILED').length
  const processingCount = items.filter((i) =>
    ['PENDING', 'DOWNLOADING', 'ANALYZING', 'RENDERING'].includes(i.status),
  ).length

  const progressPercent = total > 0 ? Math.round(((readyCount + failedCount) / total) * 100) : 0
  const isAllFailed = total > 0 && failedCount === total
  const isCompleted = total > 0 && processingCount === 0 && !isAllFailed

  return (
    <Card className="flex flex-col justify-between border-border bg-card/60 backdrop-blur-xs transition-all hover:border-primary/40 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-primary shrink-0" />
              <CardTitle className="text-base font-semibold tracking-tight text-foreground truncate max-w-[200px]">
                {batch.batch_id || batch.id}
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              Marca: <span className="font-medium text-foreground">{batch.brand_id}</span>
              {batch.model && (
                <>
                  {' '}
                  · Modelo:{' '}
                  <span className="font-mono text-[11px] text-muted-foreground">{batch.model}</span>
                </>
              )}
            </p>
          </div>
          <BatchStatusBadge
            status={isAllFailed ? 'FAILED' : isCompleted ? 'COMPLETED' : batch.status}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progresso do Lote</span>
            <span className="font-medium text-foreground">{progressPercent}%</span>
          </div>
          <Progress
            value={progressPercent}
            className="h-2"
          />
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Film className="size-3.5" />
            <span>
              {total} {total === 1 ? 'vídeo' : 'vídeos'}
            </span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            {readyCount > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400">{readyCount} prontos</span>
            )}
            {processingCount > 0 && (
              <span className="text-indigo-500 animate-pulse">{processingCount} processando</span>
            )}
            {failedCount > 0 && (
              <span className="text-destructive">
                {failedCount} {failedCount === 1 ? 'falha' : 'falhas'}
              </span>
            )}
            {readyCount === 0 && processingCount === 0 && failedCount === 0 && (
              <span className="text-muted-foreground">Em espera</span>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2 border-t border-border/40">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-full justify-between hover:bg-primary/10 hover:text-primary"
        >
          <Link
            to="/viral-studio/$id"
            params={{ id: batch.batch_id || batch.id }}
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="size-3.5 text-primary" />
              Ver Resultados do Lote
            </span>
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
