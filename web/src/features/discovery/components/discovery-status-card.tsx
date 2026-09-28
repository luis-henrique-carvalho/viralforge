import { AlertCircle, Loader2, StopCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import type { DiscoverySearch } from '../data/discovery.types'

export interface DiscoveryStatusCardProps {
  search?: DiscoverySearch | null
  fallbackQuery?: string
  isMining: boolean
  onCancel?: () => void
  isCancelling?: boolean
}

export function DiscoveryStatusCard({
  search,
  fallbackQuery = '',
  isMining,
  onCancel,
  isCancelling = false,
}: DiscoveryStatusCardProps) {
  if (isMining) {
    return (
      <Card className="p-4 bg-amber-500/10 border-amber-500/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-amber-500" />
          <div>
            <Typography
              variant="small"
              className="font-semibold text-foreground"
            >
              {search?.status === 'QUEUED'
                ? 'Aguardando na fila de concorrência...'
                : `Minerando vídeos virais para "${search?.query || fallbackQuery}"...`}
            </Typography>
            <Typography variant="muted">
              O worker está extraindo dados de engajamento e calculando pontuações virais.
            </Typography>
          </div>
        </div>

        {onCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isCancelling}
            className="gap-1.5 border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
          >
            <StopCircle className="size-4" />
            <span>Cancelar Busca</span>
          </Button>
        )}
      </Card>
    )
  }

  if (search?.status === 'FAILED') {
    return (
      <Card className="p-4 bg-destructive/10 border-destructive/30 flex items-center gap-3">
        <AlertCircle className="size-5 text-destructive shrink-0" />
        <div className="flex-1">
          <Typography
            variant="small"
            className="font-semibold text-destructive"
          >
            A busca de descoberta falhou
          </Typography>
          <Typography variant="muted">
            {search.error_message || 'Erro desconhecido durante a mineração de vídeos.'}
          </Typography>
        </div>
      </Card>
    )
  }

  if (search?.status === 'CANCELLED') {
    return (
      <Card className="p-4 bg-muted/40 border-border/60 flex items-center gap-3">
        <StopCircle className="size-5 text-zinc-400 shrink-0" />
        <div className="flex-1">
          <Typography
            variant="small"
            className="font-semibold text-foreground"
          >
            Busca cancelada pelo usuário
          </Typography>
          <Typography variant="muted">
            Esta pesquisa foi interrompida antes da conclusão da mineração.
          </Typography>
        </div>
      </Card>
    )
  }

  return null
}
