import { Film } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'

export interface BatchResultsEmptyProps {
  searchQuery: string
}

export function BatchResultsEmpty({ searchQuery }: BatchResultsEmptyProps) {
  return (
    <Card className="border-dashed border-border/80 bg-card/30 p-12 text-center space-y-2">
      <Film className="size-8 text-muted-foreground mx-auto opacity-50" />
      <Typography variant="h4">Nenhum vídeo encontrado</Typography>
      <Typography variant="muted">
        {searchQuery
          ? 'Nenhum vídeo corresponde à busca informada.'
          : 'Nenhum item com este filtro de status.'}
      </Typography>
    </Card>
  )
}
