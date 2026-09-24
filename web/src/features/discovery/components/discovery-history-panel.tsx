import { History, Loader2, StopCircle, Trash2, Video } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Typography } from '@/components/ui/typography'
import type { DiscoverySearchStatus, DiscoverySearchSummary } from '../data/discovery.types'

export interface DiscoveryHistoryPanelProps {
  searches: DiscoverySearchSummary[]
  activeSearchId: string | null
  onSelectSearch: (searchId: string) => void
  onCancelSearch: (searchId: string) => void
  onDeleteSearch: (searchId: string) => void
  isCancelling?: boolean
  isDeleting?: boolean
}

function renderStatusBadge(status: DiscoverySearchStatus, totalFound: number) {
  switch (status) {
    case 'SEARCHING':
      return (
        <Badge
          variant="default"
          className="gap-1 h-5 text-[10px] animate-pulse bg-amber-500/20 text-amber-400 border-amber-500/30 font-medium"
        >
          <Loader2 className="size-2.5 animate-spin" />
          <span>Minerando...</span>
        </Badge>
      )
    case 'QUEUED':
      return (
        <Badge
          variant="secondary"
          className="h-5 text-[10px] bg-blue-500/20 text-blue-400 border-blue-500/30 font-medium"
        >
          Na Fila
        </Badge>
      )
    case 'COMPLETED':
      return (
        <Badge
          variant="outline"
          className="h-5 text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-medium"
        >
          Concluído ({totalFound})
        </Badge>
      )
    case 'CANCELLED':
      return (
        <Badge
          variant="secondary"
          className="h-5 text-[10px] text-zinc-400 font-medium"
        >
          Cancelada
        </Badge>
      )
    case 'FAILED':
      return (
        <Badge
          variant="destructive"
          className="h-5 text-[10px] font-medium"
        >
          Falha
        </Badge>
      )
  }
}

export function DiscoveryHistoryPanel({
  searches,
  activeSearchId,
  onSelectSearch,
  onCancelSearch,
  onDeleteSearch,
  isCancelling = false,
  isDeleting = false,
}: DiscoveryHistoryPanelProps) {
  if (searches.length === 0) {
    return null
  }

  return (
    <Card className="p-4 bg-card/60 backdrop-blur-xs border-border/60">
      <div className="flex items-center gap-2 mb-3">
        <History className="size-4 text-primary" />
        <Typography
          variant="small"
          className="font-semibold"
        >
          Histórico de Buscas
        </Typography>
        <Badge
          variant="secondary"
          className="ml-auto text-[10px] font-mono"
        >
          {searches.length} salva{searches.length > 1 ? 's' : ''}
        </Badge>
      </div>

      <ScrollArea className="max-h-56">
        <div className="flex flex-col gap-1.5 pr-2">
          {searches.map((s) => {
            const isSelected = s.id === activeSearchId
            const isActive = s.status === 'QUEUED' || s.status === 'SEARCHING'

            return (
              <div
                key={s.id}
                onClick={() => onSelectSearch(s.id)}
                className={`group flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-primary/10 border-primary/40 text-foreground'
                    : 'bg-background/50 border-border/40 hover:bg-accent/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                  <Video className="size-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Typography
                        variant="small"
                        className="truncate font-medium text-foreground"
                      >
                        {s.query}
                      </Typography>
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1 py-0 uppercase font-mono shrink-0"
                      >
                        {s.platform}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {renderStatusBadge(s.status, s.total_found)}

                  {isActive ? (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      title="Cancelar busca"
                      disabled={isCancelling}
                      onClick={(e) => {
                        e.stopPropagation()
                        onCancelSearch(s.id)
                      }}
                      className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/20"
                    >
                      <StopCircle className="size-3.5" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      title="Excluir do histórico"
                      disabled={isDeleting}
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteSearch(s.id)
                      }}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </Card>
  )
}
