import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Download,
  Film,
  Sparkles,
  Terminal,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'

export function getStageBadgeConfig(stage: string, isError: boolean, isSuccess: boolean) {
  const upper = stage.toUpperCase()

  if (isError) {
    return {
      label: upper,
      className: 'bg-destructive/15 text-destructive border-destructive/30',
      icon: AlertCircle,
    }
  }

  if (isSuccess) {
    return {
      label: upper,
      className: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
      icon: CheckCircle2,
    }
  }

  if (upper.includes('DOWNLOAD')) {
    return {
      label: upper,
      className: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      icon: Download,
    }
  }

  if (upper.includes('ANALYZ') || upper.includes('CONTEXT')) {
    return {
      label: upper,
      className: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      icon: Cpu,
    }
  }

  if (upper.includes('COPY') || upper.includes('AI')) {
    return {
      label: upper,
      className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      icon: Sparkles,
    }
  }

  if (upper.includes('RENDER')) {
    return {
      label: upper,
      className: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      icon: Film,
    }
  }

  return {
    label: upper || 'INFO',
    className: 'bg-muted text-muted-foreground border-border/60',
    icon: Terminal,
  }
}

interface TimelineLogItemProps {
  log: Record<string, unknown>
}

export function TimelineLogItem({ log }: TimelineLogItemProps) {
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

  const timeStr = log.timestamp ? new Date(String(log.timestamp)).toLocaleTimeString() : '--:--:--'
  const stageStr = String(log.stage || 'INFO')
  const badgeConfig = getStageBadgeConfig(stageStr, isError, isSuccess)
  const StageIcon = badgeConfig.icon

  const hasDetails = Boolean(
    log.details && typeof log.details === 'object' && Object.keys(log.details as object).length > 0,
  )

  const detailsKeyCount = hasDetails ? Object.keys(log.details as object).length : 0

  return (
    <div
      className={`relative flex flex-col gap-1 rounded-md p-2 transition-colors border ${
        isError
          ? 'bg-destructive/5 border-destructive/20 hover:bg-destructive/10'
          : 'bg-card/40 border-border/40 hover:bg-muted/30'
      }`}
    >
      {/* Timeline bullet */}
      <span
        className={`absolute -left-[17px] top-3 size-2 rounded-full ring-2 ring-background ${
          isError
            ? 'bg-destructive ring-destructive/20'
            : isSuccess
              ? 'bg-emerald-500'
              : 'bg-primary/70'
        }`}
      />

      {/* Stage and Time */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground/70 text-[11px] font-mono shrink-0">[{timeStr}]</span>
        <Badge
          variant="outline"
          className={`text-[10px] font-mono px-1.5 py-0 h-4 shrink-0 uppercase tracking-wide gap-1 font-semibold ${badgeConfig.className}`}
        >
          <StageIcon className="size-2.5" />
          {badgeConfig.label}
        </Badge>
      </div>

      {/* Main Log Message */}
      <Typography
        variant={isError ? 'destructive' : 'small'}
        className="font-mono text-xs break-words font-medium leading-relaxed"
      >
        {String(log.message || '')}
      </Typography>

      {/* Collapsible JSON details */}
      {hasDetails && (
        <details
          className="group mt-1 rounded bg-black/40 border border-border/40 text-[11px]"
          open={isError}
        >
          <summary className="cursor-pointer select-none px-2 py-1 flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-mono text-[10px] transition-colors list-none">
            <ChevronRight className="size-3 transition-transform group-open:rotate-90 text-primary shrink-0" />
            <span className="font-semibold text-foreground/80">Payload de Execução</span>
            <span className="text-muted-foreground/60">({detailsKeyCount} campos)</span>
          </summary>
          <div className="p-2 pt-0 border-t border-border/20 overflow-x-auto">
            <pre className="font-mono text-[10px] text-muted-foreground leading-tight p-1 bg-black/30 rounded mt-1 whitespace-pre-wrap break-all">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          </div>
        </details>
      )}
    </div>
  )
}
