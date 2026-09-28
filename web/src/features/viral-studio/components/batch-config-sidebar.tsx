import { useMemo } from 'react'
import { Cpu, Layers, LayoutTemplate, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useLocalAIModels } from '../hooks/use-local-ai-models'
import { BatchBrandSelection } from './batch-brand-selection'
import type { Brand, VisualTemplate } from '../data/batch.types'

export interface BatchConfigSidebarProps {
  brands: Brand[]
  templates: VisualTemplate[]
  isLoadingBrands: boolean
  isLoadingTemplates: boolean
  selectedBrandId?: string
  setSelectedBrandId?: (val: string) => void
  selectedBrandIds?: string[]
  setSelectedBrandIds?: (ids: string[]) => void
  distributionStrategy?: 'round_robin' | 'sequential'
  setDistributionStrategy?: (val: 'round_robin' | 'sequential') => void
  selectedTemplateId: string
  setSelectedTemplateId: (val: string) => void
  selectedModel: string
  setSelectedModel: (val: string) => void
  isPending: boolean
  itemsCount: number
}

export function BatchConfigSidebar({
  brands,
  templates,
  isLoadingBrands,
  isLoadingTemplates,
  selectedBrandId = 'vale-o-clique',
  setSelectedBrandId,
  selectedBrandIds,
  setSelectedBrandIds,
  distributionStrategy = 'round_robin',
  setDistributionStrategy,
  selectedTemplateId,
  setSelectedTemplateId,
  selectedModel,
  setSelectedModel,
  isPending,
  itemsCount,
}: BatchConfigSidebarProps) {
  const { modelOptions, isLoading: isLoadingModels } = useLocalAIModels()

  const currentBrandIds = useMemo(() => {
    if (selectedBrandIds && selectedBrandIds.length > 0) return selectedBrandIds
    return selectedBrandId ? [selectedBrandId] : []
  }, [selectedBrandIds, selectedBrandId])

  const handleToggleBrand = (brandId: string) => {
    if (!setSelectedBrandIds) {
      setSelectedBrandId?.(brandId)
      return
    }
    const next = currentBrandIds.includes(brandId)
      ? currentBrandIds.length > 1
        ? currentBrandIds.filter((id) => id !== brandId)
        : currentBrandIds
      : [...currentBrandIds, brandId]
    setSelectedBrandIds(next)
    if (next[0]) setSelectedBrandId?.(next[0])
  }

  const groupedOptions = useMemo(() => {
    return modelOptions.reduce<Record<string, typeof modelOptions>>((acc, opt) => {
      const group = opt.group || 'Outros Modelos'
      if (!acc[group]) acc[group] = []
      acc[group].push(opt)
      return acc
    }, {})
  }, [modelOptions])

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card/60 backdrop-blur-xs">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Parâmetros de Produção</CardTitle>
          <CardDescription>Perfil de marca, modelo de IA e template 9:16.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <BatchBrandSelection
            brands={brands}
            isLoadingBrands={isLoadingBrands}
            currentBrandIds={currentBrandIds}
            selectedBrandId={selectedBrandId}
            setSelectedBrandId={setSelectedBrandId}
            setSelectedBrandIds={setSelectedBrandIds}
            onToggleBrand={handleToggleBrand}
          />

          {currentBrandIds.length > 1 && setDistributionStrategy && (
            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <Label className="flex items-center gap-1.5 text-xs font-semibold">
                <Layers className="size-3.5 text-primary" />
                Distribuição Multi-Marca
              </Label>
              <RadioGroup
                value={distributionStrategy}
                onValueChange={(val) =>
                  setDistributionStrategy(val as 'round_robin' | 'sequential')
                }
                className="space-y-1"
              >
                {/* shadcn-ignore: layout */}
                <div className="flex items-center gap-2 p-1.5 rounded-lg border border-border/60 bg-card/40 cursor-pointer">
                  <RadioGroupItem
                    value="round_robin"
                    id="sb_round_robin"
                  />
                  <Label
                    htmlFor="sb_round_robin"
                    className="cursor-pointer text-xs"
                  >
                    <span className="font-semibold">Round-Robin (Alternado)</span>
                  </Label>
                </div>
                {/* shadcn-ignore: layout */}
                <div className="flex items-center gap-2 p-1.5 rounded-lg border border-border/60 bg-card/40 cursor-pointer">
                  <RadioGroupItem
                    value="sequential"
                    id="sb_sequential"
                  />
                  <Label
                    htmlFor="sb_sequential"
                    className="cursor-pointer text-xs"
                  >
                    <span className="font-semibold">Sequencial em Blocos</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold">
              <LayoutTemplate className="size-3.5 text-primary" />
              Template Visual 9:16
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
                {templates.map((t) => (
                  <SelectItem
                    key={t.id}
                    value={t.id}
                  >
                    {t.name} (1080x1920)
                  </SelectItem>
                ))}
                {templates.length === 0 && (
                  <SelectItem value="classic-affiliate">Classic Affiliate (1080x1920)</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold">
              <Cpu className="size-3.5 text-indigo-500" />
              Modelo de Copywriting & Visão
            </Label>
            <Select
              value={selectedModel}
              onValueChange={setSelectedModel}
              disabled={isLoadingModels}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o modelo IA..." />
              </SelectTrigger>
              <SelectContent className="max-h-72 overflow-y-auto">
                {Object.entries(groupedOptions).map(([group, options]) => (
                  <SelectGroup key={group}>
                    <SelectLabel className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1">
                      {group}
                    </SelectLabel>
                    {options.map((m) => (
                      <SelectItem
                        key={m.value}
                        value={m.value}
                        className="text-xs"
                      >
                        <span className="truncate">{m.label}</span>
                        {m.badge && (
                          <span className="ml-1.5 text-[10px] text-muted-foreground">
                            ({m.badge})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 border-t border-border/40">
            <Button
              type="submit"
              className="w-full gap-2 shadow-sm font-semibold"
              size="lg"
              disabled={isPending || itemsCount === 0 || currentBrandIds.length === 0}
            >
              <Plus className="size-4 shrink-0" />
              <span>{isPending ? 'Criando Lote...' : `Processar Lote (${itemsCount} vídeos)`}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
