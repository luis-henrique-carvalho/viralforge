import { useState } from 'react'
import { Plus, Video } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import { useCreateBatch } from '@/features/viral-studio/hooks/use-create-batch'
import type { Brand } from '../data/brand.types'

interface BrandManualBatchDialogProps {
  isOpen: boolean
  onClose: () => void
  brand: Brand
}

export function BrandManualBatchDialog({ isOpen, onClose, brand }: BrandManualBatchDialogProps) {
  const [urlsText, setUrlsText] = useState('')
  const model = 'gemini-2.5-flash'
  const createBatchMutation = useCreateBatch()

  const handleCreate = async () => {
    const urls = urlsText
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0)

    if (urls.length === 0) return

    const items = urls.map((url) => ({
      source_url: url,
      brand_id: brand.id,
      model,
    }))

    await createBatchMutation.mutateAsync({
      items,
      brand_id: brand.id,
    })

    setUrlsText('')
    onClose()
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Video className="size-5 text-primary" />
            <DialogTitle>Novo Lote de Vídeos para {brand.name}</DialogTitle>
          </div>
          <DialogDescription>
            Insira os links dos vídeos (TikTok, Instagram Reels, YouTube Shorts) que deseja
            processar. A marca{' '}
            <span className="font-mono text-primary font-semibold">{brand.handle}</span> e o
            template{' '}
            <span className="font-mono text-foreground font-semibold">{brand.template_id}</span>{' '}
            serão aplicados automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label
              htmlFor="video-urls"
              className="text-xs font-semibold"
            >
              Links dos Vídeos (um por linha):
            </Label>
            <Textarea
              id="video-urls"
              placeholder="https://www.tiktok.com/@creator/video/123456789&#10;https://www.instagram.com/reel/abcdefg/"
              value={urlsText}
              onChange={(e) => setUrlsText(e.target.value)}
              className="min-h-[140px] font-mono text-xs"
            />
            <Typography
              variant="muted"
              className="text-[11px]"
            >
              Insira até 20 URLs por lote.
            </Typography>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={!urlsText.trim() || createBatchMutation.isPending}
            className="gap-2"
          >
            <Plus className="size-4" />
            {createBatchMutation.isPending ? 'Criando Lote...' : 'Criar Lote'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
