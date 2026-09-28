import { useState, useMemo, useEffect } from 'react'
import { Compass } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { DiscoverySearchBar } from '../components/discovery-search-bar'
import { DiscoveryFilterBar } from '../components/discovery-filter-bar'
import { DiscoveryHistoryPanel } from '../components/discovery-history-panel'
import { DiscoveryResultsSection } from '../components/discovery-results-section'
import { DiscoveryInitialState } from '../components/discovery-initial-state'
import { DiscoveryImportDrawer } from '../components/discovery-import-drawer'
import { DiscoverySkeletonGrid } from '../components/discovery-skeleton-grid'
import { DiscoveryFloatingBar } from '../components/discovery-floating-bar'
import { DiscoveryStatusCard } from '../components/discovery-status-card'
import {
  useCancelDiscoverySearch,
  useCreateDiscoverySearch,
  useDeleteDiscoverySearch,
  useDiscoverySearchDetail,
  useDiscoverySearches,
} from '../hooks/use-discovery'
import type { DiscoveryItem, PlatformType, SortOrder } from '../data/discovery.types'

function filterAndSortItems(
  items: DiscoveryItem[],
  durationFilter: string,
  minViews: number | null,
  sortBy: SortOrder,
): DiscoveryItem[] {
  let list = [...items]

  if (durationFilter === 'short') {
    list = list.filter((i) => i.duration_seconds === null || (i.duration_seconds || 0) <= 30)
  } else if (durationFilter === 'medium') {
    list = list.filter(
      (i) =>
        i.duration_seconds === null ||
        ((i.duration_seconds || 0) >= 30 && (i.duration_seconds || 0) <= 60),
    )
  } else if (durationFilter === 'long') {
    list = list.filter((i) => i.duration_seconds === null || (i.duration_seconds || 0) >= 60)
  }

  if (minViews) {
    list = list.filter((i) => i.view_count >= minViews)
  }

  if (sortBy === 'virality_score') {
    list.sort((a, b) => b.virality_score - a.virality_score)
  } else if (sortBy === 'view_count') {
    list.sort((a, b) => b.view_count - a.view_count)
  } else if (sortBy === 'engagement_rate') {
    list.sort((a, b) => b.engagement_rate - a.engagement_rate)
  } else if (sortBy === 'recent') {
    list.sort((a, b) => (b.published_timestamp || 0) - (a.published_timestamp || 0))
  }

  return list
}

