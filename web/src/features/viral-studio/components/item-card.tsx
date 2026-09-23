import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Check, Copy, Info, SlidersHorizontal } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ItemCardMediaHero } from './item-card-media-hero'
import { ItemCardActionSlot } from './item-card-action-slot'
import type { ViralItem } from '../data/batch.types'

export interface ItemCardProps {
  item: ViralItem
  batchId?: string
  isSelected?: boolean
  isSelectable?: boolean
  onToggleSelect?: (itemId: string) => void
  onInspect?: (item: ViralItem) => void
  onEdit?: (item: ViralItem) => void
  onApprove?: (itemId: string) => void
  onRetry?: (itemId: string) => void
  onPublish?: (item: ViralItem) => void
  onCancelSchedule?: (itemId: string) => void
  isApproving?: boolean
  isRetrying?: boolean
  isCancelling?: boolean
}

export function ItemCard({
  item,
  batchId,
  isSelected = false,
  isSelectable = false,
  onToggleSelect,
  onInspect,
  onEdit,
  onApprove,
  onRetry,
  onPublish,
  onCancelSchedule,
  isApproving = false,
  isRetrying = false,
  isCancelling = false,
}: ItemCardProps) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const effectiveBatchId = batchId || item.batch_id

  const handleEdit = () => {
    if (onEdit) {
      onEdit(item)
    } else if (effectiveBatchId) {
      navigate({
        to: '/viral-studio/$id/items/$itemId',
        params: { id: effectiveBatchId, itemId: item.id },
      })
    }
  }

  const handleCopyCaption = () => {
    const textToCopy =
      item.caption || item.ai_copy?.caption || item.selected_headline || item.source_url
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    toast.success('Legenda copiada para a área de transferência!')
    setTimeout(() => setCopied(false), 2000)
  }

  const headline =
    item.selected_headline ||
    item.manual_headline ||
    item.ai_copy?.selected_headline ||
    item.ai_copy?.headlines?.[0] ||
    'Sem título definido'

  return (
    <Card
      className={`group relative flex flex-col rounded-[18px] border border-border/70 bg-card/85 backdrop-blur-xs py-0 gap-0 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-xl hover:shadow-black/25 hover:-translate-y-0.5 w-full overflow-hidden ${
        isSelected ? 'ring-2 ring-primary border-primary' : ''
      }`}
    >
      <ItemCardMediaHero
        item={item}
        isSelected={isSelected}
        isSelectable={isSelectable}
        onToggleSelect={onToggleSelect}
      />

      <div className="p-3 flex flex-col gap-2.5 mt-auto">
        <Button
          variant="outline"
          className="w-full h-9 text-xs font-semibold gap-2 bg-secondary/30 hover:bg-secondary/70 border-border/70 hover:border-border text-foreground transition-all rounded-lg"
          onClick={handleEdit}
          aria-label="Revisar & Editar"
        >
          <SlidersHorizontal className="size-3.5 text-primary" />
          <span>Revisar &amp; Editar</span>
          <span className="sr-only">Editar</span>
        </Button>

        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <Button
              variant="link"
              type="button"
              onClick={handleEdit}
              className="p-0 h-auto text-left text-xs sm:text-[13px] font-semibold tracking-tight text-foreground hover:text-primary transition-colors truncate block w-full justify-start hover:no-underline"
              title={`${headline} (Clique para editar)`}
            >
              {headline}
            </Button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="icon-xs"
              className="size-8 rounded-lg p-0 flex items-center justify-center bg-muted/25 hover:bg-muted/60 border-border/60 hover:border-border text-muted-foreground hover:text-foreground transition-all"
              onClick={handleCopyCaption}
              title={copied ? 'Legenda copiada!' : 'Copiar Legenda'}
              aria-label="Legenda"
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-500 animate-in zoom-in-50" />
              ) : (
                <Copy className="size-3.5" />
              )}
              <span className="sr-only">{copied ? 'Copiado' : 'Legenda'}</span>
            </Button>

            <Button
              variant="outline"
              size="icon-xs"
              className="size-8 rounded-lg p-0 flex items-center justify-center bg-muted/25 hover:bg-muted/60 border-border/60 hover:border-border text-muted-foreground hover:text-foreground transition-all"
              onClick={() => onInspect?.(item)}
              title="Inspecionar Logs"
              aria-label="Logs"
            >
              <Info className="size-3.5" />
              <span className="sr-only">Logs</span>
            </Button>

            <ItemCardActionSlot
              item={item}
              onApprove={onApprove}
              onRetry={onRetry}
              onPublish={onPublish}
              onCancelSchedule={onCancelSchedule}
              isApproving={isApproving}
              isRetrying={isRetrying}
              isCancelling={isCancelling}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}
