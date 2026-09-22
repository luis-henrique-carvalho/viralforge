import { AlertCircle, Check, CheckCircle2, RotateCcw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ViralItem } from '../data/batch.types'

interface ViralEditorBottomBarProps {
  item: ViralItem
  isDirty: boolean
  isSaving: boolean
  onDiscard: () => void
  onSave: () => void
  onApprove?: (itemId: string) => void
  isApproving?: boolean
}

export function ViralEditorBottomBar({
  item,
  isDirty,
  isSaving,
  onDiscard,
  onSave,
  onApprove,
  isApproving = false,
}: ViralEditorBottomBarProps) {
  const isReady = item.status === 'READY_FOR_REVIEW'

  return (
    <div className="sticky bottom-0 z-40 flex flex-wrap items-center justify-between gap-3 border-t border-border/80 bg-background/95 p-4 backdrop-blur shadow-lg">
      {/* Left side: Dirty state indicator */}
      <div className="flex items-center gap-2">
        {isDirty ? (
          <Badge
            variant="outline"
            className="gap-1.5 border-amber-500/40 bg-amber-500/10 text-amber-500 text-xs font-medium py-1 px-2.5"
          >
            <AlertCircle className="size-3.5 animate-pulse" />
            <span>Alterações não salvas</span>
          </Badge>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Check className="size-3.5 text-emerald-500" />
            <span>Todas as alterações salvas</span>
          </span>
        )}
      </div>

      {/* Right side: Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs gap-1.5"
          onClick={onDiscard}
          disabled={!isDirty || isSaving}
        >
          <RotateCcw className="size-3.5" />
          <span>Descartar</span>
        </Button>

        {isReady && onApprove && (
          <Button
            type="button"
            size="sm"
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
            onClick={() => onApprove(item.id)}
            disabled={isApproving}
          >
            <CheckCircle2 className="size-3.5" />
            <span>{isApproving ? 'Aprovando…' : 'Aprovar Vídeo'}</span>
          </Button>
        )}

        <Button
          type="button"
          size="sm"
          className="text-xs font-semibold gap-1.5 shadow-xs"
          disabled={!isDirty || isSaving}
          onClick={onSave}
        >
          <Save className="size-3.5" />
          <span>{isSaving ? 'Salvando…' : 'Salvar Alterações'}</span>
        </Button>
      </div>
    </div>
  )
}
