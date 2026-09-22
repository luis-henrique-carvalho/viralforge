import { useState } from 'react'
import { Terminal, FileText, Copy, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { ViralItem } from '../data/batch.types'

interface TimelineViewProps {
  item: ViralItem
}

export function ObservabilityTimelineView({ item }: TimelineViewProps) {
  const [copied, setCopied] = useState(false)
  const logs = (item.logs || []) as Array<Record<string, unknown>>

  const handleCopyLogs = () => {
    if (!logs.length) return
    const textToCopy = logs
      .map((log) => {
        const time = log.timestamp
          ? new Date(String(log.timestamp)).toLocaleTimeString()
          : '--:--:--'
        const stage = String(log.stage || 'INFO').toUpperCase()
        const msg = String(log.message || '')
        const details =
          log.details && typeof log.details === 'object' && Object.keys(log.details).length > 0
            ? `\n${JSON.stringify(log.details, null, 2)}`
            : ''
        return `[${time}] [${stage}] ${msg}${details}`
      })
      .join('\n\n')

    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    toast.success('Logs copiados!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-border/80 bg-card/60">
      <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between space-y-0 gap-2">
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
          <Terminal className="size-3.5 text-amber-500" />
          <span>Linha do Tempo e Eventos</span>
        </CardTitle>
        {logs.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Badge
              variant="secondary"
              className="font-mono text-[10px] px-1.5 py-0"
            >
              {logs.length} eventos
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[10px] gap-1"
              onClick={handleCopyLogs}
              title="Copiar logs completos"
            >
              {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              <span>{copied ? 'Copiado' : 'Copiar Logs'}</span>
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-3 pt-0">
        {logs.length > 0 ? (
          <div className="max-h-[500px] overflow-y-auto rounded-md border border-border/80 bg-black/90 p-3 overscroll-contain">
            <div className="flex flex-col gap-2.5 font-mono text-xs">
              {logs.map((log, idx) => {
                const stageUpper = String(log.stage || '').toUpperCase()
                const isError =
                  log.level === 'error' ||
                  stageUpper === 'ERROR' ||
                  stageUpper === 'PUBLISH_ERROR' ||
                  stageUpper === 'FAILED'
                const isSuccess =
                  stageUpper === 'COMPLETE' ||
                  stageUpper === 'PUBLISHED' ||
                  stageUpper === 'APPROVE' ||
                  stageUpper === 'APPROVED' ||
                  stageUpper === 'RENDER_COMPLETE'

                const timeStr = log.timestamp
                  ? new Date(String(log.timestamp)).toLocaleTimeString()
                  : '--:--:--'

                const hasDetails =
                  Boolean(log.details) &&
                  typeof log.details === 'object' &&
                  Object.keys(log.details as object).length > 0

                const uniqueKey = log.timestamp
                  ? `${String(log.timestamp)}-${idx}`
                  : `${String(log.stage || 'stage')}-${String(log.message || 'msg')}-${idx}`

                return (
                  <div
                    key={uniqueKey}
                    className="flex flex-col gap-1.5 border-b border-border/20 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground/70 text-[11px] font-mono shrink-0">
                        [{timeStr}]
                      </span>
                      <Badge
                        variant={isError ? 'destructive' : isSuccess ? 'default' : 'secondary'}
                        className={`text-[10px] font-mono px-1.5 py-0 h-4 shrink-0 uppercase tracking-wide ${
                          isSuccess ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                        }`}
                      >
                        {stageUpper || 'INFO'}
                      </Badge>
                    </div>

                    <p
                      className={`text-[11px] leading-relaxed break-words font-mono ${
                        isError ? 'text-destructive font-medium' : 'text-foreground/90'
                      }`}
                    >
                      {String(log.message || '')}
                    </p>

                    {hasDetails && (
                      <div className="rounded bg-white/5 p-2 text-[10px] text-muted-foreground border border-white/5">
                        <pre className="font-mono whitespace-pre-wrap break-all text-[10px] text-muted-foreground/90 leading-tight">
                          {typeof log.details === 'object'
                            ? JSON.stringify(log.details, null, 2)
                            : String(log.details)}
                        </pre>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
            <FileText className="size-6 opacity-40" />
            <p className="text-xs">Nenhum log registrado para este item.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
