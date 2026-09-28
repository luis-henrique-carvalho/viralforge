import { Layers } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Typography } from '@/components/ui/typography'

export interface DiscoveryStrategyPickerProps {
  distributionStrategy: 'round_robin' | 'sequential'
  onChangeStrategy: (strategy: 'round_robin' | 'sequential') => void
}

export function DiscoveryStrategyPicker({
  distributionStrategy,
  onChangeStrategy,
}: DiscoveryStrategyPickerProps) {
  return (
    <div className="space-y-2 pt-2 border-t border-border/40">
      <Label className="flex items-center gap-1.5 text-xs font-semibold">
        <Layers className="size-3.5 text-primary" />
        Estratégia de Distribuição
      </Label>
      <RadioGroup
        value={distributionStrategy}
        onValueChange={(val) => onChangeStrategy(val as 'round_robin' | 'sequential')}
        className="space-y-1.5"
      >
        {/* shadcn-ignore: layout */}
        <div className="flex items-center gap-2 p-2 rounded-lg border border-border/60 bg-card/40 cursor-pointer">
          <RadioGroupItem
            value="round_robin"
            id="round_robin"
          />
          <Label
            htmlFor="round_robin"
            className="cursor-pointer text-xs flex flex-col"
          >
            <span className="font-semibold">Round-Robin (Alternado)</span>
            <Typography
              variant="muted"
              className="text-[10px]"
            >
              Vídeo 1 ➔ Marca A, Vídeo 2 ➔ Marca B, Vídeo 3 ➔ Marca A...
            </Typography>
          </Label>
        </div>

        {/* shadcn-ignore: layout */}
        <div className="flex items-center gap-2 p-2 rounded-lg border border-border/60 bg-card/40 cursor-pointer">
          <RadioGroupItem
            value="sequential"
            id="sequential"
          />
          <Label
            htmlFor="sequential"
            className="cursor-pointer text-xs flex flex-col"
          >
            <span className="font-semibold">Sequencial em Blocos</span>
            <Typography
              variant="muted"
              className="text-[10px]"
            >
              Divide a lista em blocos contínuos entre as marcas selecionadas.
            </Typography>
          </Label>
        </div>
      </RadioGroup>
    </div>
  )
}
