import { useState } from 'react'
import { Layers, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  useAutoScheduleBrandVideo,
  useBrandChannels,
  useBrandVideos,
  usePublishBrandVideo,
} from '../hooks/use-brand-workspace'
import { viralStudioApi } from '../services/viral-studio.api'
import { viralStudioKeys } from '../services/viral-studio.keys'
import { BrandVideoCard } from './brand-video-card'
import { BrandQuickPublishDialog } from './brand-quick-publish-dialog'
import type { Brand, ViralItem } from '../data/batch.types'

interface BrandWorkspaceTabVideosProps {
  brand: Brand
  onNavigateToTab?: (tab: string) => void
}

const STATUS_FILTERS = [
  { label: 'Todos', value: 'all' },
  { label: 'Prontos p/ Revisão', value: 'READY_FOR_REVIEW' },
  { label: 'Aprovados', value: 'APPROVED' },
  { label: 'Agendados', value: 'SCHEDULED' },
  { label: 'Publicados', value: 'PUBLISHED' },
]

export function BrandWorkspaceTabVideos({ brand, onNavigateToTab }: BrandWorkspaceTabVideosProps) {
  const queryClient = useQueryClient()
  const [activeStatusFilter, setActiveStatusFilter] = useState('all')
  const { data: videos = [], isLoading } = useBrandVideos(brand.id, activeStatusFilter)
  const { data: channels = [] } = useBrandChannels(brand.id)

  const autoScheduleMutation = useAutoScheduleBrandVideo(brand.id)
  const publishMutation = usePublishBrandVideo(brand.id)
  const [selectedVideoForPublish, setSelectedVideoForPublish] = useState<ViralItem | null>(null)

  const handleApproveVideo = async (video: ViralItem) => {
    try {
      await viralStudioApi.approveItem(video.id)
      toast.success('Vídeo aprovado para publicação!')
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.brand(brand.id) })
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.batches() })
    } catch (err: any) {
      toast.error(`Falha ao aprovar vídeo: ${err.message}`)
    }
  }

  const handleAutoSchedule = (video: ViralItem) => {
    autoScheduleMutation.mutate({ itemId: video.id })
  }

  const handleAutoScheduleFirstApproved = () => {
    const firstApproved = videos.find((v) => v.status === 'APPROVED')
    if (!firstApproved) {
      toast.info('Nenhum vídeo aprovado aguardando agendamento.')
      return
    }
    autoScheduleMutation.mutate({ itemId: firstApproved.id })
  }

  const handleConfirmPublish = async ({
    video,
    channelIds,
    publishMode,
    customDateTime,
  }: {
    video: ViralItem
    channelIds: string[]
    publishMode: 'slot' | 'now' | 'custom'
    customDateTime?: string
  }) => {
    if (publishMode === 'slot') {
      await autoScheduleMutation.mutateAsync({
        itemId: video.id,
        channelIds,
      })
    } else if (publishMode === 'now') {
      await publishMutation.mutateAsync({
        item_id: video.id,
        channel_ids: channelIds,
        publish_now: true,
      })
    } else if (publishMode === 'custom' && customDateTime) {
      await publishMutation.mutateAsync({
        item_id: video.id,
        channel_ids: channelIds,
        scheduled_for: new Date(customDateTime).toISOString(),
        publish_now: false,
      })
    }
    setSelectedVideoForPublish(null)
  }

  const approvedCount = videos.filter((v) => v.status === 'APPROVED').length

  return (
    <div className="space-y-6">
      {/* Top Controls & Filter Bar */}
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/40 p-3 border-border">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={activeStatusFilter === f.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveStatusFilter(f.value)}
              className="text-xs h-8 px-3"
            >
              {f.label}
            </Button>
          ))}
        </div>

        {approvedCount > 0 && (
          <Button
            size="sm"
            onClick={handleAutoScheduleFirstApproved}
            disabled={autoScheduleMutation.isPending}
            className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Zap className="size-3.5 fill-current" /> Auto-Agendar Próximo Slot ({approvedCount})
          </Button>
        )}
      </Card>

      {/* Videos Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <Card
              key={n}
              className="p-4 space-y-3"
            >
              <Skeleton className="aspect-[9/16] rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </Card>
          ))}
        </div>
      ) : videos.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video) => (
            <BrandVideoCard
              key={video.id}
              video={video}
              onApprove={handleApproveVideo}
              onAutoSchedule={handleAutoSchedule}
              onOpenPublishModal={setSelectedVideoForPublish}
              onNavigateToTab={onNavigateToTab}
              isAutoSchedulePending={autoScheduleMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-border/80 bg-card/30 p-10 text-center space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Layers className="size-6" />
          </div>
          <Typography variant="h4">Nenhum vídeo encontrado</Typography>
          <Typography
            variant="muted"
            className="max-w-md mx-auto text-xs"
          >
            Esta marca ainda não possui vídeos no estado selecionado. Crie um novo lote de vídeos
            usando o Discovery ou inserindo URLs manuais.
          </Typography>
        </Card>
      )}

      {/* Quick Publish Modal */}
      <BrandQuickPublishDialog
        video={selectedVideoForPublish}
        channels={channels}
        onClose={() => setSelectedVideoForPublish(null)}
        onConfirmPublish={handleConfirmPublish}
        isPending={autoScheduleMutation.isPending || publishMutation.isPending}
      />
    </div>
  )
}
