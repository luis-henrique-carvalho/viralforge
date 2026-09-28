// shadcn-ignore: view orchestrator delegating to subcomponents
import { useState, useMemo } from 'react'
import { useBatchDetail } from '../hooks/use-batch-detail'
import { useBrands } from '../hooks/use-brands'
import { useApproveItem, useBulkItemActions, useRetryItem } from '../hooks/use-item-actions'
import { useCancelSchedule } from '../hooks/use-publishing'
import { BatchResultsHeader } from '../components/batch-results-header'
import { BatchFilterToolbar } from '../components/batch-filter-toolbar'
import { ItemCard } from '../components/item-card'
import { ItemDetailSheet } from '../components/item-detail-sheet'
import { BulkActionsBar } from '../components/bulk-actions-bar'
import { ViralPublishDialog } from '../components/viral-publish-dialog'
import { BatchResultsSkeleton } from '../components/batch-results-skeleton'
import { BatchResultsNotFound } from '../components/batch-results-not-found'
import { BatchResultsEmpty } from '../components/batch-results-empty'
import type { ViralItem } from '../data/batch.types'

interface BatchResultsViewProps {
  batchId: string
}

export function BatchResultsView({ batchId }: BatchResultsViewProps) {
  const { data: batch, isLoading, error } = useBatchDetail(batchId)
  const { data: brandsData } = useBrands()
  const allBrands = useMemo(() => brandsData?.brands || [], [brandsData?.brands])

  const approveMutation = useApproveItem(batchId)
  const retryMutation = useRetryItem(batchId)
  const cancelScheduleMutation = useCancelSchedule(batchId)
  const { bulkApprove, bulkRetry, isProcessing: isBulkProcessing } = useBulkItemActions(batchId)

  const [activeTab, setActiveTab] = useState<
    'all' | 'ready' | 'processing' | 'failed' | 'scheduled'
  >('all')
  const [selectedBrandId, setSelectedBrandId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [inspectedItemId, setInspectedItemId] = useState<string | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [publishingItems, setPublishingItems] = useState<ViralItem[]>([])
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false)

  const items = useMemo(() => batch?.items || [], [batch?.items])
  const inspectedItem = useMemo(
    () => items.find((i) => i.id === inspectedItemId) || null,
    [items, inspectedItemId],
  )

  const availableBrands = useMemo(() => {
    const brandIdsInBatch = new Set(items.map((i) => i.brand_id).filter(Boolean))
    return allBrands.filter((b) => brandIdsInBatch.has(b.id))
  }, [items, allBrands])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedBrandId !== 'all' && item.brand_id !== selectedBrandId) {
        return false
      }

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
      if (activeTab === 'scheduled' && !['SCHEDULED', 'PUBLISHED'].includes(item.status))
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
  }, [items, selectedBrandId, activeTab, searchQuery])

  const handleToggleSelect = (itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  const handlePublishSingle = (item: ViralItem) => {
    setPublishingItems([item])
    setIsPublishDialogOpen(true)
  }

  const approvedSelectedItems = useMemo(
    () => items.filter((i) => selectedIds.has(i.id) && i.status === 'APPROVED'),
    [items, selectedIds],
  )

  const handleBulkPublish = () => {
    if (approvedSelectedItems.length > 0) {
      setPublishingItems(approvedSelectedItems)
      setIsPublishDialogOpen(true)
    }
  }

  if (isLoading) return <BatchResultsSkeleton />
  if (error || !batch) {
    return (
      <BatchResultsNotFound
        batchId={batchId}
        errorMessage={error?.message}
      />
    )
  }

  const readyTotal = items.filter((i) =>
    ['READY_FOR_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED'].includes(i.status),
  ).length
  const scheduledTotal = items.filter((i) => ['SCHEDULED', 'PUBLISHED'].includes(i.status)).length
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
        scheduledCount={scheduledTotal}
        processingCount={processingTotal}
        failedCount={failedTotal}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedBrandId={selectedBrandId}
        onBrandChange={setSelectedBrandId}
        availableBrands={availableBrands}
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
              onPublish={handlePublishSingle}
              onCancelSchedule={(id) => cancelScheduleMutation.mutate(id)}
              isApproving={approveMutation.isPending}
              isRetrying={retryMutation.isPending}
              isCancelling={cancelScheduleMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <BatchResultsEmpty searchQuery={searchQuery} />
      )}

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
        approvedCount={approvedSelectedItems.length}
        onSelectAll={() => setSelectedIds(new Set(filteredItems.map((i) => i.id)))}
        onClearSelection={() => setSelectedIds(new Set())}
        onBulkApprove={() => bulkApprove(Array.from(selectedIds))}
        onBulkRetry={() => bulkRetry(Array.from(selectedIds))}
        onBulkPublish={approvedSelectedItems.length > 0 ? handleBulkPublish : undefined}
        isProcessing={isBulkProcessing}
      />

      <ViralPublishDialog
        isOpen={isPublishDialogOpen}
        onClose={() => setIsPublishDialogOpen(false)}
        items={publishingItems}
        batchId={batchId}
        onPublished={() => {
          setSelectedIds(new Set())
        }}
      />
    </div>
  )
}
