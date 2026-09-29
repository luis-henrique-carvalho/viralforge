import { Loader2, Send, XCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Typography } from '@/components/ui/typography'
import { useViralPublishDialogState } from '../hooks/use-viral-publish-dialog-state'
import { PublishAccountPicker } from './publish-account-picker'
import { PublishModeSelector } from './publish-mode-selector'
import { PublishSlotsTable } from './publish-slots-table'
import { PublishResultsTable } from './publish-results-table'
import type { ViralItem } from '../data/batch.types'
import type { PublishMode } from '../data/publishing.types'

export interface ViralPublishDialogProps {
  isOpen: boolean
  onClose: () => void
  items: ViralItem[]
  batchId?: string
  onPublished?: () => void
}

function renderMultiBrandNotice(
  itemsCount: number,
  brandSummary: Array<{ brandId: string; brandName: string; count: number }>,
) {
  return (
    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
      <div className="flex items-center gap-2 text-primary font-semibold text-sm">
        <Send className="size-4" />
        <span>Roteamento Automático Multimarca Ativo</span>
      </div>
      <Typography
        variant="muted"
        className="text-xs"
      >
        Foram selecionados {itemsCount} vídeos distribuídos em {brandSummary.length} marcas
        diferentes. Cada vídeo será publicado automaticamente nos canais conectados de sua
        respectiva marca.
      </Typography>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {brandSummary.map((b) => (
          <div
            key={b.brandId}
            className="flex items-center justify-between p-2 rounded-lg bg-card border border-border text-xs"
          >
            <span className="font-semibold truncate">{b.brandName}</span>
            <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
              {b.count} vídeo{b.count !== 1 ? 's' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function renderPublishProgress(mode: PublishMode) {
  return (
    <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
      <Loader2 className="size-10 animate-spin text-primary" />
      <div className="space-y-1">
        <Typography variant="h4">
          {mode === 'now' ? 'Publicando vídeos...' : 'Agendando fila contínua...'}
        </Typography>
        <Typography
          variant="muted"
          className="max-w-sm"
        >
          Realizando upload seguro dos vídeos e registrando metadados nas redes sociais.
        </Typography>
      </div>
      <Progress
        value={66}
        className="w-64 h-2"
      />
    </div>
  )
}

export function ViralPublishDialog({
  isOpen,
  onClose,
  items,
  batchId,
  onPublished,
}: ViralPublishDialogProps) {
  const {
    selectedAccountIds,
    handleToggleAccount,
    mode,
    setMode,
    results,
    publishError,
    accounts,
    isLoadingAccounts,
    isMultiBrand,
    currentBrand,
    brandAccounts,
    brandSummary,
    previewData,
    isLoadingPreview,
    publishMutation,
    handlePublish,
    handleClose,
    isCompleted,
  } = useViralPublishDialogState({
    isOpen,
    items,
    batchId,
    onClose,
    onPublished,
  })

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6 gap-5">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Send className="size-5" />
            <DialogTitle className="text-xl font-bold">
              Publicar / Agendar {items.length === 1 ? 'Vídeo' : `${items.length} Vídeos`}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isMultiBrand
              ? 'Publicação em lote para múltiplas marcas com roteamento automático de canais.'
              : 'Configure o canal de destino e escolha entre disparo imediato ou fila inteligente sem colisão.'}
          </DialogDescription>
        </DialogHeader>

        {!publishMutation.isPending && !isCompleted && (
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-5">
              {isMultiBrand ? (
                renderMultiBrandNotice(items.length, brandSummary)
              ) : (
                <PublishAccountPicker
                  accounts={brandAccounts.length > 0 ? brandAccounts : accounts}
                  isLoading={isLoadingAccounts}
                  selectedAccountIds={selectedAccountIds}
                  onToggleAccount={handleToggleAccount}
                  brandName={currentBrand?.name}
                  brandId={currentBrand?.id}
                />
              )}

              <PublishModeSelector
                mode={mode}
                onChangeMode={setMode}
                brand={currentBrand}
              />

              {mode === 'auto' && (
                <PublishSlotsTable
                  items={items}
                  projectedSlots={previewData?.projected_slots}
                  isLoading={isLoadingPreview}
                />
              )}

              {publishError && (
                <Alert
                  variant="destructive"
                  className="py-2.5"
                >
                  <XCircle className="size-4" />
                  <AlertTitle className="text-xs font-semibold">Erro no disparo</AlertTitle>
                  <AlertDescription className="text-xs">{publishError}</AlertDescription>
                </Alert>
              )}
            </div>
          </ScrollArea>
        )}

        {publishMutation.isPending && renderPublishProgress(mode)}

        {isCompleted && results && (
          <PublishResultsTable
            items={items}
            results={results}
          />
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
          {!isCompleted ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={publishMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={publishMutation.isPending || items.length === 0}
                className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="size-3.5" />
                {mode === 'now' ? 'Confirmar Publicação' : 'Confirmar Agendamento'}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={handleClose}
              className="ml-auto"
            >
              Concluir
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
