import { CheckSquare, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { DiscoveryVideoCard } from './discovery-video-card'
import type { DiscoveryItem } from '../data/discovery.types'

export interface DiscoveryResultsSectionProps {
  items: DiscoveryItem[]
  selectedItems: DiscoveryItem[]
  query: string
  onToggleSelect: (item: DiscoveryItem) => void
  onSelectAll: () => void
}

export function DiscoveryResultsSection({
  items,
  selectedItems,
  query,
  onToggleSelect,
  onSelectAll,
}: DiscoveryResultsSectionProps) {
  const isAllSelected = items.length > 0 && selectedItems.length === items.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Typography
          variant="small"
          className="font-semibold text-muted-foreground flex items-center gap-1.5"
        >
          <Flame className="size-4 text-primary" />
          {items.length} vídeo{items.length !== 1 ? 's' : ''} minerado
          {items.length !== 1 ? 's' : ''} para &ldquo;{query}&rdquo;
        </Typography>

        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1.5"
            onClick={onSelectAll}
          >
            <CheckSquare className="size-3.5" />
            {isAllSelected ? 'Desmarcar Todos' : 'Selecionar Todos'}
          </Button>
        )}
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-start">
          {items.map((item) => (
            <DiscoveryVideoCard
              key={item.id}
              item={item}
              isSelected={selectedItems.some((i) => i.id === item.id)}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border-dashed border-border/80 bg-card/30">
          <Typography variant="h3">Nenhum vídeo encontrado</Typography>
          <Typography variant="muted">
            Tente ajustar os filtros ou buscar por outros termos ou hashtags.
          </Typography>
        </Card>
      )}
    </div>
  )
}
