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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Typography } from '@/components/ui/typography'
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
  const [results, setResults] = useState<ViralPublishResult[]>([])
  const [publishError, setPublishError] = useState<string | null>(null)

  const { data: accounts = [], isLoading: isLoadingAccounts } = usePublishingAccounts()
  const activeAccount =
    accounts.find((a: SocialAccount) => a.id === selectedAccountId) || accounts[0]

  const { data: previewData, isLoading: isLoadingPreview } = usePreviewSlots(
    activeAccount?.id,
    items.length,
  )

  const publishMutation = usePublishItems(batchId)

  const handlePublish = async () => {
    if (!activeAccount) return
    setPublishError(null)

    const platform = activeAccount.platform || 'tiktok'
    const accountId = activeAccount.id || 'default'

    try {
      const res = await publishMutation.mutateAsync({
        item_ids: items.map((i) => i.id),
        platforms: [{ platform, accountId }],
        schedule_mode: mode,
      })

      if (res.results) {
        setResults(res.results)
      }
      onPublished?.()
    } catch (err: unknown) {
      setPublishError(err instanceof Error ? err.message : 'Falha ao processar publicação')
    }
  }

  const handleClose = () => {
    setResults([])
    setPublishError(null)
    onClose()
  }

  const isCompleted = results.length > 0

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
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-5">
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
          </ScrollArea>
        )}

        {publishMutation.isPending && (
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
        )}

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
