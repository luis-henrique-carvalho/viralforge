import { Plus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface DiscoveryFloatingBarProps {
  selectedCount: number
  onOpenDrawer: () => void
  onClearSelection: () => void
}

export function DiscoveryFloatingBar({
  selectedCount,
  onOpenDrawer,
  onClearSelection,
}: DiscoveryFloatingBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-zinc-900/95 text-white border border-zinc-700/80 shadow-2xl rounded-full px-5 py-2.5 backdrop-blur-md animate-in slide-in-from-bottom-5">
      <Badge
        variant="default"
        className="bg-primary text-primary-foreground font-bold px-2 py-0.5"
      >
        {selectedCount}
      </Badge>
      <span className="text-xs font-medium">
        {selectedCount} vídeo{selectedCount > 1 ? 's' : ''} selecionado
        {selectedCount > 1 ? 's' : ''}
      </span>

      <Button
        size="sm"
        onClick={onOpenDrawer}
        className="gap-1.5 h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-4"
      >
        <Plus className="size-3.5" />
        <span>Criar Lote ({selectedCount})</span>
      </Button>

      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onClearSelection}
        className="size-7 rounded-full text-zinc-400 hover:text-white"
        title="Limpar seleção"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  )
}
