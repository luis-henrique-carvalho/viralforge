import { Link } from '@tanstack/react-router'
import {
  AlertCircle,
  Bookmark,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Play,
  RefreshCw,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import type { DispatchJobRecord } from '../services/viral-studio.api'

export interface DispatchJobCardProps {
  job: DispatchJobRecord
  onRetry: (id: string) => void
  isRetrying: boolean
}

export function DispatchJobCard({ job, onRetry, isRetrying }: DispatchJobCardProps) {
  const isFailed = job.status === 'FAILED' || job.status === 'PARTIAL_FAILED'
  const isUploading = job.status === 'UPLOADING' || job.status === 'QUEUED'
  const isScheduled = job.status === 'SCHEDULED'
  const isPublished = job.status === 'PUBLISHED'

  return (
    <Card className="p-4 transition-all hover:shadow-xs flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
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

          <div className="flex flex-col gap-1 min-w-0 flex-1">
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
              {job.brand_id ? (
                <Link
                  to="/brands/$brandId"
                  params={{ brandId: job.brand_id }}
                  className="font-medium text-foreground hover:text-primary hover:underline transition-colors flex items-center gap-1"
                >
                  <Bookmark className="size-3 text-primary shrink-0" />
                  <span>{job.brand_name || 'Marca'}</span>
                </Link>
              ) : job.brand_name ? (
                <span className="font-medium text-foreground">{job.brand_name}</span>
              ) : null}
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
              {job.channel_ids.map((chId, idx) => {
                const rawName = job.channel_names?.[idx]
                const channelLabel =
                  rawName || (chId.length > 12 ? `Canal #${chId.slice(-4)}` : chId)
                return (
                  <Badge
                    key={chId}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 max-w-[160px] truncate"
                  >
                    {channelLabel}
                  </Badge>
                )
              })}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
          {job.brand_id && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs h-8"
            >
              <Link
                to="/brands/$brandId"
                params={{ brandId: job.brand_id }}
              >
                <Bookmark className="size-3.5 text-primary shrink-0" />
                <span>Ver na Marca</span>
              </Link>
            </Button>
          )}

          {job.receipts?.[0]?.post_url && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs h-8"
            >
              <a
                href={job.receipts[0].post_url}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="size-3.5" />
                <span>Ver Post</span>
              </a>
            </Button>
          )}

          {isFailed && (
            <Button
              size="sm"
              variant="default"
              onClick={() => onRetry(job.job_id)}
              disabled={isRetrying}
              className="gap-1.5 text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isRetrying ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Tentar Novamente
            </Button>
          )}
        </div>
      </div>

      {/* Error Details Alert */}
      {isFailed && job.error && (
        <Alert
          variant="destructive"
          className="py-2.5 px-3"
        >
          <AlertCircle className="size-4 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <AlertTitle className="text-xs font-semibold">Detalhes do Erro no Provider:</AlertTitle>
            <AlertDescription className="font-mono text-[11px] break-all select-all">
              {job.error}
            </AlertDescription>
          </div>
        </Alert>
      )}
    </Card>
  )
}
