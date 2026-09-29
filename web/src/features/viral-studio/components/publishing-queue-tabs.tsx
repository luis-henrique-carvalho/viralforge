import { AlertCircle, CheckCircle2, Clock, Layers, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export interface PublishingQueueTabsProps {
  selectedStatus: string
  onStatusChange: (status: string) => void
  totalCount: number
  activeCount: number
  failedCount: number
}

export function PublishingQueueTabs({
  selectedStatus,
  onStatusChange,
  totalCount,
  activeCount,
  failedCount,
}: PublishingQueueTabsProps) {
  return (
    <div className="w-full min-w-0 overflow-x-auto pb-1 -mx-1 px-1 sm:mx-0 sm:px-0">
      <Tabs
        value={selectedStatus}
        onValueChange={onStatusChange}
        className="w-full sm:w-auto"
      >
        <TabsList className="inline-flex h-9 w-max min-w-full sm:min-w-0 items-center justify-start p-1 gap-1 bg-muted/70">
          <TabsTrigger
            value="ALL"
            className="gap-1.5 text-xs py-1.5 px-3 shrink-0"
          >
            <Layers className="size-3.5 shrink-0" />
            <span>Todos os Envios</span>
            <Badge
              variant="secondary"
              className="ml-1 px-1.5 py-0 text-[10px] h-4 leading-none"
            >
              {totalCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="UPLOADING"
            className="gap-1.5 text-xs py-1.5 px-3 shrink-0"
          >
            <Loader2
              className={`size-3.5 text-amber-500 shrink-0 ${activeCount > 0 ? 'animate-spin' : ''}`}
            />
            <span>Em Andamento</span>
            {activeCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 px-1.5 py-0 text-[10px] h-4 leading-none"
              >
                {activeCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="SCHEDULED"
            className="gap-1.5 text-xs py-1.5 px-3 shrink-0"
          >
            <Clock className="size-3.5 text-sky-500 shrink-0" />
            <span>Agendados</span>
          </TabsTrigger>
          <TabsTrigger
            value="PUBLISHED"
            className="gap-1.5 text-xs py-1.5 px-3 shrink-0"
          >
            <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
            <span>Publicados</span>
          </TabsTrigger>
          <TabsTrigger
            value="FAILED"
            className="gap-1.5 text-xs py-1.5 px-3 shrink-0"
          >
            <AlertCircle className="size-3.5 text-destructive shrink-0" />
            <span>Com Falha</span>
            {failedCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 px-1.5 py-0 text-[10px] h-4 leading-none"
              >
                {failedCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
