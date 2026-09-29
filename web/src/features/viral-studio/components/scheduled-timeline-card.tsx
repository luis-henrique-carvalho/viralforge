import { useState } from 'react'
import {
  Clock,
  ExternalLink,
  Eye,
  Heart,
  Loader2,
  MessageCircle,
  Play,
  RotateCw,
  Trash2,
  Zap,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Typography } from '@/components/ui/typography'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { env } from '@/config/env'
import type { ScheduledPost } from '../data/batch.types'

interface ScheduledTimelineCardProps {
  post: ScheduledPost
  onCancelClick: (post: ScheduledPost) => void
  onPublishNowClick?: (post: ScheduledPost) => void
  onRefreshMetricsClick?: (post: ScheduledPost) => void
  isPublishingNow?: boolean
  isRefreshingMetrics?: boolean
}

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return ''
  try {
    const diff = new Date(dateStr).getTime() - Date.now()
    const absDiff = Math.abs(diff)
    const isPast = diff < 0
    const mins = Math.floor(absDiff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)

    if (mins < 1) return 'Agora mesmo'
    if (mins < 60) return isPast ? `Há ${mins} min` : `Em ${mins} min`
    if (hours < 24) return isPast ? `Há ${hours}h` : `Em ${hours}h`
    return isPast ? `Há ${days}d` : `Em ${days}d`
  } catch {
    return ''
  }
}

