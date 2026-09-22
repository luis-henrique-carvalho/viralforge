import { useState, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Film, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useBatchDetail } from '../hooks/use-batch-detail'
import { useApproveItem, useBulkItemActions, useRetryItem } from '../hooks/use-item-actions'
import { BatchResultsHeader } from '../components/batch-results-header'
import { BatchFilterToolbar } from '../components/batch-filter-toolbar'
import { ItemCard } from '../components/item-card'
import { ItemDetailSheet } from '../components/item-detail-sheet'
import { BulkActionsBar } from '../components/bulk-actions-bar'

interface BatchResultsViewProps {
  batchId: string
}

export function BatchResultsView({ batchId }: BatchResultsViewProps) {
  const { data: batch, isLoading, error } = useBatchDetail(batchId)

  const approveMutation = useApproveItem(batchId)
  const retryMutation = useRetryItem(batchId)
  const { bulkApprove, bulkRetry, isProcessing: isBulkProcessing } = useBulkItemActions(batchId)

  const [activeTab, setActiveTab] = useState<'all' | 'ready' | 'processing' | 'failed'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [inspectedItemId, setInspectedItemId] = useState<string | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const items = useMemo(() => batch?.items || [], [batch?.items])
  const inspectedItem = useMemo(
    () => items.find((i) => i.id === inspectedItemId) || null,
    [items, inspectedItemId],
  )

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (
        activeTab === 'ready' &&
        !['READY_FOR_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED'].includes(item.status)
      )
        return false
      if (
        activeTab === 'processing' &&
        !['PENDING', 'DOWNLOADING', 'ANALYZING', 'RENDERING'].includes(item.status)
      )
        return false
      if (activeTab === 'failed' && !['FAILED', 'CANCELLED'].includes(item.status)) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        return Boolean(
          item.product_code?.toLowerCase().includes(q) ||
          (item.selected_headline || item.manual_headline || '').toLowerCase().includes(q) ||
          item.ai_copy?.selected_headline?.toLowerCase().includes(q) ||
          item.caption?.toLowerCase().includes(q) ||
          item.source_url.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q),
        )
      }
      return true
    })
  }, [items, activeTab, searchQuery])

  const handleToggleSelect = (itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 flex-1" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 items-start">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton
              key={n}
              className="h-96 rounded-xl"
            />
          ))}
        </div>
      </div>
    )
  }

  if (error || !batch) {
    return (
      <Card className="p-12 text-center border-destructive/30 bg-destructive/5 space-y-4">
        <XCircle className="size-10 text-destructive mx-auto" />
        <div>
          <h2 className="text-lg font-bold text-foreground">Lote não encontrado</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {error?.message || `Não foi possível carregar os detalhes do lote #${batchId}.`}
          </p>
        </div>
        <Button
          asChild
          variant="outline"
        >
          <Link to="/viral-studio">
            <ArrowLeft className="size-4 mr-2" />
            Voltar aos Lotes
          </Link>
        </Button>
      </Card>
    )
  }

  const readyTotal = items.filter((i) =>
    ['READY_FOR_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED'].includes(i.status),
  ).length
  const processingTotal = items.filter((i) =>
    ['PENDING', 'DOWNLOADING', 'ANALYZING', 'RENDERING'].includes(i.status),
  ).length
  const failedTotal = items.filter((i) => ['FAILED', 'CANCELLED'].includes(i.status)).length

  return (
    <div className="space-y-6 pb-20">
      <BatchResultsHeader
        batch={batch}
        isSelectionMode={isSelectionMode}
        onToggleSelectionMode={() => setIsSelectionMode((prev) => !prev)}
        selectedCount={selectedIds.size}
      />

      <BatchFilterToolbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalCount={items.length}
        readyCount={readyTotal}
        processingCount={processingTotal}
        failedCount={failedTotal}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {filteredItems.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 items-start">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              batchId={batchId}
              isSelected={selectedIds.has(item.id)}
              isSelectable={isSelectionMode}
              onToggleSelect={handleToggleSelect}
              onInspect={(i) => setInspectedItemId(i.id)}
              onApprove={(id) => approveMutation.mutate(id)}
              onRetry={(id) => retryMutation.mutate(id)}
              isApproving={approveMutation.isPending}
              isRetrying={retryMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-border/80 bg-card/30 p-12 text-center space-y-2">
          <Film className="size-8 text-muted-foreground mx-auto opacity-50" />
          <h3 className="text-sm font-semibold text-foreground">Nenhum vídeo encontrado</h3>
          <p className="text-xs text-muted-foreground">
            {searchQuery
              ? 'Nenhum vídeo corresponde à busca informada.'
              : 'Nenhum item com este filtro de status.'}
          </p>
        </Card>
      )}

      {/* Quick Inspection Sheet for Logs */}
      <ItemDetailSheet
        item={inspectedItem}
        isOpen={Boolean(inspectedItemId)}
        onClose={() => setInspectedItemId(null)}
        onApprove={(id) => approveMutation.mutate(id)}
        onRetry={(id) => retryMutation.mutate(id)}
        isApproving={approveMutation.isPending}
        isRetrying={retryMutation.isPending}
      />

      <BulkActionsBar
        selectedCount={selectedIds.size}
        totalCount={filteredItems.length}
        onSelectAll={() => setSelectedIds(new Set(filteredItems.map((i) => i.id)))}
        onClearSelection={() => setSelectedIds(new Set())}
        onBulkApprove={() => bulkApprove(Array.from(selectedIds))}
        onBulkRetry={() => bulkRetry(Array.from(selectedIds))}
        isProcessing={isBulkProcessing}
      />
    </div>
  )
}
