import { CheckCircle2, Layers, Loader2, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import type { BatchKpis } from '../data/batch.types'

interface BatchKpisGridProps {
  kpis: BatchKpis
}

export function BatchKpisGrid({ kpis }: BatchKpisGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-border bg-card/60 backdrop-blur-xs transition-colors hover:border-primary/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardDescription className="text-xs font-medium">Lotes Ativos</CardDescription>
          <Layers className="size-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{kpis.activeBatches}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {kpis.totalBatches} {kpis.totalBatches === 1 ? 'lote total' : 'lotes no total'}
          </p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card/60 backdrop-blur-xs transition-colors hover:border-emerald-500/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardDescription className="text-xs font-medium">Vídeos Prontos</CardDescription>
          <CheckCircle2 className="size-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {kpis.readyVideos}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Revisados e prontos para publicar</p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card/60 backdrop-blur-xs transition-colors hover:border-indigo-500/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardDescription className="text-xs font-medium">Em Processamento</CardDescription>
          <Loader2
            className={`size-4 text-indigo-500 ${kpis.processingVideos > 0 ? 'animate-spin' : ''}`}
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-indigo-500">
            {kpis.processingVideos}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Download, IA e Render 9:16</p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card/60 backdrop-blur-xs transition-colors hover:border-blue-500/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardDescription className="text-xs font-medium">Taxa de Sucesso</CardDescription>
          <TrendingUp className="size-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-blue-500">{kpis.successRate}%</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {kpis.failedVideos}{' '}
            {kpis.failedVideos === 1 ? 'falha registrada' : 'falhas registradas'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
