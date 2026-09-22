import { Layers, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function ViralStudioView() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Viral Content Studio</h1>
            <Badge variant="secondary" className="gap-1 text-xs">
              <Sparkles className="h-3 w-3 text-primary" />
              Core Engine
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Ingestão em lote, detecção multissinal de hooks, transcrição local e renderização dinâmica 9:16.
          </p>
        </div>

        <Button className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Novo Lote
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card/60 backdrop-blur-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Lotes Processados</CardDescription>
            <CardTitle className="text-2xl font-bold">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Pronto para ingestão de vídeos</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Vídeos Renderizados</CardDescription>
            <CardTitle className="text-2xl font-bold">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Formatos 9:16 com legendas kinetic</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Ganchos Gerados</CardDescription>
            <CardTitle className="text-2xl font-bold">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Modelos Gemini & Ollama</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Motor Whisper Local</CardDescription>
            <CardTitle className="text-sm font-semibold text-emerald-500">Ativo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Roteamento dinâmico CPU/GPU</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State / Standby Card */}
      <Card className="border-dashed border-border/80 bg-card/30 p-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Layers className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-foreground">Nenhum lote criado ainda</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
          O shell da aplicação e a base arquitetural estão operacionais. A Fase 2 conectará este painel aos endpoints de lotes do backend.
        </p>
        <div className="mt-6">
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Primeiro Lote
          </Button>
        </div>
      </Card>
    </div>
  )
}
