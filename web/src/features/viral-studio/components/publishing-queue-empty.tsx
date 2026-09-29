import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'

export interface PublishingQueueEmptyProps {
  selectedStatus: string
  onResetFilter: () => void
}

export function PublishingQueueEmpty({ selectedStatus, onResetFilter }: PublishingQueueEmptyProps) {
  return (
    <Card className="p-12 text-center border-dashed bg-card/40 flex flex-col items-center justify-center gap-3">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted/60 border border-border">
        <Send className="size-6 text-muted-foreground/70" />
      </div>
      <div className="flex flex-col gap-1 max-w-md">
        <Typography
          variant="h4"
          className="font-semibold tracking-tight"
        >
          Nenhum envio encontrado
        </Typography>
        <Typography
          variant="muted"
          className="text-xs sm:text-sm leading-relaxed"
        >
          {selectedStatus === 'ALL'
            ? 'Quando você agendar ou publicar vídeos no Viral Studio, o acompanhamento assíncrono e os logs detalhados aparecerão aqui em tempo real.'
            : `Nenhum disparo com status "${selectedStatus}" foi encontrado na fila.`}
        </Typography>
      </div>
      {selectedStatus !== 'ALL' && (
        <Button
          variant="outline"
          size="sm"
          onClick={onResetFilter}
          className="text-xs mt-1"
        >
          Ver todos os envios
        </Button>
      )}
    </Card>
  )
}
