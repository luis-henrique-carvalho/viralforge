import { Scissors } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function ClipsView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Cortes 9:16 (Pipeline Tradicional)
        </h1>
        <Badge
          variant="secondary"
          className="text-xs"
        >
          Legado Otimizado
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Corte automático de podcasts, lives e vídeos longos com enquadramento dinâmico de
        interlocutor ativo.
      </p>

      <Card className="border-dashed border-border/80 bg-card/30 p-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
          <Scissors className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-foreground">Pipeline de Cortes</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
          Pronto para migração na Fase 5 com active speaker tracking e enquadramento YOLOv8 +
          MediaPipe.
        </p>
      </Card>
    </div>
  )
}
