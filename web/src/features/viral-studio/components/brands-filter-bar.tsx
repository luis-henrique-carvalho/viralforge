import { Search, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface BrandsFilterBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  providerFilter: string
  onProviderChange: (value: string) => void
  totalFiltered: number
}

export function BrandsFilterBar({
  searchQuery,
  onSearchChange,
  providerFilter,
  onProviderChange,
  totalFiltered,
}: BrandsFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card/40 p-3 rounded-lg border border-border">
      <div className="relative flex-1 w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nome, @handle, nicho ou palavra-chave..."
          className="pl-9 h-9 text-xs"
        />
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-3.5 text-muted-foreground" />
          <Select
            value={providerFilter}
            onValueChange={onProviderChange}
          >
            <SelectTrigger className="h-9 w-[130px] text-xs">
              <SelectValue placeholder="Motor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Motores</SelectItem>
              <SelectItem value="postiz">Postiz</SelectItem>
              <SelectItem value="zernio">Zernio</SelectItem>
              <SelectItem value="mock">Mock Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Badge
          variant="secondary"
          className="font-mono text-xs px-2.5 py-1"
        >
          {totalFiltered} {totalFiltered === 1 ? 'marca' : 'marcas'}
        </Badge>
      </div>
    </div>
  )
}