export function DiscoveryView() {
  const [query, setQuery] = useState('')
  const [platform, setPlatform] = useState<PlatformType>('tiktok')
  const [sortBy, setSortBy] = useState<SortOrder>('virality_score')
  const [durationFilter, setDurationFilter] = useState('all')
  const [minViews, setMinViews] = useState<number | null>(null)
  const [limit, setLimit] = useState(20)

  const [selectedItems, setSelectedItems] = useState<DiscoveryItem[]>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [activeSearchId, setActiveSearchId] = useState<string | null>(null)

  const { data: searchHistory = [] } = useDiscoverySearches()
  const { data: activeSearch, isLoading: isLoadingDetail } =
    useDiscoverySearchDetail(activeSearchId)
  const createSearchMutation = useCreateDiscoverySearch()
  const cancelSearchMutation = useCancelDiscoverySearch()
  const deleteSearchMutation = useDeleteDiscoverySearch()

  useEffect(() => {
    if (!activeSearchId && searchHistory.length > 0) {
      const running = searchHistory.find((s) => s.status === 'SEARCHING' || s.status === 'QUEUED')
      if (running) setActiveSearchId(running.id)
    }
  }, [searchHistory, activeSearchId])

  const handleSearch = async (searchQuery: string, searchPlatform: PlatformType) => {
    setQuery(searchQuery)
    setPlatform(searchPlatform)
    setSelectedItems([])

    let minDur: number | null = null
    let maxDur: number | null = null
    if (durationFilter === 'short') maxDur = 30
    else if (durationFilter === 'medium') {
      minDur = 30
      maxDur = 60
    } else if (durationFilter === 'long') minDur = 60

    try {
      const summary = await createSearchMutation.mutateAsync({
        query: searchQuery,
        platform: searchPlatform,
        limit,
        min_views: minViews,
        min_duration_seconds: minDur,
        max_duration_seconds: maxDur,
        sort_by: sortBy,
      })
      setActiveSearchId(summary.id)
    } catch {
      // Handled by mutation toast
    }
  }

  const isMining =
    activeSearch?.status === 'QUEUED' ||
    activeSearch?.status === 'SEARCHING' ||
    createSearchMutation.isPending

  const items = useMemo(() => activeSearch?.items || [], [activeSearch?.items])
  const filteredAndSortedItems = useMemo(
    () => filterAndSortItems(items, durationFilter, minViews, sortBy),
    [items, durationFilter, minViews, sortBy],
  )

  const handleToggleSelect = (item: DiscoveryItem) => {
    setSelectedItems((prev) =>
      prev.some((i) => i.id === item.id) ? prev.filter((i) => i.id !== item.id) : [...prev, item],
    )
  }

  const handleSelectAll = () => {
    setSelectedItems(
      selectedItems.length === filteredAndSortedItems.length ? [] : [...filteredAndSortedItems],
    )
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Compass className="size-6 text-primary" />
            <Typography
              variant="h2"
              as="h1"
            >
              Descoberta Multiplataforma
            </Typography>
            <Badge
              variant="outline"
              className="text-xs font-mono"
            >
              TikTok · Instagram · YouTube
            </Badge>
          </div>
          <Typography variant="muted">
            Minerador assíncrono de vídeos virais e tendências com cálculo em tempo real de Viral
            Score.
          </Typography>
        </div>
      </div>

      <DiscoverySearchBar
        onSearch={handleSearch}
        isLoading={isMining}
        initialQuery={query}
        initialPlatform={platform}
      />

      <DiscoveryHistoryPanel
        searches={searchHistory}
        activeSearchId={activeSearchId}
        onSelectSearch={(id) => {
          setActiveSearchId(id)
          setSelectedItems([])
        }}
        onCancelSearch={(id) => cancelSearchMutation.mutate(id)}
        onDeleteSearch={(id) => {
          if (activeSearchId === id) setActiveSearchId(null)
          deleteSearchMutation.mutate(id)
        }}
        isCancelling={cancelSearchMutation.isPending}
        isDeleting={deleteSearchMutation.isPending}
      />

      <DiscoveryStatusCard
        search={activeSearch}
        fallbackQuery={query}
        isMining={isMining}
        onCancel={activeSearchId ? () => cancelSearchMutation.mutate(activeSearchId) : undefined}
        isCancelling={cancelSearchMutation.isPending}
      />

      {activeSearch?.status === 'COMPLETED' && (
        <DiscoveryFilterBar
          sortBy={sortBy}
          onChangeSortBy={setSortBy}
          durationFilter={durationFilter}
          onChangeDurationFilter={setDurationFilter}
          minViews={minViews}
          onChangeMinViews={setMinViews}
          limit={limit}
          onChangeLimit={setLimit}
        />
      )}

      {isMining && <DiscoverySkeletonGrid />}

      {!isMining && activeSearch?.status === 'COMPLETED' && (
        <DiscoveryResultsSection
          items={filteredAndSortedItems}
          selectedItems={selectedItems}
          query={activeSearch.query}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
        />
      )}

      {!isMining && !activeSearch && !isLoadingDetail && <DiscoveryInitialState />}

      <DiscoveryFloatingBar
        selectedCount={selectedItems.length}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onClearSelection={() => setSelectedItems([])}
      />

      <DiscoveryImportDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        selectedItems={selectedItems}
        searchId={activeSearch?.id}
        searchPlatform={activeSearch?.platform}
        searchQuery={activeSearch?.query}
      />
    </div>
  )
}
