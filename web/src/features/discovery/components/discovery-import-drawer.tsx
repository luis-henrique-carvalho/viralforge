import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Cpu, LayoutTemplate, Plus, Sparkles } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBrands, useTemplates } from '@/features/viral-studio/hooks/use-brands'
import { useCreateBatch } from '@/features/viral-studio/hooks/use-create-batch'
import { useLocalAIModels } from '@/features/viral-studio/hooks/use-local-ai-models'
import { DiscoveryBrandPicker } from './discovery-brand-picker'
import { DiscoveryStrategyPicker } from './discovery-strategy-picker'
import type { DiscoveryItem } from '../data/discovery.types'
import type { VisualTemplate } from '@/features/viral-studio/data/batch.types'

export interface DiscoveryImportDrawerProps {
  isOpen: boolean
  onClose: () => void
  selectedItems: DiscoveryItem[]
}

export function DiscoveryImportDrawer({
  isOpen,
  onClose,
  selectedItems,
}: DiscoveryImportDrawerProps) {
  const navigate = useNavigate()
  const { data: brandsData } = useBrands()
  const { data: templatesData, isLoading: isLoadingTemplates } = useTemplates()
  const { modelOptions, isLoading: isLoadingModels } = useLocalAIModels()
  const createBatchMutation = useCreateBatch()

  const brands = useMemo(() => brandsData?.brands || [], [brandsData?.brands])
  const templates = useMemo(() => templatesData?.templates || [], [templatesData?.templates])

  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('classic-affiliate')
  const [distributionStrategy, setDistributionStrategy] = useState<'round_robin' | 'sequential'>(
    'round_robin',
  )
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash')

  useEffect(() => {
    if (brands.length > 0 && selectedBrandIds.length === 0) {
      setSelectedBrandIds([brands[0].id])
    }
  }, [brands, selectedBrandIds.length])

  const handleToggleBrand = (brandId: string) => {
    setSelectedBrandIds((prev) => {
      if (prev.includes(brandId)) {
        return prev.length > 1 ? prev.filter((id) => id !== brandId) : prev
      }
      return [...prev, brandId]
    })
  }

  const handleSelectAllBrands = () => {
    if (selectedBrandIds.length === brands.length) {
      if (brands.length > 0) setSelectedBrandIds([brands[0].id])
    } else {
      setSelectedBrandIds(brands.map((b) => b.id))
    }
  }

  const handleImport = async () => {
    if (selectedBrandIds.length === 0 || selectedItems.length === 0) return

    try {
      const result = await createBatchMutation.mutateAsync({
        brand_ids: selectedBrandIds,
        template_id: selectedTemplateId || undefined,
        distribution_strategy: distributionStrategy,
        model: selectedModel || undefined,
        items: selectedItems.map((item) => ({
          source_url: item.url,
          manual_headline: item.title ? item.title.slice(0, 120) : undefined,
        })),
      })

      const batchId = result.batch_id || result.id
      onClose()
      navigate({ to: '/viral-studio/$id', params: { id: batchId } })
    } catch {
      // Error handled by mutation toast
    }
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <SheetContent className="max-w-md w-full flex flex-col p-6 gap-5">
        <SheetHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="size-5" />
            <SheetTitle className="text-lg font-bold">
              Importar {selectedItems.length} Vídeo{selectedItems.length > 1 ? 's' : ''} em Lote
            </SheetTitle>
          </div>
          <SheetDescription>
            Defina o template visual e o pool de marcas para distribuição antecipada.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-5 text-xs">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-semibold">
                <LayoutTemplate className="size-3.5 text-primary" />
                Template Visual Unificado (1080x1920)
              </Label>
              <Select
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
                disabled={isLoadingTemplates}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t: VisualTemplate) => (
                    <SelectItem
                      key={t.id}
                      value={t.id}
                    >
                      {t.name}
                    </SelectItem>
                  ))}
                  {templates.length === 0 && (
                    <SelectItem value="classic-affiliate">Classic Affiliate (1080x1920)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <DiscoveryBrandPicker
              brands={brands}
              selectedBrandIds={selectedBrandIds}
              onToggleBrand={handleToggleBrand}
              onSelectAllBrands={handleSelectAllBrands}
            />

            {selectedBrandIds.length > 1 && (
              <DiscoveryStrategyPicker
                distributionStrategy={distributionStrategy}
                onChangeStrategy={setDistributionStrategy}
              />
            )}

            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <Label className="flex items-center gap-1.5 text-xs font-semibold">
                <Cpu className="size-3.5 text-indigo-500" />
                Modelo de IA
              </Label>
              <Select
                value={selectedModel}
                onValueChange={setSelectedModel}
                disabled={isLoadingModels}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o modelo..." />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {modelOptions.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="pt-3 border-t border-border/40 flex items-center justify-between sm:justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={createBatchMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleImport}
            disabled={createBatchMutation.isPending || selectedBrandIds.length === 0}
            className="gap-2 bg-primary font-semibold"
          >
            <Plus className="size-4" />
            <span>{createBatchMutation.isPending ? 'Criando Lote...' : 'Criar Lote'}</span>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
