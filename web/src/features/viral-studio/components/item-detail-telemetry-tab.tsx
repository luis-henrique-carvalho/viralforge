import { TabsContent } from '@/components/ui/tabs'
import type { ViralItem } from '../data/batch.types'

export interface ItemDetailTelemetryTabProps {
  item: ViralItem
  telemetry: Record<string, any>
}

export function ItemDetailTelemetryTab({ item, telemetry }: ItemDetailTelemetryTabProps) {
  return (
    <TabsContent
      value="telemetry"
      className="m-0 space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <span className="text-[11px] text-muted-foreground block">Modelo IA</span>
          <span className="font-mono text-sm font-semibold text-foreground">
            {item.model || telemetry.model || 'gemini-2.5-flash'}
          </span>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <span className="text-[11px] text-muted-foreground block">Latência IA</span>
          <span className="font-mono text-sm font-semibold text-foreground">
            {telemetry.latency_ms ? `${telemetry.latency_ms}ms` : '—'}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Resumo de Contexto Multissinal
        </label>
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs font-mono whitespace-pre-wrap">
          {JSON.stringify(item.ai_context_summary || telemetry, null, 2)}
        </div>
      </div>
    </TabsContent>
  )
}
