import { ArrowUpDown, Clock, Eye, ListFilter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { SortOrder } from '../data/discovery.types'

export interface DiscoveryFilterBarProps {
  sortBy: SortOrder
  onChangeSortBy: (val: SortOrder) => void
  durationFilter: string
  onChangeDurationFilter: (val: string) => void
  minViews: number | null
  onChangeMinViews: (val: number | null) => void
  limit: number
  onChangeLimit: (val: number) => void
}

export function DiscoveryFilterBar({
  sortBy,
  onChangeSortBy,
  durationFilter,
  onChangeDurationFilter,
  minViews,
  onChangeMinViews,
  limit,
  onChangeLimit,
}: DiscoveryFilterBarProps) {
  return (
    // shadcn-ignore: layout
    <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/60 text-xs">
      <div className="flex items-center gap-1.5 min-w-[170px]">
        <Label className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
          <ArrowUpDown className="size-3 text-primary" />
          Ordenar:
        </Label>
        <Select
          value={sortBy}
          onValueChange={(val) => onChangeSortBy(val as SortOrder)}
        >
          <SelectTrigger className="h-8 text-xs bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="virality_score">Viral Score (🔥)</SelectItem>
            <SelectItem value="view_count">Mais Visualizados</SelectItem>
            <SelectItem value="engagement_rate">Maior Engajamento</SelectItem>
            <SelectItem value="recent">Mais Recentes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1.5 min-w-[150px]">
        <Label className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
          <Clock className="size-3 text-primary" />
          Duração:
        </Label>
        <Select
          value={durationFilter}
          onValueChange={onChangeDurationFilter}
        >
          <SelectTrigger className="h-8 text-xs bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as durações</SelectItem>
            <SelectItem value="short">Curtos (≤ 30s)</SelectItem>
            <SelectItem value="medium">Médios (30s - 60s)</SelectItem>
            <SelectItem value="long">Longos (&gt; 60s)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1.5 min-w-[150px]">
        <Label className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
          <Eye className="size-3 text-primary" />
          Min. Views:
        </Label>
        <Select
          value={minViews ? String(minViews) : '0'}
          onValueChange={(val) => onChangeMinViews(val === '0' ? null : Number(val))}
        >
          <SelectTrigger className="h-8 text-xs bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Sem mínimo</SelectItem>
            <SelectItem value="10000">10k+ views</SelectItem>
            <SelectItem value="50000">50k+ views</SelectItem>
            <SelectItem value="100000">100k+ views</SelectItem>
            <SelectItem value="500000">500k+ views</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1.5 min-w-[120px]">
        <Label className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
          <ListFilter className="size-3 text-primary" />
          Limite:
        </Label>
        <Select
          value={String(limit)}
          onValueChange={(val) => onChangeLimit(Number(val))}
        >
          <SelectTrigger className="h-8 text-xs bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="20">20 vídeos</SelectItem>
            <SelectItem value="50">50 vídeos</SelectItem>
            <SelectItem value="100">100 vídeos</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
