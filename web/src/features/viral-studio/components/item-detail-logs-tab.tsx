import { TabsContent } from '@/components/ui/tabs'
import { ObservabilityTimelineView } from './observability-timeline-view'
import type { ViralItem } from '../data/batch.types'

export interface ItemDetailLogsTabProps {
  item: ViralItem
  logs?: Array<Record<string, any>>
}

export function ItemDetailLogsTab({ item }: ItemDetailLogsTabProps) {
  return (
    <TabsContent
      value="logs"
      className="m-0 space-y-2 focus:outline-none"
    >
      <ObservabilityTimelineView item={item} />
    </TabsContent>
  )
}
