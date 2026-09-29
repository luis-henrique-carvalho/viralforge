import { AlertTriangle, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { ScheduledPost } from '../data/brand.types'

interface BrandCancelScheduleDialogProps {
  post: ScheduledPost | null
  onClose: () => void
  onConfirm: () => Promise<void>
  isPending: boolean
}

export function BrandCancelScheduleDialog({
  post,
  onClose,
  onConfirm,
  isPending,
}: BrandCancelScheduleDialogProps) {
  if (!post) return null

  return (
    <Dialog
      open={Boolean(post)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <DialogTitle>Cancelar Agendamento?</DialogTitle>
          </div>
          <DialogDescription className="text-xs pt-2">
            Tem certeza que deseja cancelar esta publicação agendada? O post será excluído do
            provedor e o vídeo{' '}
            <span className="font-semibold text-foreground">
              retornará imediatamente ao status &quot;Aprovado&quot;
            </span>{' '}
            para que você possa reagendá-lo em outro momento.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Manter Agendamento
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            className="gap-1.5"
          >
            <Trash2 className="size-3.5" />
            {isPending ? 'Cancelando...' : 'Confirmar Cancelamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
