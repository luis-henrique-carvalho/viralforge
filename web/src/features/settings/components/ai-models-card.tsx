import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Bot, Save, Sparkles } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ApiKeyInput } from './api-key-input'
import { LocalModelsSection } from './local-models-section'
import { useSettings } from '../hooks/use-settings'
import { useUpdateSettings } from '../hooks/use-update-settings'
import { aiModelsSchema, type AiModelsFormData } from '../data/settings.schema'

const GEMINI_MODELS = [
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

export function AiModelsCard() {
  const { config, localModels } = useSettings()
  const { updateConfig, isUpdatingConfig } = useUpdateSettings()

  const form = useForm<AiModelsFormData>({
    resolver: zodResolver(aiModelsSchema),
    defaultValues: {
      GEMINI_API_KEY: '',
      GEMINI_MODEL: config?.GEMINI_MODEL || 'gemini-2.5-flash',
      DEFAULT_AI_MODEL: config?.DEFAULT_AI_MODEL || 'gemini-2.5-flash',
      LM_STUDIO_BASE_URL: config?.LM_STUDIO_BASE_URL || '',
      OLLAMA_BASE_URL: config?.OLLAMA_BASE_URL || '',
    },
  })

  useEffect(() => {
    if (config) {
      form.setValue('GEMINI_MODEL', config.GEMINI_MODEL || 'gemini-2.5-flash')
      form.setValue(
        'DEFAULT_AI_MODEL',
        config.DEFAULT_AI_MODEL || config.GEMINI_MODEL || 'gemini-2.5-flash',
      )
      form.setValue('LM_STUDIO_BASE_URL', config.LM_STUDIO_BASE_URL || '')
      form.setValue('OLLAMA_BASE_URL', config.OLLAMA_BASE_URL || '')
    }
  }, [config, form])

  const geminiKey = form.watch('GEMINI_API_KEY') || ''
  const geminiModel = form.watch('GEMINI_MODEL') || 'gemini-2.5-flash'
  const defaultAiModel = form.watch('DEFAULT_AI_MODEL') || 'gemini-2.5-flash'
  const lmStudioUrl = form.watch('LM_STUDIO_BASE_URL') || ''
  const ollamaUrl = form.watch('OLLAMA_BASE_URL') || ''

  const onSubmit = form.handleSubmit(async (data) => {
    const payload: Record<string, string> = {
      GEMINI_MODEL: data.GEMINI_MODEL || 'gemini-2.5-flash',
      DEFAULT_AI_MODEL: data.DEFAULT_AI_MODEL || 'gemini-2.5-flash',
      LM_STUDIO_BASE_URL: (data.LM_STUDIO_BASE_URL || '').trim(),
      OLLAMA_BASE_URL: (data.OLLAMA_BASE_URL || '').trim(),
    }
    if (data.GEMINI_API_KEY && data.GEMINI_API_KEY.trim()) {
      payload.GEMINI_API_KEY = data.GEMINI_API_KEY.trim()
    }
    await updateConfig(payload)
    form.setValue('GEMINI_API_KEY', '')
  })

  const isGeminiConfigured = Boolean(config?.GEMINI_API_KEY)

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Modelos de IA & Raciocínio</CardTitle>
        </div>
        <CardDescription>
          Configure as chaves da API do Google Gemini e conexões com LLMs locais (LM Studio /
          Ollama).
        </CardDescription>
      </CardHeader>

      <form onSubmit={onSubmit}>
        <CardContent className="space-y-6">
          <Card className="space-y-4 border-border/60 bg-card/40 p-4 shadow-none">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Google Gemini Cloud
              </h3>
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
              value={geminiKey}
              onChange={(val) => form.setValue('GEMINI_API_KEY', val)}
              isConfigured={isGeminiConfigured}
              maskedValue={config?.GEMINI_API_KEY}
              onClear={async () => {
                await updateConfig({ GEMINI_API_KEY: '' })
                form.setValue('GEMINI_API_KEY', '')
              }}
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
                value={geminiModel}
                onValueChange={(val) => form.setValue('GEMINI_MODEL', val)}
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

          <LocalModelsSection
            lmStudioUrl={lmStudioUrl}
            setLmStudioUrl={(val) => form.setValue('LM_STUDIO_BASE_URL', val)}
            ollamaUrl={ollamaUrl}
            setOllamaUrl={(val) => form.setValue('OLLAMA_BASE_URL', val)}
            localModels={localModels}
            defaultAiModel={defaultAiModel}
            setDefaultAiModel={(val) => form.setValue('DEFAULT_AI_MODEL', val)}
          />

          <div className="space-y-2 pt-2">
            <Label
              htmlFor="default-model-select"
              className="text-sm font-medium"
            >
              Motor de IA Global Padrão para o Viral Studio
            </Label>
            <Select
              value={defaultAiModel}
              onValueChange={(val) => form.setValue('DEFAULT_AI_MODEL', val)}
            >
              <SelectTrigger
                id="default-model-select"
                className="w-full sm:w-96 font-mono text-xs"
              >
                <SelectValue placeholder="Selecione o modelo global" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value="gemini-2.5-flash"
                  className="text-xs font-mono"
                >
                  gemini-2.5-flash (Google Cloud)
                </SelectItem>
                <SelectItem
                  value="gemini-2.5-flash-lite"
                  className="text-xs font-mono"
                >
                  gemini-2.5-flash-lite (Google Cloud)
                </SelectItem>
                <SelectItem
                  value="gemini-2.5-pro"
                  className="text-xs font-mono"
                >
                  gemini-2.5-pro (Google Cloud)
                </SelectItem>
                {localModels?.models?.map((m) => (
                  <SelectItem
                    key={m.id}
                    value={m.id}
                    className="text-xs font-mono"
                  >
                    {m.id} ({m.group})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Define o modelo pré-selecionado na criação de novos lotes e na regeneração de cópias.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end border-t border-border/40 pt-4">
          <Button
            type="submit"
            disabled={isUpdatingConfig}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isUpdatingConfig ? 'Salvando...' : 'Salvar Configurações de IA'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
