import { useState } from 'react'
import { Calendar, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import {
  useBrandScheduled,
  useBrandWorkspace,
  useCancelBrandScheduledPost,
  usePublishBrandScheduledNow,
} from '../hooks/use-brand-workspace'
import { ScheduledTimelineCard } from './scheduled-timeline-card'
import { BrandCancelScheduleDialog } from './brand-cancel-schedule-dialog'
import type { Brand, ScheduledPost } from '../data/batch.types'

interface BrandWorkspaceTabScheduleProps {
  brand: Brand
}

export function BrandWorkspaceTabSchedule({ brand }: BrandWorkspaceTabScheduleProps) {
  const { data: workspaceData } = useBrandWorkspace(brand.id)
  const cancelMutation = useCancelBrandScheduledPost(brand.id)
  const publishNowMutation = usePublishBrandScheduledNow(brand.id)

  const [postToCancel, setPostToCancel] = useState<ScheduledPost | null>(null)

  const { data: scheduleData, isLoading } = useBrandScheduled(brand.id, undefined, undefined, {
    refetchInterval: (query: unknown) => {
      const queryData = (query as { state?: { data?: { posts?: ScheduledPost[] } } })?.state?.data
      const currentPosts = queryData?.posts || []
      const hasActive = currentPosts.some((p) => {
        const s = (p.status || '').toUpperCase()
        return s === 'QUEUED' || s === 'UPLOADING'
      })
      return hasActive ? 3000 : false
    },
  })

  const posts = scheduleData?.posts || []
  const nextSlot = workspaceData?.next_slot

  const handleConfirmCancel = async () => {
    if (!postToCancel) return
    const targetPostId = postToCancel.post_id || postToCancel.id
    if (!targetPostId) {
      setPostToCancel(null)
      return
    }
    await cancelMutation.mutateAsync(targetPostId)
    setPostToCancel(null)
  }

  const handlePublishNow = async (post: ScheduledPost) => {
    const targetPostId = post.post_id || post.id
    if (!targetPostId) return
    await publishNowMutation.mutateAsync(targetPostId)
  }

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
    <div className="space-y-6">
      {/* Schedule Header & Next Slot Indicator */}
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/40 p-4 border-border">
        <div>
          <Typography
            variant="h4"
            className="font-semibold text-foreground"
          >
            Agenda de Postagens & Linha do Tempo
          </Typography>
          <Typography
            variant="muted"
            className="text-xs"
          >
            Acompanhe publicações na fila, agendadas e posts concluídos para a marca {brand.name}.
          </Typography>
        </div>

        {nextSlot && (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg">
            <Clock className="size-4 text-primary" />
            <div className="text-xs">
              <span className="text-muted-foreground block text-[10px]">Próximo Slot Livre:</span>
              <span className="font-semibold text-primary">{formatDateTime(nextSlot)}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Timeline List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Card
              key={n}
              className="p-4 space-y-2"
            >
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </Card>
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post, index) => (
            <ScheduledTimelineCard
              key={post.job_id || post.post_id || post.id || `sched-post-${index}`}
              post={post}
              onCancelClick={setPostToCancel}
              onPublishNowClick={handlePublishNow}
              isPublishingNow={publishNowMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-border/80 bg-card/30 p-10 text-center space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Calendar className="size-6" />
          </div>
          <Typography variant="h4">Nenhuma publicação na linha do tempo</Typography>
          <Typography
            variant="muted"
            className="max-w-md mx-auto text-xs"
          >
            Nenhum vídeo agendado ou publicado no momento. Aprove vídeos na Aba de Vídeos e clique
            em Auto-Agendar para montar a grade editorial.
          </Typography>
        </Card>
      )}

      {/* Confirmation Dialog for Cancellation */}
      <BrandCancelScheduleDialog
        post={postToCancel}
        onClose={() => setPostToCancel(null)}
        onConfirm={handleConfirmCancel}
        isPending={cancelMutation.isPending}
      />
    </div>
  )
}
