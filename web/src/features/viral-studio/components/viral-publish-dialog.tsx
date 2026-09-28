import { useState, useEffect, useMemo } from 'react'
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
import { useBrands } from '../hooks/use-brands'
import { PublishAccountPicker } from './publish-account-picker'
import { PublishModeSelector } from './publish-mode-selector'
import { PublishSlotsTable } from './publish-slots-table'
import { PublishResultsTable } from './publish-results-table'
import type { ViralItem, Brand } from '../data/batch.types'
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
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])
  const [mode, setMode] = useState<PublishMode>('auto')
  const [results, setResults] = useState<ViralPublishResult[]>([])
  const [publishError, setPublishError] = useState<string | null>(null)

  const { data: accounts = [], isLoading: isLoadingAccounts } = usePublishingAccounts()
  const { data: brandsData } = useBrands()
  const brands = brandsData?.brands ?? []

  // Analyze brands in selected items
  const brandIds = useMemo(
    () => Array.from(new Set(items.map((i) => i.brand_id).filter(Boolean))) as string[],
    [items],
  )
  const isMultiBrand = brandIds.length > 1
  const singleBrandId = brandIds[0] || items[0]?.brand_id
  const currentBrand = brands.find((b: Brand) => b.id === singleBrandId)

  // Extract all valid channel IDs for the single brand
  const brandChannelIds = useMemo(() => {
    if (!currentBrand?.publishing_profiles) return new Set<string>()
    const ids = new Set<string>()
    Object.values(currentBrand.publishing_profiles).forEach((p: any) => {
      if (typeof p === 'object' && p !== null) {
        if (Array.isArray(p.channel_ids)) {
          p.channel_ids.forEach((cid: string) => {
            if (String(cid).trim()) ids.add(String(cid).trim())
          })
        }
        if (p.account_id && String(p.account_id).trim()) ids.add(String(p.account_id).trim())
        if (p.accountId && String(p.accountId).trim()) ids.add(String(p.accountId).trim())
      } else if (typeof p === 'string' && p.trim()) {
        ids.add(p.trim())
      }
    })
    return ids
  }, [currentBrand?.publishing_profiles])

  // Filter accounts strictly for this brand
  const brandAccounts = useMemo(() => {
    if (isMultiBrand) return []
    if (!currentBrand) return accounts
    if (brandChannelIds.size === 0) return []
    return accounts.filter((a) => brandChannelIds.has(a.id))
  }, [accounts, currentBrand, brandChannelIds, isMultiBrand])

  // Multi-brand summary
  const brandSummary = useMemo(() => {
    if (!isMultiBrand) return []
    const counts: Record<string, { brand?: Brand; count: number }> = {}
    for (const item of items) {
      const bId = item.brand_id || 'unassigned'
      if (!counts[bId]) {
        counts[bId] = {
          brand: brands.find((b) => b.id === bId),
          count: 0,
        }
      }
      counts[bId].count++
    }
    return Object.entries(counts).map(([bId, data]) => ({
      brandId: bId,
      brandName: data.brand?.name || bId,
      count: data.count,
    }))
  }, [items, brands, isMultiBrand])

  // Auto-select brand accounts on open
  useEffect(() => {
    if (!isOpen) return
    if (isMultiBrand) {
      setSelectedAccountIds([])
      return
    }
    if (brandAccounts.length > 0) {
      setSelectedAccountIds(brandAccounts.map((a) => a.id))
    } else if (brandChannelIds.size === 0 && accounts.length > 0) {
      setSelectedAccountIds([accounts[0].id])
    } else {
      setSelectedAccountIds([])
    }
  }, [isOpen, brandAccounts, isMultiBrand, brandChannelIds.size, accounts])

  const handleToggleAccount = (id: string) => {
    setSelectedAccountIds((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((accId) => accId !== id) : prev
      }
      return [...prev, id]
    })
  }

  const primaryAccountId = selectedAccountIds[0] || brandAccounts[0]?.id || accounts[0]?.id

  const { data: previewData, isLoading: isLoadingPreview } = usePreviewSlots(
    primaryAccountId,
    items.length,
    undefined,
    undefined,
    singleBrandId || undefined,
  )

  const publishMutation = usePublishItems(batchId)

  const handlePublish = async () => {
    setPublishError(null)

    let platforms: Array<{ platform: string; accountId: string }> = []

    if (isMultiBrand) {
      // For multi-brand batches, backend automatically routes each video to its brand profiles
      platforms = []
    } else {
      if (selectedAccountIds.length === 0 && brandAccounts.length > 0) return

      const selectedAccounts = brandAccounts.filter((a: SocialAccount) =>
        selectedAccountIds.includes(a.id),
      )

      platforms =
        selectedAccounts.length > 0
          ? selectedAccounts.map((a: SocialAccount) => ({
              platform: a.platform || 'instagram',
              accountId: a.id,
            }))
          : brandAccounts.map((a: SocialAccount) => ({
              platform: a.platform || 'instagram',
              accountId: a.id,
            }))
    }

    try {
      const res = await publishMutation.mutateAsync({
        item_ids: items.map((i) => i.id),
        platforms,
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
            {isMultiBrand
              ? 'Publicação em lote para múltiplas marcas com roteamento automático de canais.'
              : 'Configure o canal de destino e escolha entre disparo imediato ou fila inteligente sem colisão.'}
          </DialogDescription>
        </DialogHeader>

        {!publishMutation.isPending && !isCompleted && (
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-5">
              {isMultiBrand ? (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <Send className="size-4" />
                    <span>Roteamento Automático Multimarca Ativo</span>
                  </div>
                  <Typography
                    variant="muted"
                    className="text-xs"
                  >
                    Foram selecionados {items.length} vídeos distribuídos em {brandSummary.length}{' '}
                    marcas diferentes. Cada vídeo será publicado automaticamente nos canais
                    conectados de sua respectiva marca.
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
