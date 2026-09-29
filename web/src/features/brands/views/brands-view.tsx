import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Bookmark, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { useBrands } from '../hooks/use-brands'
import { useBatches } from '@/features/viral-studio/hooks/use-batches'
import { BrandCard } from '../components/brand-card'
import { BrandFormDialog } from '../components/brand-form-dialog'
import { BrandsFilterBar } from '../components/brands-filter-bar'
import type { PublishingProfileRecord } from '../data/brand.types'

export function BrandsView() {
  const { data, isLoading, error } = useBrands()
  const { data: batchesData } = useBatches()

  const brands = useMemo(() => data?.brands || [], [data?.brands])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [providerFilter, setProviderFilter] = useState('all')

  const videoCountByBrand = useMemo(() => {
    const counts: Record<string, number> = {}
    const batches = batchesData?.batches || []
    for (const batch of batches) {
      for (const item of batch.items || []) {
        if (item.brand_id) {
          counts[item.brand_id] = (counts[item.brand_id] || 0) + 1
        }
      }
    }
    return counts
  }, [batchesData])

  const filteredBrands = useMemo(() => {
    return brands.filter((brand) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        brand.name.toLowerCase().includes(q) ||
        brand.handle.toLowerCase().includes(q) ||
        (brand.niche && brand.niche.toLowerCase().includes(q)) ||
        (brand.discovery_keywords &&
          brand.discovery_keywords.some((k) => k.toLowerCase().includes(q)))

      const profiles = (brand.publishing_profiles || {}) as PublishingProfileRecord
      const activeProvider = Object.keys(profiles)[0] || 'postiz'
      const matchesProvider =
        providerFilter === 'all' || activeProvider.toLowerCase() === providerFilter.toLowerCase()

      return matchesSearch && matchesProvider
    })
  }, [brands, searchQuery, providerFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="size-8"
          >
            <Link to="/viral-studio">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Bookmark className="size-6 text-primary" />
              <Typography
                variant="h2"
                as="h1"
              >
                Perfis de Marca
              </Typography>
            </div>
            <Typography variant="muted">
              Gerencie marcas comerciais, canais conectados e esteiras de publicação.
            </Typography>
          </div>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="gap-2 shadow-sm"
        >
          <Plus className="size-4" />
          Nova Marca
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <BrandsFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        providerFilter={providerFilter}
        onProviderChange={setProviderFilter}
        totalFiltered={filteredBrands.length}
      />

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Card
              key={n}
              className="p-6 space-y-3"
            >
              <div className="flex gap-3">
                <Skeleton className="size-11 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-8 w-full" />
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-6 text-center text-destructive border-destructive/30 bg-destructive/5">
          <Typography
            variant="small"
            className="text-destructive"
          >
            Falha ao carregar perfis de marca
          </Typography>
          <Typography
            variant="muted"
            className="mt-1"
          >
            {error.message}
          </Typography>
        </Card>
      )}

      {/* Brands Grid */}
      {!isLoading && filteredBrands.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBrands.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              videoCount={videoCountByBrand[brand.id] || 0}
            />
          ))}
        </div>
      )}

      {/* Empty Filter State */}
      {!isLoading && !error && brands.length > 0 && filteredBrands.length === 0 && (
        <Card className="border-dashed border-border/80 bg-card/30 p-8 text-center">
          <Typography variant="h4">Nenhuma marca encontrada</Typography>
          <Typography
            variant="muted"
            className="mt-1 text-xs"
          >
            Tente ajustar os filtros de busca ou motor de publicação.
          </Typography>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('')
              setProviderFilter('all')
            }}
            className="mt-4 text-xs"
          >
            Limpar Filtros
          </Button>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && brands.length === 0 && (
        <Card className="border-dashed border-border/80 bg-card/30 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Bookmark className="h-7 w-7" />
          </div>
          <Typography variant="h3">Nenhuma marca cadastrada</Typography>
          <Typography
            variant="muted"
            className="mt-1 max-w-md mx-auto"
          >
            Cadastre o perfil da sua primeira marca para personalizar legendas, templates e CTAs de
            afiliado.
          </Typography>
          <div className="mt-6">
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Cadastrar Marca
            </Button>
          </div>
        </Card>
      )}

      {/* Create Dialog */}
      <BrandFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  )
}
