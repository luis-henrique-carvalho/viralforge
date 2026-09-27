import { useState } from 'react'
import { Send } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import type { SocialChannel, ViralItem } from '../data/batch.types'

interface BrandQuickPublishDialogProps {
  video: ViralItem | null
  channels: SocialChannel[]
  onClose: () => void
  onConfirmPublish: (params: {
    video: ViralItem
    channelIds: string[]
    publishMode: 'slot' | 'now' | 'custom'
    customDateTime?: string
  }) => Promise<void>
  isPending: boolean
}

export function BrandQuickPublishDialog({
  video,
  channels,
  onClose,
  onConfirmPublish,
  isPending,
}: BrandQuickPublishDialogProps) {
  const [selectedChannels, setSelectedChannels] = useState<string[]>(channels.map((c) => c.id))
  const [publishMode, setPublishMode] = useState<'slot' | 'now' | 'custom'>('slot')
  const [customDateTime, setCustomDateTime] = useState('')

  if (!video) return null

  const handleExecute = async () => {
    if (selectedChannels.length === 0) {
      toast.error('Selecione pelo menos um canal.')
      return
    }
    if (publishMode === 'custom' && !customDateTime) {
      toast.error('Selecione uma data e horário válidos.')
      return
    }

    await onConfirmPublish({
      video,
      channelIds: selectedChannels,
      publishMode,
      customDateTime,
    })
  }

  return (
    <Dialog
      open={Boolean(video)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="size-4 text-primary" />
            Agendar / Publicar Vídeo
          </DialogTitle>
          <DialogDescription className="text-xs">
            Escolha os canais e o modo de publicação para o vídeo selecionado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Target Channels */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Canais de Destino:</Label>
            <ScrollArea className="h-36  p-2 bg-muted/20">
              <div className="space-y-1.5 pr-2">
                {channels.map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center gap-2"
                  >
                    <Checkbox
                      id={`ch-${channel.id}`}
                      checked={selectedChannels.includes(channel.id)}
                      onCheckedChange={(checked) => {
                        setSelectedChannels((prev) =>
                          checked ? [...prev, channel.id] : prev.filter((id) => id !== channel.id),
                        )
                      }}
                    />
                    <label
                      htmlFor={`ch-${channel.id}`}
                      className="text-xs flex items-center gap-1.5 cursor-pointer select-none font-medium capitalize"
                    >
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0"
                      >
                        {channel.platform}
                      </Badge>
                      {channel.name}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Mode Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Momento da Publicação:</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={publishMode === 'slot' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPublishMode('slot')}
                className="text-xs h-9 flex flex-col gap-0.5 items-center justify-center p-1"
              >
                <span className="font-semibold">Próximo Slot</span>
                <span className="text-[9px] opacity-80">Automático</span>
              </Button>

              <Button
                type="button"
                variant={publishMode === 'now' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPublishMode('now')}
                className="text-xs h-9 flex flex-col gap-0.5 items-center justify-center p-1"
              >
                <span className="font-semibold">Publicar Agora</span>
                <span className="text-[9px] opacity-80">Imediato</span>
              </Button>

              <Button
                type="button"
                variant={publishMode === 'custom' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPublishMode('custom')}
                className="text-xs h-9 flex flex-col gap-0.5 items-center justify-center p-1"
              >
                <span className="font-semibold">Personalizado</span>
                <span className="text-[9px] opacity-80">Data / Hora</span>
              </Button>
            </div>
          </div>

          {/* Custom DateTime Input */}
          {publishMode === 'custom' && (
            <div className="space-y-1.5 pt-1">
              <Label
                htmlFor="custom-datetime"
                className="text-xs"
              >
                Data e Horário de Envio:
              </Label>
              <Input
                id="custom-datetime"
                type="datetime-local"
                value={customDateTime}
                onChange={(e) => setCustomDateTime(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          )}
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
            onClick={handleExecute}
            disabled={selectedChannels.length === 0 || isPending}
            className="gap-2"
          >
            <Send className="size-3.5" />
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
