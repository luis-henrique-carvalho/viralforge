import { Check, Tag, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import type { Brand } from '@/features/viral-studio/data/batch.types'

export interface DiscoveryBrandPickerProps {
  brands: Brand[]
  selectedBrandIds: string[]
  onToggleBrand: (id: string) => void
  onSelectAllBrands: () => void
}

export function DiscoveryBrandPicker({
  brands,
  selectedBrandIds,
  onToggleBrand,
  onSelectAllBrands,
}: DiscoveryBrandPickerProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5 text-xs font-semibold">
          <Users className="size-3.5 text-primary" />
          Pool de Marcas ({selectedBrandIds.length} selecionada
          {selectedBrandIds.length > 1 ? 's' : ''})
        </Label>
        {brands.length > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[11px] text-primary"
            onClick={onSelectAllBrands}
          >
            {selectedBrandIds.length === brands.length ? 'Desmarcar' : 'Todas'}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {brands.map((brand: Brand) => {
          const isChecked = selectedBrandIds.includes(brand.id)
          return (
            <div
              key={brand.id}
              onClick={() => onToggleBrand(brand.id)}
              className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                isChecked
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border/60 bg-muted/20 text-muted-foreground hover:border-border'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Tag className="size-3.5 text-primary shrink-0" />
                <div className="min-w-0">
                  <Typography
                    variant="small"
                    className="font-medium truncate"
                  >
                    {brand.name}
                  </Typography>
                  <Typography
                    variant="muted"
                    className="text-[10px]"
                  >
                    {brand.handle}
                  </Typography>
                </div>
              </div>

              <div
                className={`size-4 rounded border flex items-center justify-center ${
                  isChecked ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                }`}
              >
                {isChecked && <Check className="size-3" />}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
