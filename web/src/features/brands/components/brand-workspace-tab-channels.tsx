import { useState } from 'react'
import { Link2, Plus, RefreshCw, Share2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useBrandChannels } from '../hooks/use-brand-workspace'
import { brandApi } from '../services/brand.api'
import { BrandChannelCard } from './brand-channel-card'
import { BrandManageChannelsDialog } from './brand-manage-channels-dialog'
import type { Brand, SocialChannel } from '../data/brand.types'

interface BrandWorkspaceTabChannelsProps {
  brand: Brand
}

export function BrandWorkspaceTabChannels({ brand }: BrandWorkspaceTabChannelsProps) {
  const { data: channels = [], isLoading, refetch, isRefetching } = useBrandChannels(brand.id)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false)

  const handleConnectNetwork = async () => {
    try {
      setIsConnecting(true)
      const res = await brandApi.getBrandConnectUrl(brand.id)
      if (res.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer')
        toast.info('Abrindo página de conexão de canal social...')
      } else {
        toast.error('Nenhuma URL de conexão disponível para este provedor.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Falha ao obter URL de autenticação: ${msg}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSync = async () => {
    await refetch()
    toast.success('Canais sociais sincronizados!')
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      // shadcn-ignore: layout
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/40 p-4 rounded-xl border border-border">
        <div>
          <Typography
            variant="h4"
            className="font-semibold text-foreground"
          >
            Canais Sociais Conectados
          </Typography>
          <Typography
            variant="muted"
            className="text-xs"
          >
            Redes vinculadas à marca {brand.name} disponíveis para agendamento e postagem
            automática.
          </Typography>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isLoading || isRefetching}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`size-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsManageDialogOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Link2 className="size-3.5 text-primary" />
            Vincular Canais
          </Button>

          <Button
            size="sm"
            onClick={handleConnectNetwork}
            disabled={isConnecting}
            className="gap-1.5 text-xs shadow-sm"
          >
            <Plus className="size-3.5" />
            Conectar Nova Rede
          </Button>
        </div>
      </div>
      {/* Channels Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Card
              key={n}
              className="p-5 space-y-3"
            >
              <div className="flex gap-3 items-center">
                <Skeleton className="size-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : channels.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel: SocialChannel) => (
            <BrandChannelCard
              key={channel.id}
              channel={channel}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-border/80 bg-card/30 p-10 text-center space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Share2 className="size-6" />
          </div>
          <Typography variant="h4">Nenhum canal social vinculado a esta marca</Typography>
          <Typography
            variant="muted"
            className="max-w-md mx-auto text-xs"
          >
            Vincule as contas sociais já autenticadas no provedor ou conecte novas contas para
            habilitar a publicação e agendamento automático de vídeos.
          </Typography>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="default"
              onClick={() => setIsManageDialogOpen(true)}
              className="gap-2 text-xs shadow-sm"
            >
              <Link2 className="size-4" />
              Vincular Canais Conectados
            </Button>
            <Button
              variant="outline"
              onClick={handleConnectNetwork}
              disabled={isConnecting}
              className="gap-2 text-xs shadow-sm"
            >
              <Plus className="size-4" />
              Conectar Nova Rede
            </Button>
          </div>
        </Card>
      )}
      {/* Channel Binding Management Dialog */}
      <BrandManageChannelsDialog
        brand={brand}
        open={isManageDialogOpen}
        onOpenChange={setIsManageDialogOpen}
      />
    </div>
  )
}
