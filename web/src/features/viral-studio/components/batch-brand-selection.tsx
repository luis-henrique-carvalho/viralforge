import { Check, Tag, Users } from 'lucide-react'
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
import type { Brand } from '../data/batch.types'

export interface BatchBrandSelectionProps {
  brands: Brand[]
  isLoadingBrands: boolean
  currentBrandIds: string[]
  selectedBrandId?: string
  setSelectedBrandId?: (val: string) => void
  setSelectedBrandIds?: (ids: string[]) => void
  onToggleBrand: (brandId: string) => void
}

export function BatchBrandSelection({
  brands,
  isLoadingBrands,
  currentBrandIds,
  selectedBrandId,
  setSelectedBrandId,
  setSelectedBrandIds,
  onToggleBrand,
}: BatchBrandSelectionProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5 text-xs font-semibold">
          <Users className="size-3.5 text-primary" />
          Pool de Marcas ({currentBrandIds.length} selecionada
          {currentBrandIds.length > 1 ? 's' : ''})
        </Label>
        {brands.length > 1 && setSelectedBrandIds && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-[10px] text-primary"
            onClick={() => {
              if (currentBrandIds.length === brands.length) {
                if (brands[0]) setSelectedBrandIds([brands[0].id])
              } else {
                setSelectedBrandIds(brands.map((b) => b.id))
              }
            }}
          >
            {currentBrandIds.length === brands.length ? 'Desmarcar' : 'Todas'}
          </Button>
        )}
      </div>

      {brands.length > 1 && setSelectedBrandIds ? (
        <ScrollArea className="max-h-40 pr-1">
          <div className="grid grid-cols-1 gap-1.5">
            {brands.map((b) => {
              const isChecked = currentBrandIds.includes(b.id)
              return (
                // shadcn-ignore: layout
                <div
                  key={b.id}
                  onClick={() => onToggleBrand(b.id)}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                    isChecked
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border/60 bg-muted/20 text-muted-foreground hover:border-border'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Tag className="size-3 text-primary shrink-0" />
                    <div className="min-w-0">
                      <span className="font-medium truncate block leading-none">{b.name}</span>
                      <span className="text-[10px] text-muted-foreground block">{b.handle}</span>
                    </div>
                  </div>
                  <div
                    className={`size-3.5 rounded border flex items-center justify-center ${
                      isChecked
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-border'
                    }`}
                  >
                    {isChecked && <Check className="size-2.5" />}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      ) : (
        <Select
          value={selectedBrandId}
          onValueChange={(val) => {
            setSelectedBrandId?.(val)
            setSelectedBrandIds?.([val])
          }}
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
      )}
    </div>
  )
}
