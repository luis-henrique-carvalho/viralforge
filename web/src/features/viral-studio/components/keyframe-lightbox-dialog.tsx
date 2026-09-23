import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { X } from 'lucide-react'

interface KeyframeLightboxDialogProps {
  imageUrl: string | null
  onClose: () => void
  sceneIndex?: number | null
}

export function KeyframeLightboxDialog({
  imageUrl,
  onClose,
  sceneIndex,
}: KeyframeLightboxDialogProps) {
  if (!imageUrl) return null

  return (
    <Dialog
      open={Boolean(imageUrl)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        className="max-w-[90vw] md:max-w-3xl p-2 bg-black/95 border-border/40 text-foreground overflow-hidden flex flex-col items-center justify-center focus:outline-none"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">
          {sceneIndex != null
            ? `Frame da Cena ${sceneIndex + 1}`
            : 'Frame do vídeo original em alta resolução'}
        </DialogTitle>

        <div className="relative w-full flex flex-col items-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 rounded-full bg-black/60 text-white hover:bg-black/90 size-8"
            onClick={onClose}
            aria-label="Fechar zoom"
          >
            <X className="size-4" />
          </Button>

          <img
            src={imageUrl}
            alt={sceneIndex != null ? `Frame da Cena ${sceneIndex + 1}` : 'Frame em alta resolução'}
            className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain shadow-2xl border border-border/30"
          />

          <Typography
            variant="muted"
            className="mt-2"
          >
            {sceneIndex != null
              ? `Cena ${sceneIndex + 1} — Frame extraído para análise visual`
              : 'Frame extraído do vídeo original'}
          </Typography>
        </div>
      </DialogContent>
    </Dialog>
  )
}
