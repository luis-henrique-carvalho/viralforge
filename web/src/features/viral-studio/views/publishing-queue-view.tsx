import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  Loader2,
  Play,
  RefreshCw,
  Send,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { usePublishingQueue, useRetryPublishingDispatch } from '../hooks/use-publishing-queue'
import type { DispatchJobRecord } from '../services/viral-studio.api'

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-1 px-2 -ml-2"
            >
              <Link to="/viral-studio">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <Typography variant="h2">Fila de Envios & Auditoria</Typography>
            <Badge
              variant="secondary"
              className="gap-1 text-xs"
            >
              <Send className="h-3 w-3 text-primary" />
              Outbox Multi-Provider
            </Badge>
          </div>
          <Typography variant="muted">
            Acompanhamento assíncrono de uploads, agendamentos e histórico de envios para redes
            sociais.
          </Typography>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <Typography variant="muted">Total de Envios</Typography>
            <Typography variant="h3">{totalCount}</Typography>
          </div>
          <Layers className="h-6 w-6 text-muted-foreground opacity-50" />
        </Card>

        <Card className="p-4 flex items-center justify-between border-amber-500/20 bg-amber-500/5">
          <div>
            <Typography variant="muted">Em Andamento</Typography>
            <Typography variant="h3">{activeCount}</Typography>
          </div>
          <Loader2 className={`h-6 w-6 text-amber-500 ${activeCount > 0 ? 'animate-spin' : ''}`} />
        </Card>

        <Card className="p-4 flex items-center justify-between border-red-500/20 bg-red-500/5">
          <div>
            <Typography variant="muted">Falhas de Envio</Typography>
            <Typography variant="h3">{failedCount}</Typography>
          </div>
          <AlertCircle className="h-6 w-6 text-red-500" />
        </Card>

        <Card className="p-4 flex items-center justify-between border-emerald-500/20 bg-emerald-500/5">
          <div>
            <Typography variant="muted">Sucessos / Agendados</Typography>
            <Typography variant="h3">
              {Math.max(0, totalCount - activeCount - failedCount)}
            </Typography>
          </div>
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
        </Card>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b">
        {[
          { id: 'ALL', label: 'Todos os Envios' },
          { id: 'UPLOADING', label: 'Em Andamento' },
          { id: 'SCHEDULED', label: 'Agendados' },
          { id: 'PUBLISHED', label: 'Publicados' },
          { id: 'FAILED', label: 'Com Falha' },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={selectedStatus === tab.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedStatus(tab.id)}
            className="text-xs shrink-0"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Card
              key={n}
              className="p-4 space-y-3"
            >
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && jobs.length === 0 && (
        <Card className="p-8 text-center space-y-3 border-dashed">
          <Send className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
          <Typography variant="h4">Nenhum envio encontrado</Typography>
          <Typography
            variant="muted"
            className="max-w-md mx-auto"
          >
            Quando você agendar ou publicar vídeos no Viral Studio, o acompanhamento assíncrono e os
            logs detalhados aparecerão aqui em tempo real.
          </Typography>
        </Card>
      )}

      {/* Queue Jobs List */}
      {!isLoading && jobs.length > 0 && (
        <div className="space-y-3">
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

function DispatchJobCard({
  job,
  onRetry,
  isRetrying,
}: {
  job: DispatchJobRecord
  onRetry: (id: string) => void
  isRetrying: boolean
}) {
  const isFailed = job.status === 'FAILED' || job.status === 'PARTIAL_FAILED'
  const isUploading = job.status === 'UPLOADING' || job.status === 'QUEUED'
  const isScheduled = job.status === 'SCHEDULED'
  const isPublished = job.status === 'PUBLISHED'

  return (
    <Card className="p-4 transition-all hover:shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          {job.thumbnail_url ? (
            <img
              src={job.thumbnail_url}
              alt="Video thumbnail"
              className="w-14 h-20 object-cover rounded-md border bg-muted shrink-0"
            />
          ) : (
            // shadcn-ignore: layout
            <div className="w-14 h-20 bg-muted/60 rounded-md border flex items-center justify-center shrink-0">
              <Play className="h-5 w-5 text-muted-foreground opacity-40" />
            </div>
          )}

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Typography
                variant="small"
                className="font-semibold line-clamp-1"
              >
                {job.title || `Vídeo #${job.item_id.slice(0, 8)}`}
              </Typography>

              {/* Status Badge */}
              {isUploading && (
                <Badge
                  variant="outline"
                  className="text-amber-500 border-amber-500/30 gap-1 text-xs"
                >
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {job.status === 'QUEUED' ? 'Na Fila' : 'Enviando Vídeo...'}
                </Badge>
              )}

              {isScheduled && (
                <Badge
                  variant="outline"
                  className="text-sky-500 border-sky-500/30 gap-1 text-xs"
                >
                  <Clock className="h-3 w-3" />
                  Agendado
                </Badge>
              )}

              {isPublished && (
                <Badge
                  variant="outline"
                  className="text-emerald-500 border-emerald-500/30 gap-1 text-xs"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Publicado
                </Badge>
              )}

              {isFailed && (
                <Badge
                  variant="destructive"
                  className="gap-1 text-xs"
                >
                  <AlertCircle className="h-3 w-3" />
                  Falha no Envio
                </Badge>
              )}
            </div>

            {/* Brand & Provider Info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              {job.brand_name && (
                <span className="font-medium text-foreground">{job.brand_name}</span>
              )}
              <span>•</span>
              <span className="capitalize">
                Provider: <strong>{job.provider}</strong>
              </span>
              {job.scheduled_for && (
                <>
                  <span>•</span>
                  <span>
                    Slot:{' '}
                    {new Date(job.scheduled_for).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </>
              )}
            </div>

            {/* Channels */}
            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              {job.channel_ids.map((chId, idx) => (
                <Badge
                  key={chId}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-4"
                >
                  {job.channel_names?.[idx] || chId}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {isFailed && (
            <Button
              size="sm"
              variant="default"
              onClick={() => onRetry(job.job_id)}
              disabled={isRetrying}
              className="gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isRetrying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Tentar Novamente
            </Button>
          )}

          {job.receipts?.[0]?.post_url && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="gap-1 text-xs"
            >
              <a
                href={job.receipts[0].post_url}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Ver Post
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Error Details Accordion */}
      {isFailed && job.error && (
        <div className="p-2.5 rounded-md bg-red-500/10 border border-red-500/20 text-xs text-red-500 space-y-1">
          <div className="font-semibold flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            Detalhes do Erro no Provider:
          </div>
          <div className="font-mono text-[11px] break-all">{job.error}</div>
        </div>
      )}
    </Card>
  )
}
