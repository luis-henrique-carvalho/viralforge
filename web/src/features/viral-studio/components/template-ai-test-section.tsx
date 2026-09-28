import { useState } from 'react'
import { AlertCircle, CheckCircle2, Play, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Typography } from '@/components/ui/typography'
import { useTestTemplateGeneration } from '../hooks/use-templates'
import type { TestGenerationResponse, VisualTemplate } from '../data/template.types'

interface TemplateAiTestSectionProps {
  template: VisualTemplate
}

const DEFAULT_SAMPLE_TRANSCRIPT =
  'Você sabia que o polvo tem três corações e o sangue dele é azul? Além disso, dois corações param de bater completamente quando ele nada!'

export function TemplateAiTestSection({ template }: TemplateAiTestSectionProps) {
  const [sampleTranscript, setSampleTranscript] = useState(DEFAULT_SAMPLE_TRANSCRIPT)
  const [result, setResult] = useState<TestGenerationResponse | null>(null)

  const testMutation = useTestTemplateGeneration()

  const handleRunTest = async () => {
    try {
      const res = await testMutation.mutateAsync({
        template,
        sample_transcript: sampleTranscript,
      })
      setResult(res)
    } catch {
      // Handled by mutation toast
    }
  }

  const generatedCopy = (result?.copy || {}) as Record<string, unknown>
  const headlines = Array.isArray(generatedCopy.headlines)
    ? (generatedCopy.headlines as string[])
    : Array.isArray(generatedCopy.headline)
      ? (generatedCopy.headline as string[])
      : []
  const caption = (generatedCopy.caption as string) || ''
  const telemetry = result?.telemetry || {}

  return (
    <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <Typography
            variant="small"
            className="font-semibold text-foreground"
          >
            Testar Geração em Tempo Real
          </Typography>
        </div>
        <Button
          size="sm"
          onClick={handleRunTest}
          disabled={testMutation.isPending}
          className="h-8 gap-1.5 text-xs font-semibold"
        >
          <Play className="h-3.5 w-3.5" />
          {testMutation.isPending ? 'Sintetizando...' : 'Executar Teste'}
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Transcrição de Amostra para o Teste</Label>
        <Textarea
          value={sampleTranscript}
          onChange={(e) => setSampleTranscript(e.target.value)}
          rows={2}
          className="text-xs resize-none bg-background/80"
          placeholder="Cole aqui uma transcrição de teste..."
        />
      </div>

      {result && (
        <Card className="border-border bg-card">
          <CardContent className="space-y-3 p-3 pt-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-1.5 text-emerald-500">
                <CheckCircle2 className="h-4 w-4" />
                <Typography
                  variant="small"
                  className="font-semibold text-emerald-600 dark:text-emerald-400"
                >
                  Resposta Sintetizada com Sucesso
                </Typography>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span>{String(telemetry.latency_ms || 0)}ms</span>
                <span>•</span>
                <span>{String(telemetry.total_tokens || 0)} tokens</span>
              </div>
            </div>

            {headlines.length > 0 && (
              <div className="space-y-1">
                <Typography
                  variant="small"
                  className="text-xs font-semibold"
                >
                  Headlines Geradas ({headlines.length}):
                </Typography>
                <div className="space-y-1 pl-2">
                  {headlines.slice(0, 5).map((h, i) => (
                    <div
                      key={h}
                      className="flex items-start gap-1.5 text-xs"
                    >
                      <Badge
                        variant="outline"
                        className="h-4 px-1 text-[10px]"
                      >
                        {i + 1}
                      </Badge>
                      <span className="text-foreground">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {caption && (
              <div className="space-y-1">
                <Typography
                  variant="small"
                  className="text-xs font-semibold"
                >
                  Legenda Formatada:
                </Typography>
                <Typography
                  variant="muted"
                  className="rounded border border-border/50 bg-muted/30 p-2 whitespace-pre-wrap block text-xs"
                >
                  {caption}
                </Typography>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {testMutation.isError && (
        // shadcn-ignore: layout
        <div className="flex items-center gap-2 rounded border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Erro: {testMutation.error.message}</span>
        </div>
      )}
    </div>
  )
}
