import { Loader2 } from 'lucide-react'

type StatCellTone = 'neutral' | 'success' | 'warning' | 'danger' | 'muted'

interface StatCellProps {
  label: string
  value: string | number
  sub?: string
  tone?: StatCellTone
  spinner?: boolean
  spinning?: boolean
}

const toneStyles: Record<StatCellTone, { bar: string; value: string }> = {
  neutral: { bar: 'bg-primary/70', value: 'text-foreground' },
  success: { bar: 'bg-emerald-500', value: 'text-foreground' },
  warning: { bar: 'bg-amber-500', value: 'text-foreground' },
  danger: { bar: 'bg-destructive', value: 'text-destructive' },
  muted: { bar: 'bg-border', value: 'text-muted-foreground/60' },
}

export function StatCell({
  label,
  value,
  sub,
  tone = 'neutral',
  spinner,
  spinning,
}: StatCellProps) {
  const styles = toneStyles[tone]
  return (
    <div className="flex flex-col min-w-0">
      <div className={`h-0.5 w-full ${styles.bar}`} />
      <div className="flex flex-col gap-1 px-5 py-4 sm:py-5 min-w-0">
        <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest truncate select-none">
          {label}
        </span>
        <span
          className={`text-3xl sm:text-4xl font-bold tracking-tight leading-none tabular-nums ${styles.value}`}
        >
          {value}
          {spinner && (
            <Loader2
              className={`inline-block ml-1.5 size-4 align-middle transition-opacity ${
                spinning ? 'animate-spin text-amber-500' : 'opacity-20 text-muted-foreground'
              }`}
            />
          )}
        </span>
        {sub && <span className="text-[11px] text-muted-foreground truncate">{sub}</span>}
      </div>
    </div>
  )
}
