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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
        className="w-full sm:w-auto"
      >
        <TabsList className="grid grid-cols-4 w-full sm:w-auto">
          <TabsTrigger
            value="all"
            className="gap-1.5 text-xs"
          >
            <Layers className="size-3.5" />
            Todos ({totalCount})
          </TabsTrigger>
          <TabsTrigger
            value="ready"
            className="gap-1.5 text-xs"
          >
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            Prontos ({readyCount})
          </TabsTrigger>
          <TabsTrigger
            value="processing"
            className="gap-1.5 text-xs"
          >
            <Loader2
              className={`size-3.5 text-indigo-500 ${processingCount > 0 ? 'animate-spin' : ''}`}
            />
            Processando ({processingCount})
          </TabsTrigger>
          <TabsTrigger
            value="failed"
            className="gap-1.5 text-xs"
          >
            <XCircle className="size-3.5 text-destructive" />
            Falhas ({failedCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por código, copy ou link..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 text-xs"
        />
      </div>
    </div>
  )
}
