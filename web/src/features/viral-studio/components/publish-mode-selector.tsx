import { useId } from 'react'
import { Clock } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { PublishMode } from '../data/publishing.types'

export interface PublishModeSelectorProps {
  mode: PublishMode
  onChangeMode: (mode: PublishMode) => void
}

export function PublishModeSelector({ mode, onChangeMode }: PublishModeSelectorProps) {
  const radioIdAuto = useId()
  const radioIdNow = useId()

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold flex items-center gap-2">
        <Clock className="size-4 text-muted-foreground" />
        Modo de Disparo
      </Label>
      <RadioGroup
        value={mode}
        onValueChange={(val) => onChangeMode(val as PublishMode)}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <div
          className={`flex items-start gap-3 p-3.5 rounded-lg border transition-all cursor-pointer ${
            mode === 'auto'
              ? 'border-primary bg-primary/5 ring-1 ring-primary'
              : 'border-border bg-card'
          }`}
          onClick={() => onChangeMode('auto')}
        >
          <RadioGroupItem
            value="auto"
            id={radioIdAuto}
            className="mt-1"
          />
          <div className="space-y-1">
            <Label
              htmlFor={radioIdAuto}
              className="font-semibold text-sm cursor-pointer"
            >
              Fila Inteligente Contínua
            </Label>
            <Typography
              variant="muted"
              className="leading-relaxed"
            >
              1 vídeo por dia às 18:00, continuando automaticamente a partir do próximo slot livre
              sem sobreposição.
            </Typography>
          </div>
        </div>

        <div
          className={`flex items-start gap-3 p-3.5 rounded-lg border transition-all cursor-pointer ${
            mode === 'now'
              ? 'border-primary bg-primary/5 ring-1 ring-primary'
              : 'border-border bg-card'
          }`}
          onClick={() => onChangeMode('now')}
        >
          <RadioGroupItem
            value="now"
            id={radioIdNow}
            className="mt-1"
          />
          <div className="space-y-1">
            <Label
              htmlFor={radioIdNow}
              className="font-semibold text-sm cursor-pointer"
            >
              Publicar Agora
            </Label>
            <Typography
              variant="muted"
              className="leading-relaxed"
            >
              Disparo imediato na rede social selecionada para todos os vídeos aprovados.
            </Typography>
          </div>
        </div>
      </RadioGroup>
    </div>
  )
}
