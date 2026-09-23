import { useState, useMemo } from 'react'
import { Terminal, FileText, Copy, Check, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Typography } from '@/components/ui/typography'
import { toast } from 'sonner'
import { TimelineLogItem } from './timeline-log-item'
import type { ViralItem } from '../data/batch.types'

interface TimelineViewProps {
  item: ViralItem
  className?: string
}

export function ObservabilityTimelineView({ item, className }: TimelineViewProps) {
  const [copied, setCopied] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'errors'>('all')

  const rawLogs = useMemo(() => {
    return (item.logs || []) as Array<Record<string, unknown>>
  }, [item.logs])

  const filteredLogs = useMemo(() => {
    return rawLogs.filter((log) => {
      const isError =
        String(log.level || '').toLowerCase() === 'error' ||
        Boolean(log.error) ||
        String(log.stage || '')
          .toLowerCase()
          .includes('fail')

      if (filterMode === 'errors' && !isError) {
        return false
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const msg = String(log.message || '').toLowerCase()
        const stage = String(log.stage || '').toLowerCase()
        const detailsStr = JSON.stringify(log.details || '').toLowerCase()
        return msg.includes(query) || stage.includes(query) || detailsStr.includes(query)
      }

      return true
    })
  }, [rawLogs, filterMode, searchQuery])

  const errorCount = useMemo(() => {
    return rawLogs.filter(
      (log) =>
        String(log.level || '').toLowerCase() === 'error' ||
        Boolean(log.error) ||
        String(log.stage || '')
          .toLowerCase()
          .includes('fail'),
    ).length
  }, [rawLogs])

  const handleCopyLogs = () => {
    if (!rawLogs.length) return
    const textToCopy = rawLogs
      .map((log) => {
        const time = log.timestamp
          ? new Date(String(log.timestamp)).toLocaleTimeString()
          : '--:--:--'
        const stage = String(log.stage || 'INFO').toUpperCase()
        const detailsStr = log.details ? `\nDetails: ${JSON.stringify(log.details, null, 2)}` : ''
        return `[${time}] [${stage}] ${String(log.message || '')}${detailsStr}`
      })
      .join('\n')

    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    toast.success('Logs copiados para a área de transferência!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card
      className={`border-border/70 bg-card/60 shadow-xs backdrop-blur-xs flex flex-col ${className || ''}`}
    >
      <CardHeader className="p-3.5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-primary" />
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Linha do Tempo de Observabilidade
          </CardTitle>
          <Badge
            variant="secondary"
            className="text-[10px] font-mono h-4 px-1.5 py-0"
          >
            {rawLogs.length} eventos
          </Badge>
          {errorCount > 0 && (
            <Badge
              variant="destructive"
              className="text-[10px] font-mono h-4 px-1.5 py-0"
            >
              {errorCount} {errorCount === 1 ? 'erro' : 'erros'}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {rawLogs.length > 5 && (
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
              <Input
                placeholder="Filtrar eventos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 w-36 pl-6 text-xs bg-background/50 font-mono"
              />
            </div>
          )}

          {errorCount > 0 && (
            <Button
              variant={filterMode === 'errors' ? 'destructive' : 'outline'}
              size="sm"
              className="h-7 px-2 text-xs font-mono"
              onClick={() => setFilterMode((prev) => (prev === 'all' ? 'errors' : 'all'))}
            >
              {filterMode === 'errors' ? 'Ver Todos' : `Apenas Erros (${errorCount})`}
            </Button>
          )}

          {rawLogs.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs font-mono gap-1 text-muted-foreground hover:text-foreground"
              onClick={handleCopyLogs}
              title="Copiar logs formatados"
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Copy className="size-3.5" />
              )}
              <span>{copied ? 'Copiado' : 'Copiar Logs'}</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3 flex-1 flex flex-col min-h-0">
        {filteredLogs.length > 0 ? (
          <ScrollArea className="h-[460px] max-h-[460px] w-full rounded-lg bg-background/60 p-3 border border-border/50 font-mono text-xs">
            <div className="relative pl-3 space-y-3.5 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-px before:bg-border/60">
              {filteredLogs.map((log, index) => {
                const uniqueKey = log.timestamp
                  ? `${String(log.timestamp)}-${index}`
                  : `${String(log.stage || 'INFO')}-${String(log.message || '')}-${index}`

                return (
                  <TimelineLogItem
                    key={uniqueKey}
                    log={log}
                  />
                )
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground gap-2">
            <FileText className="size-6 opacity-40" />
            <Typography
              variant="muted"
              className="text-xs"
            >
              {rawLogs.length === 0
                ? 'Nenhum log registrado para este item.'
                : 'Nenhum evento correspondente aos filtros aplicados.'}
            </Typography>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
