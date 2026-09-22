import { FileText } from 'lucide-react'
import { TabsContent } from '@/components/ui/tabs'

export interface ItemDetailLogsTabProps {
  logs: Array<Record<string, any>>
}

export function ItemDetailLogsTab({ logs }: ItemDetailLogsTabProps) {
  return (
    <TabsContent
      value="logs"
      className="m-0 space-y-2"
    >
      {logs.length > 0 ? (
        <div className="rounded-lg border border-border bg-black/90 p-3 font-mono text-[11px] text-emerald-400 space-y-1">
          {logs.map((log, index) => (
            <div
              key={log.id || `${log.timestamp || 'log'}-${index}`}
              className="flex gap-2"
            >
              <span className="text-muted-foreground shrink-0">
                {log.timestamp || `[${index + 1}]`}
              </span>
              <span>{typeof log === 'string' ? log : log.message || JSON.stringify(log)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground text-xs">
          <FileText className="size-6 mx-auto mb-2 opacity-50" />
          Nenhum log gravado para este job.
        </div>
      )}
    </TabsContent>
  )
}
