import { Settings } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function SettingsView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Configurações & Provedores
        </h1>
        <Badge
          variant="outline"
          className="text-xs"
        >
          Sistema
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Gerenciamento de credenciais (Gemini, Deepgram, ElevenLabs), modelo local Ollama e cookies
        de sessão.
      </p>

      <Card className="border-dashed border-border/80 bg-card/30 p-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
          <Settings className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-foreground">Painel de Configurações</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
          Pronto para migração na Fase 5 com persistência segura em data/config.json.
        </p>
      </Card>
    </div>
  )
}
