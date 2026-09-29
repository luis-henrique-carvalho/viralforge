import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Calendar, Layers, Settings, Share2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBrandWorkspace } from '../hooks/use-brand-workspace'
import { BrandWorkspaceHeader } from '../components/brand-workspace-header'
import { BrandWorkspaceTabChannels } from '../components/brand-workspace-tab-channels'
import { BrandWorkspaceTabVideos } from '../components/brand-workspace-tab-videos'
import { BrandWorkspaceTabSchedule } from '../components/brand-workspace-tab-schedule'
import { BrandWorkspaceTabSettings } from '../components/brand-workspace-tab-settings'

import { getBrandActiveProvider } from '../components/brand-settings-motor-card'

interface BrandWorkspaceViewProps {
  brandId: string
}

export function BrandWorkspaceView({ brandId }: BrandWorkspaceViewProps) {
  const { data: workspaceData, isLoading, error } = useBrandWorkspace(brandId)
  const [activeTab, setActiveTab] = useState('channels')

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="p-6 border-border bg-card/60 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        </Card>
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Skeleton
              key={n}
              className="h-36 rounded-xl"
            />
          ))}
        </div>
      </div>
    )
  }

  if (error || !workspaceData?.brand) {
    return (
      <div className="space-y-4">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
        >
          <Link to="/brands">
            <ArrowLeft className="size-4" />
            Voltar para Marcas
          </Link>
        </Button>
        <Card className="p-8 text-center border-destructive/30 bg-destructive/5 text-destructive">
          <Typography variant="h3">Marca não encontrada</Typography>
          <Typography
            variant="muted"
            className="mt-1 text-xs"
          >
            {error?.message || `Não foi possível carregar os dados para a marca ${brandId}.`}
          </Typography>
        </Card>
      </div>
    )
  }

  const { brand } = workspaceData
  const activeProvider =
    workspaceData.provider || workspaceData.active_provider || getBrandActiveProvider(brand)
  const totalVideos = workspaceData.counts?.total_videos ?? workspaceData.video_stats?.total ?? 0

  return (
    <div className="space-y-6">
      {/* Brand Header */}
      <BrandWorkspaceHeader
        brand={brand}
        activeProvider={activeProvider}
        onSwitchToTab={setActiveTab}
      />

      {/* 4 Specialized Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto p-1 bg-muted/60">
          <TabsTrigger
            value="channels"
            className="gap-2 py-2 text-xs font-medium data-[state=active]:shadow-sm"
          >
            <Share2 className="size-3.5" />
            1. Canais Sociais
          </TabsTrigger>

          <TabsTrigger
            value="videos"
            className="gap-2 py-2 text-xs font-medium data-[state=active]:shadow-sm"
          >
            <Layers className="size-3.5" />
            2. Vídeos da Marca
            {totalVideos > 0 && (
              <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.2 text-[10px] font-mono text-primary font-bold">
                {totalVideos}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="schedule"
            className="gap-2 py-2 text-xs font-medium data-[state=active]:shadow-sm"
          >
            <Calendar className="size-3.5" />
            3. Agenda & Fila
          </TabsTrigger>

          <TabsTrigger
            value="settings"
            className="gap-2 py-2 text-xs font-medium data-[state=active]:shadow-sm"
          >
            <Settings className="size-3.5" />
            4. Configurações da Marca
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="channels"
          className="space-y-4"
        >
          <BrandWorkspaceTabChannels brand={brand} />
        </TabsContent>

        <TabsContent
          value="videos"
          className="space-y-4"
        >
          <BrandWorkspaceTabVideos
            brand={brand}
            onNavigateToTab={setActiveTab}
          />
        </TabsContent>

        <TabsContent
          value="schedule"
          className="space-y-4"
        >
          <BrandWorkspaceTabSchedule brand={brand} />
        </TabsContent>

        <TabsContent
          value="settings"
          className="space-y-4"
        >
          <BrandWorkspaceTabSettings brand={brand} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
