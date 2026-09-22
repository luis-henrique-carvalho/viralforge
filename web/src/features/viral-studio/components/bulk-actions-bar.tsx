import { CheckCircle2, RefreshCw, Send, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface BulkActionsBarProps {
  selectedCount: number
  totalCount: number
  approvedCount?: number
  onSelectAll: () => void
  onClearSelection: () => void
  onBulkApprove: () => void
  onBulkRetry: () => void
  onBulkPublish?: () => void
  isProcessing?: boolean
}

export function BulkActionsBar({
  selectedCount,
  totalCount,
  approvedCount = 0,
  onSelectAll,
  onClearSelection,
  onBulkApprove,
  onBulkRetry,
  onBulkPublish,
  isProcessing = false,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 inset-x-0 mx-auto max-w-2xl px-4 z-40 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <Card className="flex items-center justify-between gap-4 p-4 shadow-xl border-primary/40 bg-background/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground">
            {selectedCount} {selectedCount === 1 ? 'vídeo selecionado' : 'vídeos selecionados'}
          </span>
          {selectedCount < totalCount ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={onSelectAll}
            >
              Selecionar todos ({totalCount})
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={onClearSelection}
            >
              Desmarcar todos
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onBulkPublish && approvedCount > 0 && (
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={onBulkPublish}
              disabled={isProcessing}
            >
              <Send className="size-3.5" />
              <span>Publicar ({approvedCount})</span>
            </Button>
          )}

          <Button
            size="sm"
            className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={onBulkApprove}
            disabled={isProcessing}
          >
            <CheckCircle2 className="size-4" />
            <span>Aprovar ({selectedCount})</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={onBulkRetry}
            disabled={isProcessing}
          >
            <RefreshCw className={`size-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Reprocessar</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={onClearSelection}
            title="Fechar / Limpar Seleção"
          >
            <X className="size-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
