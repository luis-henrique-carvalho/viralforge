import { useState } from 'react'
import { Terminal, FileText, Copy, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Typography } from '@/components/ui/typography'
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
        return `[${time}] [${stage}] ${String(log.message || '')}`
      })
      .join('\n')

    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    toast.success('Logs copiados para a área de transferência!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-border/60 bg-black/40">
      <CardHeader className="p-3 pb-2 flex-row items-center justify-between space-y-0 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-primary" />
          <CardTitle className="text-xs font-mono uppercase tracking-wider">
            Linha do Tempo de Observabilidade & Auditoria
          </CardTitle>
          <Badge
            variant="outline"
            className="text-[10px] font-mono h-4 px-1.5 py-0"
          >
            {logs.length} eventos
          </Badge>
        </div>

        {logs.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[11px] font-mono gap-1 text-muted-foreground hover:text-foreground"
            onClick={handleCopyLogs}
            title="Copiar logs em texto simples"
          >
            {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
            <span>{copied ? 'Copiado' : 'Copiar Logs'}</span>
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-3">
        {logs.length > 0 ? (
          <ScrollArea className="max-h-72 rounded bg-black/60 p-2 border border-white/5 font-mono text-[11px]">
            <div className="space-y-2">
              {logs.map((log, index) => {
                const isError =
                  String(log.level || '').toLowerCase() === 'error' ||
                  Boolean(log.error) ||
                  String(log.stage || '')
                    .toLowerCase()
                    .includes('fail')
                const isSuccess =
                  String(log.stage || '')
                    .toLowerCase()
                    .includes('success') ||
                  String(log.stage || '')
                    .toLowerCase()
                    .includes('ready') ||
                  String(log.stage || '')
                    .toLowerCase()
                    .includes('complete')

                const timeStr = log.timestamp
                  ? new Date(String(log.timestamp)).toLocaleTimeString()
                  : '--:--:--'
                const stageUpper = String(log.stage || '').toUpperCase()
                const hasDetails = Boolean(
                  log.details &&
                  typeof log.details === 'object' &&
                  Object.keys(log.details as object).length > 0,
                )

                const uniqueKey = log.timestamp
                  ? `${String(log.timestamp)}-${index}`
                  : `${String(log.stage || 'stage')}-${String(log.message || 'msg')}-${index}`

                return (
                  <div
                    key={uniqueKey}
                    className="flex flex-col gap-1 rounded p-1.5 transition-colors hover:bg-white/5 border border-transparent hover:border-white/5"
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

                    <Typography
                      variant={isError ? 'destructive' : 'muted'}
                      className="font-mono text-[11px] break-words"
                    >
                      {String(log.message || '')}
                    </Typography>

                    {hasDetails && (
                      <Card className="rounded bg-white/5 p-2 text-[10px] text-muted-foreground border border-white/5 shadow-none">
                        <pre className="font-mono whitespace-pre-wrap break-all text-[10px] text-muted-foreground/90 leading-tight">
                          {typeof log.details === 'object'
                            ? JSON.stringify(log.details, null, 2)
                            : String(log.details)}
                        </pre>
                      </Card>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
            <FileText className="size-6 opacity-40" />
            <Typography variant="muted">Nenhum log registrado para este item.</Typography>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
