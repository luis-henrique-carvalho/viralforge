import { Card } from '@/components/ui/card'
import { StatCell } from './stat-cell'

export interface PublishingQueueKpisProps {
  totalCount: number
  activeCount: number
  failedCount: number
}

export function PublishingQueueKpis({
  totalCount,
  activeCount,
  failedCount,
}: PublishingQueueKpisProps) {
  const successCount = Math.max(0, totalCount - activeCount - failedCount)

  return (
    <Card className="overflow-hidden border-border bg-card/60 backdrop-blur-xs w-full min-w-0">
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border/60">
        <StatCell
          label="Total de Envios"
          value={totalCount}
          sub={totalCount === 1 ? '1 disparo registrado' : `${totalCount} disparos no total`}
          tone="neutral"
        />
        <StatCell
          label="Em Andamento"
          value={activeCount}
          sub="Upload e processamento"
          tone={activeCount > 0 ? 'warning' : 'muted'}
          spinner
          spinning={activeCount > 0}
        />
        <StatCell
          label="Falhas de Envio"
          value={failedCount}
          sub={failedCount === 0 ? 'Sem falhas registradas' : `${failedCount} requerem atenção`}
          tone={failedCount > 0 ? 'danger' : 'muted'}
        />
        <StatCell
          label="Sucessos / Agendados"
          value={successCount}
          sub="Prontos ou entregues"
          tone={totalCount > 0 && failedCount === 0 ? 'success' : 'neutral'}
        />
      </div>
    </Card>
  )
}
