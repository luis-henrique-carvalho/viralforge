import { CheckCircle2, Cpu, RefreshCw, Sparkles, Terminal } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BatchStatusBadge } from './batch-status-badge'
import { ItemDetailCopyTab } from './item-detail-copy-tab'
import { ItemDetailTelemetryTab } from './item-detail-telemetry-tab'
import { ItemDetailLogsTab } from './item-detail-logs-tab'
import type { ViralItem } from '../data/batch.types'

interface ItemDetailSheetProps {
  item: ViralItem | null
  isOpen: boolean
  onClose: () => void
  onApprove?: (itemId: string) => void
  onRetry?: (itemId: string) => void
  isApproving?: boolean
  isRetrying?: boolean
}

export function ItemDetailSheet({
  item,
  isOpen,
  onClose,
  onApprove,
  onRetry,
  isApproving = false,
  isRetrying = false,
}: ItemDetailSheetProps) {
  if (!item) return null

  const aiCopy = item.ai_copy
  const logs = item.logs || []

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <SheetContent className="w-full sm:max-w-xl flex flex-col gap-0 p-0 overflow-hidden">
        <SheetHeader className="p-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between gap-2">
            <Badge
              variant="outline"
              className="font-mono text-xs"
            >
              {item.product_code ? `#${item.product_code}` : item.id}
            </Badge>
            <BatchStatusBadge status={item.status} />
          </div>
          <SheetTitle className="text-lg font-bold truncate text-foreground pt-1">
            {item.selected_headline || item.manual_headline || 'Inspeção de Vídeo'}
          </SheetTitle>
          <SheetDescription className="text-xs truncate font-mono">
            {item.source_url}
          </SheetDescription>
        </SheetHeader>

        <Tabs
          defaultValue="copy"
          className="flex-1 flex flex-col overflow-hidden min-h-0"
        >
          <div className="px-6 border-b border-border bg-muted/20 shrink-0">
            <TabsList className="w-full justify-start h-10 bg-transparent p-0 gap-4">
              <TabsTrigger
                value="copy"
                className="gap-1.5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-2 text-xs"
              >
                <Sparkles className="size-3.5" />
                Copy & Ganchos
              </TabsTrigger>
              <TabsTrigger
                value="telemetry"
                className="gap-1.5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-2 text-xs"
              >
                <Cpu className="size-3.5" />
                Telemetria IA
              </TabsTrigger>
              <TabsTrigger
                value="logs"
                className="gap-1.5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-2 text-xs"
              >
                <Terminal className="size-3.5" />
                Logs ({logs.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-6">
              <ItemDetailCopyTab
                item={item}
                aiCopy={aiCopy}
              />
              <ItemDetailTelemetryTab item={item} />
              <ItemDetailLogsTab item={item} />
            </div>
          </ScrollArea>
        </Tabs>

        <div className="p-4 border-t border-border bg-background flex items-center justify-end gap-2 shrink-0">
          {item.status === 'READY_FOR_REVIEW' && onApprove && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              onClick={() => onApprove(item.id)}
              disabled={isApproving}
            >
              <CheckCircle2 className="size-4" />
              {isApproving ? 'Aprovando...' : 'Aprovar Vídeo'}
            </Button>
          )}

          {item.status === 'FAILED' && onRetry && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive gap-1.5"
              onClick={() => onRetry(item.id)}
              disabled={isRetrying}
            >
              <RefreshCw className={`size-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Reenviando...' : 'Tentar Novamente'}
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Fechar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
