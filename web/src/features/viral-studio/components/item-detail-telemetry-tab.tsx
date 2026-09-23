import { TabsContent } from '@/components/ui/tabs'
import { ObservabilityTelemetryView } from './observability-telemetry-view'
import type { ViralItem } from '../data/batch.types'

export interface ItemDetailTelemetryTabProps {
  item: ViralItem
  telemetry?: Record<string, unknown>
}

export function ItemDetailTelemetryTab({ item }: ItemDetailTelemetryTabProps) {
  return (
    <TabsContent
      value="telemetry"
      className="m-0 space-y-4 focus:outline-none"
    >
      <ObservabilityTelemetryView item={item} />
    </TabsContent>
  )
}
