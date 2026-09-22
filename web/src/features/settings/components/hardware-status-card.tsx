import { Cpu, Zap, HardDrive, Activity, RefreshCw } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useSettings } from '../hooks/use-settings'

export function HardwareStatusCard() {
  const { hardware, hardwareQuery } = useSettings()

  const handleRefresh = async () => {
    await hardwareQuery.refetch()
  }

  const isGpuActive = Boolean(hardware?.cuda_available)

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Aceleração de Hardware & Telemetria</CardTitle>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={hardwareQuery.isFetching}
            className="gap-1.5 text-xs"
          >
            <RefreshCw
              className={hardwareQuery.isFetching ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'}
            />
            Sondar Host
          </Button>
        </div>
        <CardDescription>
          Diagnóstico do host computacional, memória VRAM/RAM e geometria de execução do Whisper.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Motor / Backend */}
          <Card className="bg-card/40 border-border/60 p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Aceleração Ativa</span>
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold tracking-tight text-foreground">
                {hardware?.backend || 'CPU'}
              </div>
              <div className="flex items-center gap-1.5">
                {isGpuActive ? (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium"
                  >
                    GPU Acelerada
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[10px] text-muted-foreground font-medium"
                  >
                    Modo CPU
                  </Badge>
                )}
              </div>
            </div>
          </Card>

          {/* Dispositivo GPU */}
          <Card className="bg-card/40 border-border/60 p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Dispositivo Computacional</span>
              <Cpu className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <div
                className="text-sm font-semibold truncate text-foreground"
                title={hardware?.device_name}
              >
                {hardware?.device_name || 'CPU Host'}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isGpuActive ? `${hardware?.vram_gb} GB VRAM Dedicada` : 'Sem GPU dedicada'}
              </p>
            </div>
          </Card>

          {/* Memória RAM */}
          <Card className="bg-card/40 border-border/60 p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Memória do Sistema</span>
              <HardDrive className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold tracking-tight text-foreground">
                {hardware?.total_ram_gb || 0} GB
              </div>
              <p className="text-[11px] text-muted-foreground">RAM Física Instalada</p>
            </div>
          </Card>

          {/* Whisper Resolution */}
          <Card className="bg-card/40 border-border/60 p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Whisper STT Auto</span>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold tracking-tight text-foreground capitalize">
                {hardware?.whisper_model || 'base'}
              </div>
              <div className="flex items-center gap-1">
                <Badge
                  variant="secondary"
                  className="text-[10px] uppercase font-mono"
                >
                  {hardware?.whisper_device || 'cpu'}
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Informative Hardware Rules Callout */}
        <Alert className="bg-muted/40 border-dashed">
          <Activity className="h-4 w-4 text-primary" />
          <AlertTitle className="text-sm font-semibold">
            Política de Dimensionamento Dinâmico
          </AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground mt-1 leading-relaxed space-y-1">
            <p>
              • <b>Com APIs de Nuvem (Gemini):</b> O Whisper roda na GPU escalando pelo tamanho da
              VRAM (≥12GB: large-v3, ≥6GB: medium, &lt;6GB: small).
            </p>
            <p>
              • <b>Com LLMs Locais (LM Studio / Ollama):</b> O Whisper é alocado automaticamente na
              CPU para evitar contenção de VRAM e esgotamento de memória gráfica.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
