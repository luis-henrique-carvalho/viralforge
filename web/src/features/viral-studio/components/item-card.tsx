import { useState } from 'react'
import { Check, CheckCircle2, Copy, ExternalLink, Info, RefreshCw, Tag } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { BatchStatusBadge } from './batch-status-badge'
import { VideoPreviewCard } from './video-preview-card'
import type { ViralItem } from '../data/batch.types'

interface ItemCardProps {
  item: ViralItem
  isSelected?: boolean
  isSelectable?: boolean
  onToggleSelect?: (itemId: string) => void
  onInspect?: (item: ViralItem) => void
  onApprove?: (itemId: string) => void
  onRetry?: (itemId: string) => void
  isApproving?: boolean
  isRetrying?: boolean
}

export function ItemCard({
  item,
  isSelected = false,
  isSelectable = false,
  onToggleSelect,
  onInspect,
  onApprove,
  onRetry,
  isApproving = false,
  isRetrying = false,
}: ItemCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyCaption = () => {
    const textToCopy = item.caption || item.selected_headline || item.source_url
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
      className={`relative flex flex-col justify-between border-border bg-card/70 backdrop-blur-xs transition-all hover:border-primary/50 hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary border-primary' : ''
      }`}
    >
      <CardHeader className="p-3 pb-2 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            {isSelectable && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelect?.(item.id)}
                aria-label={`Selecionar vídeo ${item.id}`}
              />
            )}
            {item.product_code ? (
              <Badge
                variant="secondary"
                className="gap-1 font-mono text-[11px] truncate"
              >
                <Tag className="size-3 text-primary" />
                {item.product_code}
              </Badge>
            ) : (
              <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[120px]">
                {item.id}
              </span>
            )}
          </div>
          <BatchStatusBadge status={item.status} />
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0 space-y-3">
        {/* 9:16 Video Preview */}
        <VideoPreviewCard item={item} />

        {/* Headline & Product Meta */}
        <div className="space-y-1">
          <p
            className="text-xs font-semibold leading-snug line-clamp-2 text-foreground"
            title={headline}
          >
            {headline}
          </p>

          <div className="flex items-center gap-2 pt-1">
            <a
              href={item.source_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary truncate max-w-[180px]"
              title="Abrir URL original"
            >
              <ExternalLink className="size-3 shrink-0" />
              <span className="truncate">{item.source_url}</span>
            </a>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0 flex flex-col gap-2 border-t border-border/40">
        <div className="flex w-full items-center justify-between gap-1 pt-2">
          {/* Copy button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs gap-1 flex-1"
            onClick={handleCopyCaption}
            title="Copiar Legenda"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
            <span>{copied ? 'Copiado' : 'Legenda'}</span>
          </Button>

          {/* Inspect / Logs button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs gap-1"
            onClick={() => onInspect?.(item)}
            title="Inspecionar Detalhes & Logs"
          >
            <Info className="size-3.5" />
            <span>Logs</span>
          </Button>
        </div>

        {/* Action button based on state */}
        {isReady && (
          <Button
            size="sm"
            className="w-full h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => onApprove?.(item.id)}
            disabled={isApproving}
          >
            <CheckCircle2 className="size-3.5" />
            {isApproving ? 'Aprovando...' : 'Aprovar Vídeo'}
          </Button>
        )}

        {isFailed && (
          <Button
            variant="secondary"
            size="sm"
            className="w-full h-8 text-xs gap-1.5 text-destructive hover:bg-destructive/10"
            onClick={() => onRetry?.(item.id)}
            disabled={isRetrying}
          >
            <RefreshCw className={`size-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Reenviando...' : 'Tentar Novamente'}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
