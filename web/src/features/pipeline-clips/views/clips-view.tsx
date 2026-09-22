import { Scissors } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'

export function ClipsView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Typography variant="h2">Cortes 9:16 (Pipeline Tradicional)</Typography>
        <Badge
          variant="secondary"
          className="text-xs"
        >
          Legado Otimizado
        </Badge>
      </div>
      <Typography variant="muted">
        Corte automático de podcasts, lives e vídeos longos com enquadramento dinâmico de
        interlocutor ativo.
      </Typography>

      <Card className="border-dashed border-border/80 bg-card/30 p-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
          <Scissors className="h-7 w-7" />
        </div>
        <Typography variant="h3">Pipeline de Cortes</Typography>
        <Typography variant="muted">
          Pronto para migração na Fase 5 com active speaker tracking e enquadramento YOLOv8 +
          MediaPipe.
        </Typography>
      </Card>
    </div>
  )
}
