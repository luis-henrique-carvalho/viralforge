import { Film } from 'lucide-react'
import { Card } from '@/components/ui/card'

export interface BatchResultsEmptyProps {
  searchQuery: string
}

export function BatchResultsEmpty({ searchQuery }: BatchResultsEmptyProps) {
  return (
    <Card className="border-dashed border-border/80 bg-card/30 p-12 text-center space-y-2">
      <Film className="size-8 text-muted-foreground mx-auto opacity-50" />
      <h3 className="text-sm font-semibold text-foreground">Nenhum vídeo encontrado</h3>
      <p className="text-xs text-muted-foreground">
        {searchQuery
          ? 'Nenhum vídeo corresponde à busca informada.'
          : 'Nenhum item com este filtro de status.'}
      </p>
    </Card>
  )
}
