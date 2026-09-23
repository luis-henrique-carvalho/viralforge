import { Link } from '@tanstack/react-router'
import { Bookmark, LayoutTemplate, Layers, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { computeBatchKpis, useBatches } from '../hooks/use-batches'
import { BatchKpisGrid } from '../components/batch-kpis-grid'
import { BatchCard } from '../components/batch-card'

export function ViralStudioView() {
  const { data, isLoading, error } = useBatches()

  const batches = data?.batches || []
  const kpis = computeBatchKpis(batches)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Typography variant="h2">Viral Content Studio</Typography>
            <Badge
              variant="secondary"
              className="gap-1 text-xs"
            >
              <Sparkles className="h-3 w-3 text-primary" />
              Core Engine
            </Badge>
          </div>
          <Typography variant="muted">
            Ingestão em lote de URLs, transcrição local, IA multissinal e renderização vertical
            9:16.
          </Typography>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="gap-2"
          >
            <Link to="/viral-studio/templates">
              <LayoutTemplate className="h-4 w-4" />
              Templates
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="gap-2"
          >
            <Link to="/viral-studio/brands">
              <Bookmark className="h-4 w-4" />
              Gerenciar Marcas
            </Link>
          </Button>

          <Button
            asChild
            className="gap-2 shadow-sm"
          >
            <Link to="/viral-studio/new">
              <Plus className="h-4 w-4" />
              Novo Lote
            </Link>
          </Button>
        </div>
      </div>

      {/* Global KPIs */}
      <BatchKpisGrid kpis={kpis} />

      {/* Main Content Area */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Typography variant="h3">Lotes Recentes</Typography>
          <Typography variant="small">
            {batches.length} {batches.length === 1 ? 'lote registrado' : 'lotes registrados'}
          </Typography>
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 w-full min-w-0">
            {[1, 2, 3].map((n) => (
              <Card
                key={n}
                className="p-6 space-y-4"
              >
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-8 w-full" />
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-6 text-center text-destructive border-destructive/30 bg-destructive/5">
            <Typography variant="small">Falha ao carregar lotes do servidor</Typography>
            <Typography variant="muted">{error.message}</Typography>
          </Card>
        )}

        {/* Batches Grid */}
        {!isLoading && batches.length > 0 && (
          <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3 w-full min-w-0">
            {batches.map((batch) => (
              <BatchCard
                key={batch.batch_id || batch.id}
                batch={batch}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && batches.length === 0 && (
          <Card className="border-dashed border-border/80 bg-card/30 p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Layers className="h-7 w-7" />
            </div>
            <Typography variant="h3">Nenhum lote criado ainda</Typography>
            <Typography variant="muted">
              Inicie a ingestão colando URLs de produtos e vídeos para gerar copies persuasivas e
              renderizar versões verticais 9:16 prontas para publicação.
            </Typography>
            <div className="mt-6">
              <Button
                asChild
                className="gap-2"
              >
                <Link to="/viral-studio/new">
                  <Plus className="h-4 w-4" />
                  Criar Primeiro Lote
                </Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
