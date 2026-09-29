import {
  Calendar,
  Clock,
  ExternalLink,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Trash2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Typography } from '@/components/ui/typography'
import type { ScheduledPost } from '../data/brand.types'

interface BrandSchedulePostItemProps {
  post: ScheduledPost
  onCancelClick: (post: ScheduledPost) => void
}

export function BrandSchedulePostItem({ post, onCancelClick }: BrandSchedulePostItemProps) {
  const isScheduled = post.status.toLowerCase() === 'scheduled'
  const isPublished = post.status.toLowerCase() === 'published'
  const metrics = (post.metrics || {}) as Record<string, unknown>
  const postId = post.post_id || post.id || ''
  const scheduledTime = post.scheduled_time || post.scheduled_for || post.published_at
  const externalUrl = post.external_url || post.post_url

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return 'Horário a definir'
    try {
      const d = new Date(isoString)
      return d.toLocaleString('pt-BR', {
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

  return (
    <Card className="border-border bg-card/60 backdrop-blur-xs transition-all hover:border-primary/30 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Post Info */}
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <Avatar className="size-12 rounded-lg border border-border">
            <AvatarFallback className="rounded-lg bg-muted/40">
              <Calendar className="size-6 text-muted-foreground opacity-60" />
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Typography
                variant="small"
                className="font-semibold text-sm truncate"
              >
                {post.title || (postId ? `Post #${postId.slice(0, 8)}` : 'Publicação')}
              </Typography>
              <Badge
                variant={isPublished ? 'default' : isScheduled ? 'secondary' : 'outline'}
                className={`text-[10px] uppercase font-mono ${
                  isPublished
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : isScheduled
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : ''
                }`}
              >
                {isPublished ? 'Publicado' : isScheduled ? 'Agendado' : post.status}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Clock className="size-3 text-muted-foreground" />
                {formatDateTime(scheduledTime)}
              </span>

              {post.channels && post.channels.length > 0 && (
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Share2 className="size-3" />
                  {post.channels.join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Metrics or Actions */}
        <div className="flex items-center gap-3 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40">
          {isPublished && (
            <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg">
              <span
                className="flex items-center gap-1"
                title="Visualizações"
              >
                <Eye className="size-3.5 text-blue-400" />
                {typeof metrics.views === 'number' ? metrics.views : 0}
              </span>
              <span
                className="flex items-center gap-1"
                title="Curtidas"
              >
                <Heart className="size-3.5 text-rose-400" />
                {typeof metrics.likes === 'number' ? metrics.likes : 0}
              </span>
              <span
                className="flex items-center gap-1"
                title="Comentários"
              >
                <MessageCircle className="size-3.5 text-emerald-400" />
                {typeof metrics.comments === 'number' ? metrics.comments : 0}
              </span>
            </div>
          )}

          {isScheduled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCancelClick(post)}
              className="text-destructive hover:bg-destructive/10 gap-1.5 text-xs h-8"
            >
              <Trash2 className="size-3.5" />
              Cancelar Agendamento
            </Button>
          )}

          {externalUrl && (
            <Button
              asChild
              variant="outline"
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
    </Card>
  )
}
