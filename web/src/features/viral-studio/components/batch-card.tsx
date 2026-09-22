import { Link } from '@tanstack/react-router'
import { ArrowRight, Film, Layers, Sparkles } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
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

  const rawId = batch.batch_id || batch.id

  return (
    <Card className="flex flex-col justify-between border-border bg-card/60 backdrop-blur-xs transition-all hover:border-primary/40 hover:shadow-md min-w-0">
      <CardHeader className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <Layers className="size-4 text-primary shrink-0" />
              <CardTitle
                className="text-sm sm:text-base font-semibold tracking-tight text-foreground truncate"
                title={rawId}
              >
                {rawId}
              </CardTitle>
            </div>
            <Typography
              variant="muted"
              className="truncate"
              title={`${batch.brand_id} ${batch.model ? `· ${batch.model}` : ''}`}
            >
              Marca: <span className="font-medium text-foreground">{batch.brand_id}</span>
              {batch.model && (
                <>
                  {' '}
                  · Modelo:{' '}
                  <span className="font-mono text-[11px] text-muted-foreground">{batch.model}</span>
                </>
              )}
            </Typography>
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

        <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
          <Badge
            variant="secondary"
            className="gap-1.5 font-medium"
          >
            <Film className="size-3" />
            {total} {total === 1 ? 'vídeo' : 'vídeos'}
          </Badge>
          <div className="flex items-center gap-1.5">
            {readyCount > 0 && (
              <Badge
                variant="outline"
                className="gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
              >
                {readyCount} prontos
              </Badge>
            )}
            {processingCount > 0 && (
              <Badge
                variant="outline"
                className="gap-1 text-indigo-500 border-indigo-500/30 bg-indigo-500/10 animate-pulse"
              >
                {processingCount} processando
              </Badge>
            )}
            {failedCount > 0 && (
              <Badge
                variant="destructive"
                className="gap-1"
              >
                {failedCount} {failedCount === 1 ? 'falha' : 'falhas'}
              </Badge>
            )}
            {readyCount === 0 && processingCount === 0 && failedCount === 0 && (
              <Badge variant="secondary">{'\u2014'} Em espera</Badge>
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