function formatDateTime(isoString?: string | null): string {
  if (!isoString) return 'Horário a definir'
  try {
    return new Date(isoString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

function renderStatusBadge(status: string) {
  const norm = status.toUpperCase()
  if (norm === 'QUEUED') {
    return (
      <Badge
        variant="secondary"
        className="gap-1 bg-sky-500/15 text-sky-400 border border-sky-500/30 text-[10px] font-mono uppercase"
      >
        <Loader2 className="size-3 animate-spin" /> Na Fila
      </Badge>
    )
  }
  if (norm === 'UPLOADING') {
    return (
      <Badge
        variant="secondary"
        className="gap-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-mono uppercase animate-pulse"
      >
        <Loader2 className="size-3 animate-spin text-amber-400" /> Enviando...
      </Badge>
    )
  }
  if (norm === 'PUBLISHED') {
    return (
      <Badge
        variant="default"
        className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono uppercase"
      >
        Publicado
      </Badge>
    )
  }
  if (norm === 'FAILED' || norm === 'PARTIAL_FAILED') {
    return (
      <Badge
        variant="destructive"
        className="text-[10px] font-mono uppercase"
      >
        Falhou
      </Badge>
    )
  }
  return (
    <Badge
      variant="secondary"
      className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-mono uppercase"
    >
      Agendado
    </Badge>
  )
}

function renderMetricsBar(
  metrics: Record<string, unknown>,
  onRefresh?: () => void,
  isRefreshing?: boolean,
) {
  const views = typeof metrics.views === 'number' ? metrics.views : 0
  const likes = typeof metrics.likes === 'number' ? metrics.likes : 0
  const comments = typeof metrics.comments === 'number' ? metrics.comments : 0

  return (
    // shadcn-ignore: layout
    <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-md border border-border/40">
      <span
        className="flex items-center gap-1"
        title="Visualizações"
      >
        <Eye className="size-3 text-blue-400" />
        {views}
      </span>
      <span
        className="flex items-center gap-1"
        title="Curtidas"
      >
        <Heart className="size-3 text-rose-400" />
        {likes}
      </span>
      <span
        className="flex items-center gap-1"
        title="Comentários"
      >
        <MessageCircle className="size-3 text-emerald-400" />
        {comments}
      </span>
      {onRefresh && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="size-5 p-0 hover:bg-muted text-muted-foreground"
          title="Atualizar métricas"
        >
          <RotateCw className={`size-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  )
}

function resolveProviderUrl(
  rawProviderUrl: string | null | undefined,
  postId: string,
  postizPublicBase: string | undefined,
): string | undefined {
  if (!rawProviderUrl) return undefined
  let providerUrl = rawProviderUrl
  if (postizPublicBase) {
    providerUrl = providerUrl?.replace(/^http:\/\/(?:postiz:5000|localhost:4007)/, postizPublicBase)
    if (
      providerUrl &&
      (providerUrl.endsWith('/posts') ||
        providerUrl.includes('postiz:5000') ||
        providerUrl.includes('localhost:4007'))
    ) {
      providerUrl = postId
        ? `${postizPublicBase}/p/${postId}?share=true`
        : `${postizPublicBase}/launches`
    }
  } else if (
    providerUrl &&
    (providerUrl.endsWith('/posts') || providerUrl.includes('postiz:5000'))
  ) {
    const fallbackBase =
      providerUrl.startsWith('http') && !providerUrl.includes('postiz:5000')
        ? providerUrl.replace(/\/posts$/, '')
        : 'http://localhost:4007'
    providerUrl = postId ? `${fallbackBase}/p/${postId}?share=true` : `${fallbackBase}/launches`
  }
  return providerUrl
}

function renderMediaPreviewDialog(
  previewOpen: boolean,
  setPreviewOpen: (open: boolean) => void,
  post: ScheduledPost,
  videoSrc?: string,
) {
  if (!previewOpen) return null

  return (
    <Dialog
      open={previewOpen}
      onOpenChange={setPreviewOpen}
    >
      <DialogContent className="max-w-md p-4">
        <DialogHeader>
          <DialogTitle className="text-sm">{post.title || 'Mídia da Publicação'}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 flex items-center justify-center rounded-lg overflow-hidden bg-black aspect-9/16 max-h-[70vh]">
          {videoSrc && videoSrc.endsWith('.mp4') ? (
            <video
              src={videoSrc}
              controls
              autoPlay
              className="w-full h-full object-contain"
              poster={post.thumbnail_url || undefined}
            />
          ) : post.thumbnail_url ? (
            <img
              src={post.thumbnail_url}
              alt="Media preview"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="p-8 text-center text-muted-foreground text-xs">
              Nenhuma mídia disponível
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ScheduledTimelineCard({
  post,
  onCancelClick,
  onPublishNowClick,
  onRefreshMetricsClick,
  isPublishingNow,
  isRefreshingMetrics,
}: ScheduledTimelineCardProps) {
  const [showFullCaption, setShowFullCaption] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  const status = (post.status || 'scheduled').toUpperCase()
  const isScheduled = status === 'SCHEDULED'
  const isPublished = status === 'PUBLISHED'
  const inQueue = status === 'QUEUED' || status === 'UPLOADING'
  const postId = post.post_id || post.id || ''
  const scheduledTime = post.scheduled_time || post.scheduled_for || post.published_at
  const relTime = formatRelativeTime(scheduledTime)
  const externalUrl = post.external_url || post.post_url
  const postizPublicBase = env.VITE_POSTIZ_PUBLIC_URL?.replace(/\/$/, '')
  const providerUrl = resolveProviderUrl(
    post.provider_url || post.provider_post_url,
    postId,
    postizPublicBase,
  )
  const metrics = (post.metrics || {}) as Record<string, unknown>
  const videoSrc = (post.raw_response as Record<string, unknown> | undefined)?.rendered_path
    ? String((post.raw_response as Record<string, unknown>).rendered_path)
    : post.thumbnail_url?.replace(/rendered_thumbnail\.jpg.*$/, 'rendered.mp4')

  return (
    <Card className="border-border bg-card/60 backdrop-blur-xs transition-all hover:border-primary/30 p-4">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="relative group shrink-0 size-20 rounded-lg overflow-hidden border border-border bg-muted/40">
            {post.thumbnail_url ? (
              <img
                src={post.thumbnail_url}
                alt={post.title || 'Thumbnail'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted/60 text-muted-foreground">
                <Play className="size-6 opacity-40" />
              </div>
            )}
            {post.thumbnail_url && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewOpen(true)}
                className="absolute inset-0 size-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                title="Visualizar mídia"
              >
                <Play className="size-5 fill-current" />
              </Button>
            )}
          </div>

          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Typography
                variant="small"
                className="font-semibold truncate max-w-sm"
              >
                {post.title || (postId ? `Post #${postId.slice(0, 8)}` : 'Publicação')}
              </Typography>
              {renderStatusBadge(status)}
              {post.provider && (
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase font-mono border-primary/20 text-primary"
                >
                  {post.provider}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {post.channel_name && (
                <div className="flex items-center gap-1.5 bg-muted/40 px-2 py-0.5 rounded-full border border-border/50">
                  <Avatar className="size-3.5 rounded-full">
                    {post.channel_avatar_url && <AvatarImage src={post.channel_avatar_url} />}
                    <AvatarFallback className="text-[8px]">
                      {(post.platform || 'C').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground text-[11px]">
                    {post.channel_handle || post.channel_name}
                  </span>
                </div>
              )}
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Clock className="size-3 text-muted-foreground" />
                {formatDateTime(scheduledTime)}
                {relTime && <span className="text-muted-foreground font-normal">({relTime})</span>}
              </span>
            </div>

            {post.content && (
              <div className="pt-0.5">
                <Typography
                  variant="muted"
                  className={showFullCaption ? '' : 'line-clamp-2'}
                >
                  {post.content}
                </Typography>
                {post.content.length > 90 && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowFullCaption(!showFullCaption)}
                    className="p-0 h-auto text-[11px] text-primary"
                  >
                    {showFullCaption ? 'Ver menos' : 'Ver mais'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-col items-end gap-2 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40">
          {isPublished &&
            renderMetricsBar(
              metrics,
              onRefreshMetricsClick ? () => onRefreshMetricsClick(post) : undefined,
              isRefreshingMetrics,
            )}
          <div className="flex flex-wrap items-center gap-2">
            {isScheduled && onPublishNowClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPublishNowClick(post)}
                disabled={isPublishingNow}
                className="text-xs h-8 gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                <Zap className="size-3.5 text-amber-400" /> Publicar Agora
              </Button>
            )}
            {(isScheduled || inQueue) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancelClick(post)}
                className="text-destructive hover:bg-destructive/10 gap-1.5 text-xs h-8"
              >
                <Trash2 className="size-3.5" /> Cancelar
              </Button>
            )}
            {providerUrl && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="text-xs h-8 gap-1"
              >
                <a
                  href={providerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="size-3.5" />
                  Provider
                </a>
              </Button>
            )}
            {externalUrl && isPublished && (
              <Button
                asChild
                variant="default"
                size="sm"
                className="text-xs h-8 gap-1"
              >
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="size-3.5" />
                  Ver Post
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {renderMediaPreviewDialog(previewOpen, setPreviewOpen, post, videoSrc)}
    </Card>
  )
}
