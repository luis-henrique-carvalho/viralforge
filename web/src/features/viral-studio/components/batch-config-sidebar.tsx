import { useMemo } from 'react'
import { Cpu, LayoutTemplate, Plus, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import type { Brand, VisualTemplate } from '../data/batch.types'

export interface BatchConfigSidebarProps {
  brands: Brand[]
  templates: VisualTemplate[]
  isLoadingBrands: boolean
  isLoadingTemplates: boolean
  selectedBrandId: string
  setSelectedBrandId: (val: string) => void
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
  selectedBrandId,
  setSelectedBrandId,
  selectedTemplateId,
  setSelectedTemplateId,
  selectedModel,
  setSelectedModel,
  isPending,
  itemsCount,
}: BatchConfigSidebarProps) {
  const { modelOptions, isLoading: isLoadingModels } = useLocalAIModels()

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
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs">
              <Tag className="size-3.5 text-primary" />
              Perfil da Marca
            </Label>
            <Select
              value={selectedBrandId}
              onValueChange={setSelectedBrandId}
              disabled={isLoadingBrands}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a marca..." />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem
                    key={b.id}
                    value={b.id}
                  >
                    {b.name} ({b.handle})
                  </SelectItem>
                ))}
                {brands.length === 0 && (
                  <SelectItem value="vale-o-clique">Vale o Clique? (@valeoclique)</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs">
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
            <Label className="flex items-center gap-1.5 text-xs">
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
              disabled={isPending || itemsCount === 0}
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
