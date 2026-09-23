import { useState } from 'react'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { SettingsSidebarNav } from '../components/settings-sidebar-nav'
import { PublishingProviderCard } from '../components/publishing-provider-card'
import { AiModelsCard } from '../components/ai-models-card'
import { TranscriptionProviderCard } from '../components/transcription-provider-card'
import { CookiesManagerCard } from '../components/cookies-manager-card'
import { HardwareStatusCard } from '../components/hardware-status-card'
import { BrandAssetsCard } from '../components/brand-assets-card'
import { useSettings } from '../hooks/use-settings'
import type { SettingsTab } from '../data/settings.types'

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('publishing')
  const { isLoading } = useSettings()

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <Typography variant="h2">Configurações & Provedores</Typography>
          <Badge
            variant="outline"
            className="text-xs"
          >
            Infraestrutura
          </Badge>
        </div>
        <Typography variant="muted">
          Gerencie as credenciais de IA, provedores de publicação, cookies de extração e recursos de
          aceleração.
        </Typography>
      </div>

      <Separator className="my-6" />

      {/* Main Settings Grid: 2 columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Nav */}
        <aside className="lg:col-span-3">
          <SettingsSidebarNav
            activeTab={activeTab}
            onSelectTab={setActiveTab}
          />
        </aside>

        {/* Content Panel */}
        <main className="lg:col-span-9">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          ) : (
            <div className="transition-all duration-200 ease-in-out">
              {activeTab === 'publishing' && <PublishingProviderCard />}
              {activeTab === 'ai-models' && <AiModelsCard />}
              {activeTab === 'transcription' && <TranscriptionProviderCard />}
              {activeTab === 'cookies' && <CookiesManagerCard />}
              {activeTab === 'hardware' && <HardwareStatusCard />}
              {activeTab === 'branding' && <BrandAssetsCard />}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
