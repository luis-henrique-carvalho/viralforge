import { AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface UnsavedChangesDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirmDiscard: () => void
  onSaveAndProceed?: () => void
  isSaving?: boolean
}

export function UnsavedChangesDialog({
  isOpen,
  onOpenChange,
  onConfirmDiscard,
  onSaveAndProceed,
  isSaving = false,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 shrink-0">
              <AlertTriangle className="size-4" />
            </div>
            <AlertDialogTitle className="text-base font-bold">
              Alterações não salvas
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-xs leading-relaxed pt-1">
            Você possui alterações não salvas neste vídeo. O que deseja fazer antes de prosseguir?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end sm:gap-2 pt-2">
          <AlertDialogCancel
            disabled={isSaving}
            className="text-xs"
          >
            Permanecer no Vídeo
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isSaving}
            onClick={onConfirmDiscard}
            className="text-xs"
          >
            Descartar Alterações
          </AlertDialogAction>
          {onSaveAndProceed && (
            <Button
              type="button"
              variant="default"
              className="text-xs font-semibold"
              disabled={isSaving}
              onClick={onSaveAndProceed}
            >
              {isSaving ? 'Salvando…' : 'Salvar e Continuar'}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
