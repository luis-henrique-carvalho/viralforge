import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { ViralItem } from '../data/batch.types'

interface TelemetryViewProps {
  item: ViralItem
}

export function ObservabilityTelemetryView({ item }: TelemetryViewProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCopy = (text: string, key: string, label: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success(`${label} copiado!`)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const telemetry = (item.ai_telemetry || {}) as Record<string, unknown>
  const logs = (item.logs || []) as Array<Record<string, unknown>>
  const routingLog = logs.find((l) => String(l.stage || '').toUpperCase() === 'AI_ROUTING')
  const routingDetails = routingLog?.details as Record<string, unknown> | undefined

  const modelUsed =
    (telemetry.model as string) ||
    (telemetry.model_used as string) ||
    item.model ||
    (routingDetails?.target_model as string) ||
    (routingDetails?.model as string) ||
    (item.status === 'READY_FOR_REVIEW' ? 'gemini-2.5-flash' : 'Padrão da Configuração')

  const promptTokens = telemetry.prompt_tokens != null ? Number(telemetry.prompt_tokens) : null
  const candidateTokens =
    telemetry.candidate_tokens != null ? Number(telemetry.candidate_tokens) : null
  const totalTokens =
    telemetry.total_tokens != null
      ? Number(telemetry.total_tokens)
      : promptTokens != null || candidateTokens != null
        ? (promptTokens || 0) + (candidateTokens || 0)
        : null

  const costRaw = telemetry.estimated_cost_usd ?? telemetry.cost_usd
  const estimatedCost = costRaw != null ? Number(costRaw) : null
  const latencyMs = telemetry.latency_ms != null ? Number(telemetry.latency_ms) : null

  const fullPrompt =
    typeof telemetry.prompt === 'string'
      ? telemetry.prompt
      : telemetry.prompt
        ? JSON.stringify(telemetry.prompt, null, 2)
        : ''

  const rawResponse =
    typeof telemetry.raw_response === 'string'
      ? telemetry.raw_response
      : telemetry.raw_response
        ? JSON.stringify(telemetry.raw_response, null, 2)
        : item.ai_copy
          ? JSON.stringify(item.ai_copy, null, 2)
          : ''

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Card className="border-border/80 bg-card/60 shadow-none">
          <CardContent className="p-2.5">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
              Modelo
            </span>
            <span className="text-xs font-semibold text-sky-500 break-all truncate block mt-0.5">
              {modelUsed}
            </span>
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/60 shadow-none">
          <CardContent className="p-2.5">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
              Prompt Tokens
            </span>
            <span className="text-sm font-bold text-foreground">
              {promptTokens != null ? promptTokens.toLocaleString() : '—'}
            </span>
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/60 shadow-none">
          <CardContent className="p-2.5">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
              Candidate Tokens
            </span>
            <span className="text-sm font-bold text-foreground">
              {candidateTokens != null ? candidateTokens.toLocaleString() : '—'}
            </span>
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/60 shadow-none">
          <CardContent className="p-2.5">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
              Total Tokens
            </span>
            <span className="text-sm font-bold text-primary">
              {totalTokens != null ? totalTokens.toLocaleString() : '—'}
            </span>
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/60 shadow-none">
          <CardContent className="p-2.5">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
              Custo Est. (USD)
            </span>
            <span className="text-sm font-bold text-emerald-500">
              {estimatedCost != null ? `$${estimatedCost.toFixed(5)}` : '—'}
            </span>
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/60 shadow-none">
          <CardContent className="p-2.5">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
              Latência
            </span>
            <span className="text-sm font-bold text-amber-500">
              {latencyMs != null ? `${latencyMs} ms` : '—'}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Prompt viewer */}
      <Card className="bg-card/60 border-border/80">
        <div className="p-3 pb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">Prompt Enviado à LLM</span>
          {fullPrompt && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[10px] gap-1"
              onClick={() => handleCopy(fullPrompt, 'prompt', 'Prompt')}
            >
              {copiedKey === 'prompt' ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-3" />
              )}
              <span>{copiedKey === 'prompt' ? 'Copiado' : 'Copiar'}</span>
            </Button>
          )}
        </div>
        <CardContent className="p-3 pt-0">
          <pre className="max-h-32 overflow-y-auto rounded-md border border-border/60 bg-black/90 p-2.5 font-mono text-[11px] text-foreground/90 whitespace-pre-wrap break-words">
            {fullPrompt || 'Prompt não registrado ou processamento ainda não iniciado.'}
          </pre>
        </CardContent>
      </Card>

      {/* Raw response viewer */}
      <Card className="bg-card/60 border-border/80">
        <div className="p-3 pb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">Resposta Bruta da IA (JSON)</span>
          {rawResponse && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[10px] gap-1"
              onClick={() => handleCopy(rawResponse, 'raw_response', 'JSON da resposta')}
            >
              {copiedKey === 'raw_response' ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-3" />
              )}
              <span>{copiedKey === 'raw_response' ? 'Copiado' : 'Copiar'}</span>
            </Button>
          )}
        </div>
        <CardContent className="p-3 pt-0">
          <pre className="max-h-32 overflow-y-auto rounded-md border border-border/60 bg-black/90 p-2.5 font-mono text-[11px] text-emerald-400 whitespace-pre-wrap break-words">
            {rawResponse || 'Resposta não registrada.'}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
