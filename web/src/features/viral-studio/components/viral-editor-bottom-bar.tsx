import { AlertCircle, Check, CheckCircle2, Clock, RotateCcw, Save, Send, X } from 'lucide-react'
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
  onPublish?: (item: ViralItem) => void
  onCancelSchedule?: (itemId: string) => void
  isApproving?: boolean
  isCancelling?: boolean
}

export function ViralEditorBottomBar({
  item,
  isDirty,
  isSaving,
  onDiscard,
  onSave,
  onApprove,
  onPublish,
  onCancelSchedule,
  isApproving = false,
  isCancelling = false,
}: ViralEditorBottomBarProps) {
  const isReady = item.status === 'READY_FOR_REVIEW'

  return (
    <div className="sticky bottom-4 z-40 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-background/95 p-3.5 backdrop-blur shadow-lg">
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

        {item.status === 'APPROVED' && onPublish && (
          <Button
            type="button"
            size="sm"
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
            onClick={() => onPublish(item)}
          >
            <Send className="size-3.5" />
            <span>Publicar Vídeo</span>
          </Button>
        )}

        {item.status === 'SCHEDULED' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/25 text-blue-500 text-xs font-medium">
            <Clock className="size-3.5" />
            <span>
              {item.scheduled_for
                ? `Agendado para ${new Date(item.scheduled_for).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'Agendado'}
            </span>
            {onCancelSchedule && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="size-5 ml-1 p-0 hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded"
                onClick={() => onCancelSchedule(item.id)}
                disabled={isCancelling}
                title="Cancelar Agendamento"
              >
                <X className="size-3" />
              </Button>
            )}
          </div>
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
