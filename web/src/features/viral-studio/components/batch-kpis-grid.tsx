import { Card } from '@/components/ui/card'
import type { BatchKpis } from '../data/batch.types'
import { StatCell } from './stat-cell'

interface BatchKpisGridProps {
  kpis: BatchKpis
}

export function BatchKpisGrid({ kpis }: BatchKpisGridProps) {
  const totalSub = `${kpis.totalBatches} ${kpis.totalBatches === 1 ? 'lote total' : 'lotes no total'}`
  const failedSub = `${kpis.failedVideos} ${kpis.failedVideos === 1 ? 'falha registrada' : 'falhas registradas'}`

  const successTone =
    kpis.successRate >= 80 ? 'success' : kpis.successRate >= 50 ? 'warning' : 'danger'

  const processingTone = kpis.processingVideos > 0 ? 'warning' : 'muted'

  return (
    <Card className="overflow-hidden border-border bg-card/60 backdrop-blur-xs w-full min-w-0">
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border/60">
        <StatCell
          label="Lotes Ativos"
          value={kpis.activeBatches}
          sub={totalSub}
          tone="neutral"
        />
        <StatCell
          label="Vídeos Prontos"
          value={kpis.readyVideos}
          sub="Revisados e aprovados"
          tone="success"
        />
        <StatCell
          label="Em Processamento"
          value={kpis.processingVideos}
          sub="Download, IA e render"
          tone={processingTone}
          spinner
          spinning={kpis.processingVideos > 0}
        />
        <StatCell
          label="Taxa de Sucesso"
          value={`${kpis.successRate}%`}
          sub={failedSub}
          tone={successTone}
        />
      </div>
    </Card>
  )
}
