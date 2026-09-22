import { Terminal, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import type { ViralItem } from '../data/batch.types'

interface TimelineViewProps {
  item: ViralItem
}

export function ObservabilityTimelineView({ item }: TimelineViewProps) {
  const logs = (item.logs || []) as Array<Record<string, unknown>>

  return (
    <Card className="border-border/80 bg-card/60">
      <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
          <Terminal className="size-3.5 text-amber-500" />
          <span>Linha do Tempo e Eventos</span>
        </CardTitle>
        {logs.length > 0 && (
          <Badge
            variant="secondary"
            className="font-mono text-[10px] px-1.5 py-0"
          >
            {logs.length} eventos
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-3 pt-0">
        {logs.length > 0 ? (
          <ScrollArea className="h-72 rounded-md border border-border/80 bg-black/90 p-3">
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
                    className="flex flex-col gap-1 border-b border-border/20 pb-2 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="text-muted-foreground/70 shrink-0">[{timeStr}]</span>
                      <Badge
                        variant={isError ? 'destructive' : isSuccess ? 'default' : 'secondary'}
                        className={`text-[10px] font-mono px-1.5 py-0 h-4 shrink-0 ${
                          isSuccess ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                        }`}
                      >
                        {stageUpper || 'INFO'}
                      </Badge>
                      <span
                        className={`break-all ${
                          isError ? 'text-destructive font-medium' : 'text-foreground/90'
                        }`}
                      >
                        {String(log.message || '')}
                      </span>
                    </div>
                    {hasDetails && (
                      <pre className="ml-4 rounded bg-white/5 p-2 text-[10px] text-muted-foreground overflow-x-auto border border-white/5">
                        {typeof log.details === 'object'
                          ? JSON.stringify(log.details, null, 2)
                          : String(log.details)}
                      </pre>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
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
