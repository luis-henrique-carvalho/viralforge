import { Compass } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function DiscoveryView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Descoberta Multiplataforma</h1>
        <Badge variant="outline" className="text-xs">TikTok · Instagram · YouTube</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Minerador de tendências por palavras-chave, hashtags e criadores com algoritmo de viral scoring.
      </p>

      <Card className="border-dashed border-border/80 bg-card/30 p-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
          <Compass className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-foreground">Módulo de Descoberta</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
          Pronto para integração na Fase 4 com busca cruzada e importação direta em lote.
        </p>
      </Card>
    </div>
  )
}
