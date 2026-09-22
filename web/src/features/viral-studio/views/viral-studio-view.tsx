import { Link } from '@tanstack/react-router'
import { Bookmark, Layers, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Viral Content Studio
            </h1>
            <Badge
              variant="secondary"
              className="gap-1 text-xs"
            >
              <Sparkles className="h-3 w-3 text-primary" />
              Core Engine
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ingestão em lote de URLs, transcrição local, IA multissinal e renderização vertical
            9:16.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Lotes Recentes</h2>
          <span className="text-xs text-muted-foreground font-mono">
            {batches.length} {batches.length === 1 ? 'lote registrado' : 'lotes registrados'}
          </span>
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
            <p className="font-semibold text-sm">Falha ao carregar lotes do servidor</p>
            <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
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
            <h2 className="mt-4 text-lg font-semibold text-foreground">Nenhum lote criado ainda</h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
              Inicie a ingestão colando URLs de produtos e vídeos para gerar copies persuasivas e
              renderizar versões verticais 9:16 prontas para publicação.
            </p>
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
