import { Compass } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'

export function DiscoveryView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Typography variant="h2">Descoberta Multiplataforma</Typography>
        <Badge
          variant="outline"
          className="text-xs"
        >
          TikTok · Instagram · YouTube
        </Badge>
      </div>
      <Typography variant="muted">
        Minerador de tendências por palavras-chave, hashtags e criadores com algoritmo de viral
        scoring.
      </Typography>

      <Card className="border-dashed border-border/80 bg-card/30 p-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
          <Compass className="h-7 w-7" />
        </div>
        <Typography variant="h3">Módulo de Descoberta</Typography>
        <Typography variant="muted">
          Pronto para integração na Fase 4 com busca cruzada e importação direta em lote.
        </Typography>
      </Card>
    </div>
  )
}
