import { Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ApiKeyInput } from './api-key-input'

export const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Padrão Recomendado)' },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite (Ultra Rápido & Econômico)',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro (Máximo Raciocínio & Contexto)',
  },
]

interface GeminiSettingsSectionProps {
  apiKey: string
  setApiKey: (val: string) => void
  model: string
  setModel: (val: string) => void
  isConfigured: boolean
  maskedKey?: string
  onClearKey: () => Promise<void>
}

export function GeminiSettingsSection({
  apiKey,
  setApiKey,
  model,
  setModel,
  isConfigured,
  maskedKey,
  onClearKey,
}: GeminiSettingsSectionProps) {
  return (
    <Card className="space-y-4 border-border/60 bg-card/40 p-4 shadow-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <Typography variant="h4">Google Gemini Cloud</Typography>
        </div>
        <Badge
          variant="secondary"
          className="text-xs"
        >
          Cloud AI
        </Badge>
      </div>

      <ApiKeyInput
        label="Google Gemini API Key"
        description="Chave de API do Google AI Studio para detecção viral, roteirização e tarefas de copy."
        value={apiKey}
        onChange={setApiKey}
        isConfigured={isConfigured}
        maskedValue={maskedKey}
        onClear={onClearKey}
        name="gemini-api-key"
      />

      <div className="space-y-2 pt-1">
        <Label
          htmlFor="gemini-model-select"
          className="text-xs font-medium"
        >
          Modelo Gemini Padrão
        </Label>
        <Select
          value={model}
          onValueChange={setModel}
        >
          <SelectTrigger
            id="gemini-model-select"
            className="w-full sm:w-80 font-mono text-xs"
          >
            <SelectValue placeholder="Selecione o modelo" />
          </SelectTrigger>
          <SelectContent>
            {GEMINI_MODELS.map((m) => (
              <SelectItem
                key={m.id}
                value={m.id}
                className="text-xs font-mono"
              >
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Card>
  )
}
