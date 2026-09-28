import { useEffect, useState } from 'react'
import { Check, Link2, RefreshCw, ShieldAlert } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { useBrandAvailableChannels, useBindBrandChannels } from '../hooks/use-brand-workspace'
import { getBrandActiveProvider } from './brand-settings-motor-card'
import { BrandChannelRow } from './brand-channel-row'
import type { Brand, SocialChannel } from '../data/batch.types'

interface BrandManageChannelsDialogProps {
  brand: Brand
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BrandManageChannelsDialog({
  brand,
  open,
  onOpenChange,
}: BrandManageChannelsDialogProps) {
  const activeProvider = getBrandActiveProvider(brand)
  const profiles = (brand.publishing_profiles || {}) as Record<string, any>
  const currentProfile = profiles[activeProvider] || {}

  const {
    data: availableChannels = [],
    isLoading,
    refetch,
    isRefetching,
  } = useBrandAvailableChannels(brand.id, open)
  const bindMutation = useBindBrandChannels(brand.id)

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      const boundIds: string[] = currentProfile.channel_ids || []
      setSelectedIds(boundIds)
    }
  }, [open, brand, currentProfile.channel_ids])

  const toggleChannel = (channelId: string) => {
    setSelectedIds((prev) =>
      prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId],
    )
  }

  const handleSave = async () => {
    try {
      await bindMutation.mutateAsync({
        channel_ids: selectedIds,
      })
      onOpenChange(false)
    } catch {
      // Handled by toast
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="size-5 text-primary" />
            Vincular Redes Sociais à Marca
          </DialogTitle>
          <DialogDescription className="text-xs">
            Selecione quais contas do provedor ({activeProvider}) pertencem à marca{' '}
            <strong className="text-foreground">{brand.name}</strong>. Vídeos agendados serão
            publicados exclusivamente nas contas marcadas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 py-2 text-xs min-h-0">
          <div className="flex items-center justify-between pt-1">
            <Typography
              variant="muted"
              className="text-xs"
            >
              {selectedIds.length} de {availableChannels.length} canal(is) selecionado(s)
            </Typography>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] px-2"
                onClick={() => setSelectedIds(availableChannels.map((c) => c.id))}
                disabled={isLoading || availableChannels.length === 0}
              >
                Selecionar Todos
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] px-2"
                onClick={() => setSelectedIds([])}
                disabled={isLoading || selectedIds.length === 0}
              >
                Limpar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 size-7 p-0"
                onClick={() => refetch()}
                disabled={isLoading || isRefetching}
                title="Recarregar canais do provedor"
              >
                <RefreshCw className={`size-3 ${isRefetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  className="h-14 rounded-lg"
                />
              ))}
            </div>
          ) : availableChannels.length === 0 ? (
            <div className="p-6 text-center rounded-lg border border-dashed border-border bg-card/40 space-y-2">
              <ShieldAlert className="size-6 text-muted-foreground mx-auto" />
              <Typography
                variant="p"
                className="text-xs font-semibold text-foreground"
              >
                Nenhuma conta social encontrada no {activeProvider}
              </Typography>
              <Typography
                variant="muted"
                className="text-[11px]"
              >
                Conecte primeiro suas redes sociais na interface do {activeProvider} antes de
                vinculá-las.
              </Typography>
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-3">
              <div className="space-y-2">
                {availableChannels.map((channel: SocialChannel) => (
                  <BrandChannelRow
                    key={channel.id}
                    channel={channel}
                    isSelected={selectedIds.includes(channel.id)}
                    onToggle={toggleChannel}
                    currentBrandId={brand.id}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="pt-2 border-t border-border flex sm:justify-between items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={bindMutation.isPending}
            className="text-xs"
          >
            Cancelar
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={bindMutation.isPending}
            className="text-xs gap-1.5 shadow-sm"
          >
            {bindMutation.isPending ? (
              <>
                <RefreshCw className="size-3.5 animate-spin" />
                Salvando Vínculo...
              </>
            ) : (
              <>
                <Check className="size-3.5" />
                Salvar Canais da Marca
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
