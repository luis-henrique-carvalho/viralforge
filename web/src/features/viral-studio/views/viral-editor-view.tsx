import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useBatchDetail } from '../hooks/use-batch-detail'
import { useBrand, useTemplate } from '../hooks/use-brands'
import { useApproveItem } from '../hooks/use-item-actions'
import { useItemEditor } from '../hooks/use-item-editor'
import { useEditorNavigation } from '../hooks/use-editor-navigation'
import { ViralEditorTopbar } from '../components/viral-editor-topbar'
import { ViralEditorBottomBar } from '../components/viral-editor-bottom-bar'
import { ViralEditorPreview } from '../components/viral-editor-preview'
import { ViralEditorTabsSection } from '../components/viral-editor-tabs-section'
import { UnsavedChangesDialog } from '../components/unsaved-changes-dialog'
import type { ViralItem } from '../data/batch.types'

interface ViralEditorViewProps {
  batchId: string
  itemId: string
}

const fallbackItem: ViralItem = {
  id: '',
  source_url: '',
  status: 'PENDING',
  keyframe_urls: [],
  logs: [],
  publication_records: [],
  created_at: '',
  updated_at: '',
}

export function ViralEditorView({ batchId, itemId }: ViralEditorViewProps) {
  const { data: batch, isLoading, error } = useBatchDetail(batchId)
  const { data: brand } = useBrand(batch?.brand_id || '')
  const { data: template } = useTemplate(batch?.template_id || '')
  const approveMutation = useApproveItem(batchId)

  const items = useMemo(() => batch?.items || [], [batch?.items])
  const item = useMemo(() => items.find((i) => i.id === itemId) || null, [items, itemId])

  const [activeTab, setActiveTab] = useState<string>('headlines')
  const prevItemIdRef = useRef(itemId)

  // Ao trocar de item/vídeo, reseta para headlines (ou observability se o item estiver com erro)
  useEffect(() => {
    if (prevItemIdRef.current !== itemId) {
      prevItemIdRef.current = itemId
      setActiveTab(item?.status === 'FAILED' ? 'observability' : 'headlines')
    }
  }, [itemId, item?.status])

  const { form, isDirty, isSaving, handleSave, applyHeadline, applyRegeneratedData } =
    useItemEditor({
      item: item || fallbackItem,
      batchId,
    })

  const nav = useEditorNavigation({
    batchId,
    itemId,
    items,
    isDirty,
    onSave: handleSave,
    onReset: () => form.reset(),
  })

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
          <Skeleton className="h-[580px] w-full rounded-xl" />
          <Skeleton className="h-[580px] w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !batch || !item) {
    return (
      <Card className="m-6 p-12 text-center border-destructive/30 bg-destructive/5 space-y-4">
        <XCircle className="size-10 text-destructive mx-auto" />
        <h2 className="text-lg font-bold text-foreground">Vídeo não encontrado</h2>
        <p className="text-sm text-muted-foreground">
          {error?.message || `Não foi possível carregar o vídeo #${itemId} do lote #${batchId}.`}
        </p>
        <Button
          asChild
          variant="outline"
        >
          <Link
            to="/viral-studio/$id"
            params={{ id: batchId }}
          >
            <ArrowLeft className="size-4 mr-2" />
            Voltar ao Lote
          </Link>
        </Button>
      </Card>
    )
  }

  const currentHeadline = form.watch('selected_headline')

  return (
    <div className="space-y-6">
      <ViralEditorTopbar
        item={item}
        batchId={batchId}
        currentIndex={nav.currentIndex}
        totalItems={items.length}
        brand={brand}
        template={template}
        onBack={nav.handleBack}
        onNavigatePrev={nav.handlePrev}
        onNavigateNext={nav.handleNext}
        hasPrev={nav.hasPrev}
        hasNext={nav.hasNext}
      />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[340px_1fr]">
        <div className="w-full max-w-[340px] mx-auto lg:mx-0 lg:sticky lg:top-6 space-y-4">
          <ViralEditorPreview
            item={item}
            currentHeadline={currentHeadline}
            batchId={batchId}
            templateId={template?.id}
          />
        </div>

        <ViralEditorTabsSection
          item={item}
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
          form={form}
          batchId={batchId}
          brand={brand}
          applyHeadline={applyHeadline}
          applyRegeneratedData={applyRegeneratedData}
        />
      </div>

      <ViralEditorBottomBar
        item={item}
        isDirty={isDirty}
        isSaving={isSaving}
        onDiscard={() => form.reset()}
        onSave={() => handleSave()}
        onApprove={(id) => approveMutation.mutate(id)}
        isApproving={approveMutation.isPending}
      />

      <UnsavedChangesDialog
        isOpen={nav.isNavDialogOpen}
        onOpenChange={(open) => !open && nav.handleCancelNav()}
        onConfirmDiscard={nav.handleConfirmDiscard}
        onSaveAndProceed={nav.handleSaveAndProceed}
        isSaving={isSaving}
      />
    </div>
  )
}
