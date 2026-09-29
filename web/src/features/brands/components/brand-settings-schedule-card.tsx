import { useState } from 'react'
import { Calendar, Plus, Save, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Brand, ScheduleSlotsUpdate } from '../data/brand.types'

interface BrandSettingsScheduleCardProps {
  brand: Brand
  onSave: (payload: ScheduleSlotsUpdate) => Promise<void>
  isPending: boolean
}

interface SlotItem {
  id: string
  time: string
}

const DEFAULT_SLOTS_BY_FREQ: Record<number, string[]> = {
  1: ['18:00'],
  2: ['12:00', '19:00'],
  3: ['10:00', '15:00', '20:00'],
  4: ['09:00', '13:00', '17:00', '21:00'],
}

export function BrandSettingsScheduleCard({
  brand,
  onSave,
  isPending,
}: BrandSettingsScheduleCardProps) {
  const initialSchedule = brand.posting_schedule || {
    frequency: 3,
    slots: ['10:00', '15:00', '20:00'],
    timezone: 'America/Sao_Paulo',
  }
  const [frequency, setFrequency] = useState<number>(initialSchedule.frequency || 3)
  const [timezone, setTimezone] = useState<string>(initialSchedule.timezone || 'America/Sao_Paulo')
  const [slots, setSlots] = useState<SlotItem[]>(() =>
    (initialSchedule.slots || ['10:00', '15:00', '20:00']).map((s, idx) => ({
      id: `slot_${idx}_${s}`,
      time: s,
    })),
  )

  const handleFrequencyChange = (newFreq: number) => {
    setFrequency(newFreq)
    const defaults = DEFAULT_SLOTS_BY_FREQ[newFreq] || ['12:00']
    setSlots(defaults.map((s, idx) => ({ id: `slot_${idx}_${s}_${Date.now()}`, time: s })))
  }

  const handleSlotChange = (id: string, value: string) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, time: value } : s)))
  }

  const handleAddSlot = () => {
    setSlots((prev) => [...prev, { id: `slot_${Date.now()}`, time: '12:00' }])
  }

  const handleRemoveSlot = (id: string) => {
    if (slots.length <= 1) return
    setSlots((prev) => prev.filter((s) => s.id !== id))
  }

  const handleSave = async () => {
    await onSave({
      slots: slots.map((s) => s.time),
      timezone,
      frequency: slots.length,
    })
  }

  return (
    <Card className="border-border bg-card/60 backdrop-blur-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Calendar className="size-4 text-emerald-500" />
          Grade de Postagens Diárias (Posting Schedule)
        </CardTitle>
        <CardDescription className="text-xs">
          Configure os horários preferenciais para o auto-agendamento inteligente em 1 clique.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Frequência Sugerida:</Label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((f) => (
                <Button
                  key={f}
                  type="button"
                  variant={frequency === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFrequencyChange(f)}
                  className="text-xs h-8"
                >
                  {f}x ao dia
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="schedule-timezone"
              className="text-xs"
            >
              Fuso Horário:
            </Label>
            <Select
              value={timezone}
              onValueChange={setTimezone}
            >
              <SelectTrigger
                id="schedule-timezone"
                className="text-xs h-8"
              >
                <SelectValue placeholder="Fuso horário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/Sao_Paulo">América/São Paulo (BRT)</SelectItem>
                <SelectItem value="America/Manaus">América/Manaus (AMT)</SelectItem>
                <SelectItem value="UTC">UTC Universal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Dynamic Slots */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Horários dos Slots Diários:</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddSlot}
              className="gap-1 text-[11px] h-7 text-primary"
            >
              <Plus className="size-3" />
              Adicionar Horário
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {slots.map((slotItem, index) => (
              <div
                key={slotItem.id}
                className="flex items-center gap-1.5 p-2 rounded-lg border border-border bg-muted/20"
              >
                <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                  #{index + 1}
                </span>
                <Input
                  type="time"
                  value={slotItem.time}
                  onChange={(e) => handleSlotChange(slotItem.id, e.target.value)}
                  className="h-7 text-xs font-mono text-center p-1"
                />
                {slots.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSlot(slotItem.id)}
                    className="size-6 text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border/40">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Save className="size-3.5" />
            Salvar Grade de Postagens
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
