import { useState } from 'react'
import { Search, Loader2, PlaySquare, Camera, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import type { PlatformType } from '../data/discovery.types'

export interface DiscoverySearchBarProps {
  onSearch: (query: string, platform: PlatformType) => void
  isLoading?: boolean
  initialQuery?: string
  initialPlatform?: PlatformType
}

export function DiscoverySearchBar({
  onSearch,
  isLoading = false,
  initialQuery = '',
  initialPlatform = 'tiktok',
}: DiscoverySearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [platform, setPlatform] = useState<PlatformType>(initialPlatform)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    onSearch(query.trim(), platform)
  }

  const platforms: { id: PlatformType; label: string; icon: React.ReactNode }[] = [
    { id: 'tiktok', label: 'TikTok', icon: <Video className="size-4" /> },
    { id: 'instagram', label: 'Instagram Reels', icon: <Camera className="size-4" /> },
    { id: 'youtube', label: 'YouTube Shorts', icon: <PlaySquare className="size-4" /> },
  ]

  return (
    <Card className="border-border bg-card/60 backdrop-blur-xs">
      <CardContent className="p-4 sm:p-5">
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            {platforms.map((p) => (
              <Button
                key={p.id}
                type="button"
                variant={platform === p.id ? 'default' : 'outline'}
                size="sm"
                className="gap-2 text-xs font-semibold"
                onClick={() => setPlatform(p.id)}
              >
                {p.icon}
                {p.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Busque por palavras-chave, nichos ou hashtags (ex: achadinhos, tecnologia, receitas)..."
                className="pl-9 h-11 text-sm bg-background/80"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="h-11 px-6 font-semibold gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <Search className="size-4" />
                  <span>Buscar Tendências</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
