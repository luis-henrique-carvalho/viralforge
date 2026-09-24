import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tag } from 'lucide-react'
import { BatchStatusBadge } from './batch-status-badge'
import { VideoPreviewCard } from './video-preview-card'
import type { ViralItem } from '../data/batch.types'

export interface ItemCardMediaHeroProps {
  item: ViralItem
  isSelected: boolean
  isSelectable: boolean
  onToggleSelect?: (itemId: string) => void
}

export function ItemCardMediaHero({
  item,
  isSelected,
  isSelectable,
  onToggleSelect,
}: ItemCardMediaHeroProps) {
  return (
    <div className="p-2 pb-0">
      <VideoPreviewCard item={item}>
        <div
          className="flex items-center justify-between gap-1.5 w-full pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {isSelectable && (
              <div className="bg-black/60 backdrop-blur-md rounded-md p-1 border border-white/20 flex items-center justify-center shadow-xs">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect?.(item.id)}
                  aria-label={`Selecionar vídeo ${item.id}`}
                  className="size-3.5 border-white/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </div>
            )}
            {item.brand_id && (
              <Badge
                variant="outline"
                className="gap-1 text-[10px] py-0.5 px-1.5 h-5 bg-black/65 backdrop-blur-md text-zinc-200 border border-white/20 shadow-xs truncate font-medium"
                title={`Marca: ${item.brand_id}`}
              >
                <Tag className="size-2 text-primary shrink-0" />
                <span className="truncate max-w-[90px]">@{item.brand_id.replace(/^@/, '')}</span>
              </Badge>
            )}
            {item.product_code ? (
              <Badge
                variant="secondary"
                className="gap-1 font-mono text-[10px] py-0.5 px-2 h-5 bg-black/65 backdrop-blur-md text-white border border-white/20 shadow-xs truncate"
              >
                <Tag className="size-2.5 text-primary shrink-0" />
                <span className="truncate">{item.product_code}</span>
              </Badge>
            ) : (
              <span
                className="font-mono text-[10px] text-zinc-300 bg-black/65 backdrop-blur-md border border-white/20 px-1.5 py-0.5 rounded-md truncate shadow-xs shrink-0"
                title={item.id}
              >
                #{item.id.slice(0, 8)}
              </span>
            )}
          </div>

          <div className="pointer-events-auto shrink-0">
            <BatchStatusBadge
              status={item.status}
              className="shadow-md"
            />
          </div>
        </div>
      </VideoPreviewCard>
    </div>
  )
}
