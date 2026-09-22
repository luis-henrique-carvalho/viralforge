import { ArrowLeft, ChevronLeft, ChevronRight, Film, Sparkles, Tag } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BatchStatusBadge } from './batch-status-badge'
import type { Brand, ViralItem, VisualTemplate } from '../data/batch.types'

interface ViralEditorTopbarProps {
  item: ViralItem
  batchId: string
  currentIndex: number
  totalItems: number
  brand?: Brand | null
  template?: VisualTemplate | null
  onBack: () => void
  onNavigatePrev?: () => void
  onNavigateNext?: () => void
  hasPrev: boolean
  hasNext: boolean
}

export function ViralEditorTopbar({
  item,
  batchId,
  currentIndex,
  totalItems,
  brand,
  template,
  onBack,
  onNavigatePrev,
  onNavigateNext,
  hasPrev,
  hasNext,
}: ViralEditorTopbarProps) {
  const shortBatchId = batchId.slice(0, 8)
  const videoLabel = item.product_code || item.id.slice(0, 8)

  return (
    <header className="sticky top-0 z-30 flex flex-col gap-3 border-b border-border/80 bg-background/95 p-4 backdrop-blur shadow-xs sm:flex-row sm:items-center sm:justify-between">
      {/* Left side: Back button & Breadcrumbs */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="gap-1.5 text-xs font-medium"
        >
          <ArrowLeft className="size-3.5" />
          <span>Voltar ao Lote</span>
        </Button>

        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <Link
            to="/viral-studio"
            className="hover:text-foreground transition-colors"
          >
            Lotes
          </Link>
          <span>/</span>
          <Link
            to="/viral-studio/$id"
            params={{ id: batchId }}
            className="hover:text-foreground transition-colors font-mono"
          >
            Lote #{shortBatchId}
          </Link>
          <span>/</span>
          <span className="font-semibold text-foreground font-mono">Vídeo #{videoLabel}</span>
        </nav>

        {brand && (
          <Badge
            variant="secondary"
            className="hidden sm:inline-flex gap-1 text-[11px]"
          >
            <Sparkles className="size-3 text-primary" />
            {brand.name}
          </Badge>
        )}

        {template && (
          <Badge
            variant="outline"
            className="hidden md:inline-flex gap-1 text-[11px]"
          >
            <Film className="size-3 text-muted-foreground" />
            {template.name}
          </Badge>
        )}

        {item.product_code && (
          <Badge
            variant="secondary"
            className="hidden lg:inline-flex gap-1 font-mono text-[11px]"
          >
            <Tag className="size-3 text-primary" />
            {item.product_code}
          </Badge>
        )}
      </div>

      {/* Right side: Index indicator & Prev / Next navigation & Status */}
      <div className="flex items-center justify-between sm:justify-end gap-3">
        <BatchStatusBadge status={item.status} />

        {totalItems > 1 && (
          <div className="flex items-center gap-1.5 border-l border-border/80 pl-3">
            <span className="text-xs text-muted-foreground mr-1">
              Vídeo <strong className="text-foreground">{currentIndex + 1}</strong> de{' '}
              <strong className="text-foreground">{totalItems}</strong>
            </span>

            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={onNavigatePrev}
              disabled={!hasPrev}
              title="Vídeo Anterior (Alt + ←)"
              aria-label="Vídeo anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={onNavigateNext}
              disabled={!hasNext}
              title="Próximo Vídeo (Alt + →)"
              aria-label="Próximo vídeo"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
