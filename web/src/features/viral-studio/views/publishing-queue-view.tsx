import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, RefreshCw, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { DispatchJobCard } from '../components/dispatch-job-card'
import { PublishingQueueEmpty } from '../components/publishing-queue-empty'
import { PublishingQueueKpis } from '../components/publishing-queue-kpis'
import { PublishingQueueSkeleton } from '../components/publishing-queue-skeleton'
import { PublishingQueueTabs } from '../components/publishing-queue-tabs'
import { usePublishingQueue, useRetryPublishingDispatch } from '../hooks/use-publishing-queue'

export function PublishingQueueView() {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const statusParam = selectedStatus === 'ALL' ? undefined : selectedStatus

  const { data, isLoading, isRefetching, refetch } = usePublishingQueue({
    status: statusParam,
  })
  const retryMutation = useRetryPublishingDispatch()

  const jobs = data?.jobs || []
  const activeCount = data?.active_count || 0
  const failedCount = data?.failed_count || 0
  const totalCount = data?.total || 0

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-1.5 px-2.5 -ml-2 text-muted-foreground hover:text-foreground h-8"
            >
              <Link to="/viral-studio">
                <ArrowLeft className="size-4" />
                <span>Voltar ao Studio</span>
              </Link>
            </Button>
            <div className="h-4 w-px bg-border/80" />
            <Typography
              variant="h2"
              as="h1"
              className="text-xl sm:text-2xl font-bold tracking-tight"
            >
              Fila de Envios & Auditoria
            </Typography>
            <Badge
              variant="secondary"
              className="gap-1 text-xs font-medium px-2 py-0.5"
            >
              <Send className="size-3 text-primary" />
              Outbox Multi-Provider
            </Badge>
          </div>
          <Typography
            variant="muted"
            className="text-xs sm:text-sm"
          >
            Acompanhamento assíncrono de uploads, agendamentos e histórico de envios para redes
            sociais.
          </Typography>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-2 text-xs h-9"
          >
            <RefreshCw className={`size-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      {/* Global Queue KPIs */}
      <PublishingQueueKpis
        totalCount={totalCount}
        activeCount={activeCount}
        failedCount={failedCount}
      />

      {/* Status Filter Tabs */}
      <PublishingQueueTabs
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        totalCount={totalCount}
        activeCount={activeCount}
        failedCount={failedCount}
      />

      {/* Loading Skeletons */}
      {isLoading && <PublishingQueueSkeleton />}

      {/* Empty State */}
      {!isLoading && jobs.length === 0 && (
        <PublishingQueueEmpty
          selectedStatus={selectedStatus}
          onResetFilter={() => setSelectedStatus('ALL')}
        />
      )}

      {/* Queue Jobs List */}
      {!isLoading && jobs.length > 0 && (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <DispatchJobCard
              key={job.job_id}
              job={job}
              onRetry={(id) => retryMutation.mutate(id)}
              isRetrying={retryMutation.isPending && retryMutation.variables === job.job_id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
