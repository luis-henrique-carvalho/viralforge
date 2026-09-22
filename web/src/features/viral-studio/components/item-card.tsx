import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Info,
  RefreshCw,
  SlidersHorizontal,
  Tag,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { BatchStatusBadge } from './batch-status-badge'
import { VideoPreviewCard } from './video-preview-card'
import type { ViralItem } from '../data/batch.types'

interface ItemCardProps {
  item: ViralItem
  batchId?: string
  isSelected?: boolean
  isSelectable?: boolean
  onToggleSelect?: (itemId: string) => void
  onInspect?: (item: ViralItem) => void
  onEdit?: (item: ViralItem) => void
  onApprove?: (itemId: string) => void
  onRetry?: (itemId: string) => void
  isApproving?: boolean
  isRetrying?: boolean
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
  isApproving = false,
  isRetrying = false,
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

  const isReady = item.status === 'READY_FOR_REVIEW'
  const isFailed = item.status === 'FAILED'

  return (
    <Card
      className={`group relative flex flex-col rounded-[18px] border border-border/70 bg-card/85 backdrop-blur-xs py-0 gap-0 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-xl hover:shadow-black/25 hover:-translate-y-0.5 w-full overflow-hidden ${
        isSelected ? 'ring-2 ring-primary border-primary' : ''
      }`}
    >
      {/* 9:16 Video Media Hero with Floating Frosted Badges */}
      <div className="p-2 pb-0">
        <VideoPreviewCard item={item}>
          {/* Top Overlays: Identifiers & Status Badge */}
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

      {/* Card Footer: Revisar & Editar Button + Bottom Row (Title + Mini Icon Buttons) */}
      <div className="p-3 flex flex-col gap-2.5 mt-auto">
        {/* Full-width Revisar & Editar Button */}
        <Button
          variant="outline"
          className="w-full h-9 text-xs font-semibold gap-2 bg-secondary/30 hover:bg-secondary/70 border-border/70 hover:border-border text-foreground transition-all rounded-lg"
          onClick={handleEdit}
          aria-label="Revisar & Editar"
        >
          <SlidersHorizontal className="size-3.5 text-foreground/80" />
          <span>Revisar & Editar</span>
          <span className="sr-only">Editar</span>
        </Button>

        {/* Title and Mini Icon Buttons */}
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
            {/* Copy Caption */}
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

            {/* Inspect Logs */}
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

            {/* Quick Approve or Approved Status */}
            {isReady ? (
              <Button
                variant="outline"
                size="icon-xs"
                className="size-8 rounded-lg p-0 flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-500 hover:text-emerald-400 transition-all shadow-2xs"
                onClick={() => onApprove?.(item.id)}
                disabled={isApproving}
                title="Aprovar Vídeo"
                aria-label="Aprovar Vídeo"
              >
                <CheckCircle2 className="size-3.5" />
                <span className="sr-only">Aprovar Vídeo</span>
              </Button>
            ) : item.status === 'APPROVED' ? (
              <div
                className="size-8 rounded-lg flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 select-none shadow-2xs"
                title="Vídeo Aprovado"
              >
                <CheckCircle2 className="size-3.5" />
                <span className="sr-only">Vídeo Aprovado</span>
              </div>
            ) : isFailed ? (
              <Button
                variant="outline"
                size="icon-xs"
                className="size-8 rounded-lg p-0 flex items-center justify-center bg-destructive/10 hover:bg-destructive/20 border-destructive/30 text-destructive transition-all"
                onClick={() => onRetry?.(item.id)}
                disabled={isRetrying}
                title="Tentar Novamente"
                aria-label="Tentar Novamente"
              >
                <RefreshCw className={`size-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                <span className="sr-only">Tentar Novamente</span>
              </Button>
            ) : (
              <div
                className="size-8 rounded-lg flex items-center justify-center bg-muted/20 border border-border/40 text-muted-foreground"
                title="Processando"
              >
                <Clock className="size-3.5 animate-pulse text-muted-foreground/80" />
                <span className="sr-only">Processando</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
