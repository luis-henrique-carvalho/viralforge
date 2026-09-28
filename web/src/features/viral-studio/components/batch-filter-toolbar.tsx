import { Bookmark, CheckCircle2, Clock, Layers, Loader2, Search, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface BatchFilterToolbarProps {
  activeTab: 'all' | 'ready' | 'processing' | 'failed' | 'scheduled'
  setActiveTab: (val: 'all' | 'ready' | 'processing' | 'failed' | 'scheduled') => void
  totalCount: number
  readyCount: number
  processingCount: number
  failedCount: number
  scheduledCount?: number
  searchQuery: string
  setSearchQuery: (val: string) => void
  selectedBrandId?: string
  onBrandChange?: (val: string) => void
  availableBrands?: Array<{ id: string; name: string; handle?: string }>
}

export function BatchFilterToolbar({
  activeTab,
  setActiveTab,
  totalCount,
  readyCount,
  processingCount,
  failedCount,
  scheduledCount = 0,
  searchQuery,
  setSearchQuery,
  selectedBrandId = 'all',
  onBrandChange,
  availableBrands = [],
}: BatchFilterToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between w-full min-w-0">
      <Tabs
        value={activeTab}
        onValueChange={(v) =>
          setActiveTab(v as 'all' | 'ready' | 'processing' | 'failed' | 'scheduled')
        }
        className="w-full lg:w-auto"
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
            value="scheduled"
            className="gap-1.5 text-xs py-1.5"
          >
            <Clock className="size-3.5 text-blue-500 shrink-0" />
            <span>Agendados ({scheduledCount})</span>
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

      <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto">
        {availableBrands.length > 1 && onBrandChange && (
          <div className="w-full sm:w-48">
            <Select
              value={selectedBrandId}
              onValueChange={onBrandChange}
            >
              <SelectTrigger className="h-9 text-xs bg-card/60">
                <div className="flex items-center gap-1.5 truncate">
                  <Bookmark className="size-3.5 text-primary shrink-0" />
                  <SelectValue placeholder="Filtrar Marca" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value="all"
                  className="text-xs"
                >
                  Todas as Marcas ({availableBrands.length})
                </SelectItem>
                {availableBrands.map((b) => (
                  <SelectItem
                    key={b.id}
                    value={b.id}
                    className="text-xs"
                  >
                    {b.name} {b.handle ? `(${b.handle})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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
    </div>
  )
}
