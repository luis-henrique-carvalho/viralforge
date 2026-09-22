import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Bookmark, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { useBrands } from '../hooks/use-brands'
import { BrandCard } from '../components/brand-card'
import { BrandFormDialog } from '../components/brand-form-dialog'
import type { Brand } from '../data/batch.types'

export function BrandsView() {
  const { data, isLoading, error } = useBrands()
  const brands = data?.brands || []

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [brandToEdit, setBrandToEdit] = useState<Brand | null>(null)

  const handleOpenCreate = () => {
    setBrandToEdit(null)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (brand: Brand) => {
    setBrandToEdit(brand)
    setIsDialogOpen(true)
  }

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
              Configure handles sociais, links de afiliados e CTAs padrão para composição nos
              vídeos.
            </Typography>
          </div>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="gap-2 shadow-sm"
        >
          <Plus className="size-4" />
          Nova Marca
        </Button>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Card
              key={n}
              className="p-6 space-y-3"
            >
              <div className="flex gap-3">
                <Skeleton className="size-10 rounded-full" />
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
      {!isLoading && brands.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              onEdit={handleOpenEdit}
            />
          ))}
        </div>
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
              onClick={handleOpenCreate}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Cadastrar Marca
            </Button>
          </div>
        </Card>
      )}

      {/* Create / Edit Dialog */}
      <BrandFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        brandToEdit={brandToEdit}
      />
    </div>
  )
}
