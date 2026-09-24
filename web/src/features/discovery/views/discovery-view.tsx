import { useState, useMemo } from 'react'
import { CheckSquare, Compass, Flame, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { DiscoverySearchBar } from '../components/discovery-search-bar'
import { DiscoveryFilterBar } from '../components/discovery-filter-bar'
import { DiscoveryVideoCard } from '../components/discovery-video-card'
import { DiscoveryImportDrawer } from '../components/discovery-import-drawer'
import { DiscoverySkeletonGrid } from '../components/discovery-skeleton-grid'
import { DiscoveryFloatingBar } from '../components/discovery-floating-bar'
import { useDiscoverySearch } from '../hooks/use-discovery'
import type {
  DiscoveryItem,
  DiscoveryResult,
  PlatformType,
  SortOrder,
} from '../data/discovery.types'

export function DiscoveryView() {
  const [query, setQuery] = useState('')
  const [platform, setPlatform] = useState<PlatformType>('tiktok')
  const [sortBy, setSortBy] = useState<SortOrder>('virality_score')
  const [durationFilter, setDurationFilter] = useState('all')
  const [minViews, setMinViews] = useState<number | null>(null)
  const [limit, setLimit] = useState(20)

  const [selectedItems, setSelectedItems] = useState<DiscoveryItem[]>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<DiscoveryResult | null>(null)

  const searchMutation = useDiscoverySearch()

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
      const res = await searchMutation.mutateAsync({
        query: searchQuery,
        platform: searchPlatform,
        limit,
        min_views: minViews,
        min_duration_seconds: minDur,
        max_duration_seconds: maxDur,
        sort_by: sortBy,
      })
      setSearchResults(res)
    } catch {
      // Handled by toast
    }
  }

  const items = useMemo(() => searchResults?.items || [], [searchResults?.items])

  const filteredAndSortedItems = useMemo(() => {
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
  }, [items, durationFilter, minViews, sortBy])

  const handleToggleSelect = (item: DiscoveryItem) => {
    setSelectedItems((prev) => {
      const exists = prev.some((i) => i.id === item.id)
      if (exists) return prev.filter((i) => i.id !== item.id)
      return [...prev, item]
    })
  }

  const handleSelectAll = () => {
    if (selectedItems.length === filteredAndSortedItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems([...filteredAndSortedItems])
    }
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
            Minerador de vídeos virais e tendências com cálculo em tempo real de Viral Score e
            engajamento.
          </Typography>
        </div>
      </div>

      <DiscoverySearchBar
        onSearch={handleSearch}
        isLoading={searchMutation.isPending}
        initialQuery={query}
        initialPlatform={platform}
      />

      {searchResults && (
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

      {searchMutation.isPending && <DiscoverySkeletonGrid />}

      {!searchMutation.isPending && searchResults && (
        <>
          <div className="flex items-center justify-between">
            <Typography
              variant="small"
              className="font-semibold text-muted-foreground flex items-center gap-1.5"
            >
              <Flame className="size-4 text-primary" />
              {filteredAndSortedItems.length} vídeo{filteredAndSortedItems.length !== 1 ? 's' : ''}{' '}
              minerado{filteredAndSortedItems.length !== 1 ? 's' : ''} para &ldquo;
              {searchResults.query}&rdquo;
            </Typography>

            {filteredAndSortedItems.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1.5"
                onClick={handleSelectAll}
              >
                <CheckSquare className="size-3.5" />
                {selectedItems.length === filteredAndSortedItems.length
                  ? 'Desmarcar Todos'
                  : 'Selecionar Todos'}
              </Button>
            )}
          </div>

          {filteredAndSortedItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-start">
              {filteredAndSortedItems.map((item) => (
                <DiscoveryVideoCard
                  key={item.id}
                  item={item}
                  isSelected={selectedItems.some((i) => i.id === item.id)}
                  onToggleSelect={handleToggleSelect}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center border-dashed border-border/80 bg-card/30">
              <Typography variant="h3">Nenhum vídeo encontrado</Typography>
              <Typography variant="muted">
                Tente ajustar os filtros ou buscar por outros termos ou hashtags.
              </Typography>
            </Card>
          )}
        </>
      )}

      {!searchMutation.isPending && !searchResults && (
        <Card className="border-dashed border-border/80 bg-card/30 p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
            <Sparkles className="size-7" />
          </div>
          <div className="space-y-1">
            <Typography variant="h3">Mineração Inteligente de Conteúdo</Typography>
            <Typography
              variant="muted"
              className="max-w-md mx-auto"
            >
              Pesquise qualquer palavra-chave para extrair os vídeos mais virais do TikTok,
              Instagram Reels e YouTube Shorts.
            </Typography>
          </div>
        </Card>
      )}

      <DiscoveryFloatingBar
        selectedCount={selectedItems.length}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onClearSelection={() => setSelectedItems([])}
      />

      <DiscoveryImportDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        selectedItems={selectedItems}
      />
    </div>
  )
}
