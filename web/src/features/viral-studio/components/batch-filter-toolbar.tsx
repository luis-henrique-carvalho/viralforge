import { CheckCircle2, Layers, Loader2, Search, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export interface BatchFilterToolbarProps {
  activeTab: 'all' | 'ready' | 'processing' | 'failed'
  setActiveTab: (val: 'all' | 'ready' | 'processing' | 'failed') => void
  totalCount: number
  readyCount: number
  processingCount: number
  failedCount: number
  searchQuery: string
  setSearchQuery: (val: string) => void
}

export function BatchFilterToolbar({
  activeTab,
  setActiveTab,
  totalCount,
  readyCount,
  processingCount,
  failedCount,
  searchQuery,
  setSearchQuery,
}: BatchFilterToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
        className="w-full sm:w-auto"
      >
        <TabsList className="grid grid-cols-2 sm:flex sm:flex-row w-full sm:w-auto h-auto p-1 gap-1">
          <TabsTrigger
            value="all"
            className="gap-1.5 text-xs py-1.5"
          >
            <Layers className="size-3.5 shrink-0" />
            <span>Todos ({totalCount})</span>
          </TabsTrigger>
          <TabsTrigger
            value="ready"
            className="gap-1.5 text-xs py-1.5"
          >
            <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
            <span>Prontos ({readyCount})</span>
          </TabsTrigger>
          <TabsTrigger
            value="processing"
            className="gap-1.5 text-xs py-1.5"
          >
            <Loader2
              className={`size-3.5 text-indigo-500 shrink-0 ${processingCount > 0 ? 'animate-spin' : ''}`}
            />
            <span>Processando ({processingCount})</span>
          </TabsTrigger>
          <TabsTrigger
            value="failed"
            className="gap-1.5 text-xs py-1.5"
          >
            <XCircle className="size-3.5 text-destructive shrink-0" />
            <span>Falhas ({failedCount})</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative w-full sm:w-64 md:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por código, copy ou link..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 text-xs h-9 bg-card/60"
        />
      </div>
    </div>
  )
}
