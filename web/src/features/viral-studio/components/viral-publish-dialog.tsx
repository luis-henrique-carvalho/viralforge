import { useState } from 'react'
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
import { usePublishingAccounts, usePreviewSlots, usePublishItems } from '../hooks/use-publishing'
import { PublishAccountPicker } from './publish-account-picker'
import { PublishModeSelector } from './publish-mode-selector'
import { PublishSlotsTable } from './publish-slots-table'
import { PublishResultsTable } from './publish-results-table'
import type { ViralItem } from '../data/batch.types'
import type { PublishMode, SocialAccount, ViralPublishResult } from '../data/publishing.types'

export interface ViralPublishDialogProps {
  isOpen: boolean
  onClose: () => void
  items: ViralItem[]
  batchId?: string
  onPublished?: () => void
}

export function ViralPublishDialog({
  isOpen,
  onClose,
  items,
  batchId,
  onPublished,
}: ViralPublishDialogProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [mode, setMode] = useState<PublishMode>('auto')
  const [publishResults, setPublishResults] = useState<ViralPublishResult[] | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)

  const { data: accounts = [], isLoading: isLoadingAccounts } = usePublishingAccounts()
  const publishMutation = usePublishItems(batchId)

  const activeAccount: SocialAccount | undefined =
    accounts.find((a) => a.id === selectedAccountId) || accounts[0]
  const effectiveAccountId = activeAccount?.id || 'default'

  const { data: previewData, isLoading: isLoadingPreview } = usePreviewSlots(
    effectiveAccountId,
    items.length,
    undefined,
    '18:00',
    { enabled: isOpen && mode === 'auto' && items.length > 0 },
  )

  const handlePublish = async () => {
    setPublishError(null)
    setPublishResults(null)

    const platform = activeAccount?.platform || 'tiktok'
    const accountId = activeAccount?.id || 'default'

    try {
      const response = await publishMutation.mutateAsync({
        item_ids: items.map((i) => i.id),
        platforms: [{ platform, accountId }],
        schedule_mode: mode,
      })

      setPublishResults(response.results)
      onPublished?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao processar publicação'
      setPublishError(msg)
    }
  }

  const handleClose = () => {
    if (publishMutation.isPending) return
    setPublishResults(null)
    setPublishError(null)
    onClose()
  }

  const isCompleted = publishResults !== null

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
            Configure o canal de destino e escolha entre disparo imediato ou fila inteligente sem
            colisão.
          </DialogDescription>
        </DialogHeader>

        {!publishMutation.isPending && !isCompleted && (
          <div className="space-y-5 overflow-y-auto pr-1">
            <PublishAccountPicker
              accounts={accounts}
              isLoading={isLoadingAccounts}
              activeAccount={activeAccount}
              onSelectAccount={setSelectedAccountId}
            />

            <PublishModeSelector
              mode={mode}
              onChangeMode={setMode}
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
        )}

        {publishMutation.isPending && (
          <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
            <Loader2 className="size-10 animate-spin text-primary" />
            <div className="space-y-1">
              <h3 className="font-semibold text-base">
                {mode === 'now' ? 'Publicando vídeos...' : 'Agendando fila contínua...'}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Realizando upload seguro dos vídeos e registrando metadados nas redes sociais.
              </p>
            </div>
            <Progress
              value={66}
              className="w-64 h-2"
            />
          </div>
        )}

        {isCompleted && publishResults && (
          <PublishResultsTable
            items={items}
            results={publishResults}
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
