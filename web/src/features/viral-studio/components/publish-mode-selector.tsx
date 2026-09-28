import { useId } from 'react'
import { Clock } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { PublishMode } from '../data/publishing.types'
import type { Brand } from '../data/batch.types'

export interface PublishModeSelectorProps {
  mode: PublishMode
  onChangeMode: (mode: PublishMode) => void
  brand?: Brand | null
}

export function PublishModeSelector({ mode, onChangeMode, brand }: PublishModeSelectorProps) {
  const radioIdAuto = useId()
  const radioIdNow = useId()

  const scheduleText = (() => {
    const sched = brand?.posting_schedule
    const slots = sched?.slots
    if (slots && slots.length > 0) {
      const count = slots.length
      const countLabel = count === 1 ? '1 post por dia' : `${count} posts por dia`
      const tz = sched.timezone
        ? ` (${sched.timezone.split('/').pop()?.replace('_', ' ') || 'BRT'})`
        : ''
      return `${countLabel} às ${slots.join(', ')}${tz}, continuando automaticamente a partir do próximo slot livre sem sobreposição.`
    }
    return 'Fila inteligente contínua com base na grade da marca, continuando automaticamente a partir do próximo slot livre sem sobreposição.'
  })()

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
              {scheduleText}
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
