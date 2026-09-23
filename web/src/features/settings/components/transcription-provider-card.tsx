import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mic, Save, AudioWaveform, Info } from 'lucide-react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'
import { ApiKeyInput } from './api-key-input'
import { useSettings } from '../hooks/use-settings'
import { useUpdateSettings } from '../hooks/use-update-settings'
import {
  transcriptionProviderSchema,
  type TranscriptionProviderFormData,
} from '../data/settings.schema'
import type { TranscriptionProvider } from '../data/settings.types'

export function TranscriptionProviderCard() {
  const { config } = useSettings()
  const { updateConfig, isUpdatingConfig } = useUpdateSettings()

  const form = useForm<TranscriptionProviderFormData>({
    resolver: zodResolver(transcriptionProviderSchema),
    defaultValues: {
      TRANSCRIPTION_PROVIDER: config?.TRANSCRIPTION_PROVIDER || 'deepgram',
      DEEPGRAM_API_KEY: '',
      ELEVENLABS_API_KEY: '',
      HF_TOKEN: '',
    },
  })

  useEffect(() => {
    if (config?.TRANSCRIPTION_PROVIDER) {
      form.setValue('TRANSCRIPTION_PROVIDER', config.TRANSCRIPTION_PROVIDER)
    }
  }, [config?.TRANSCRIPTION_PROVIDER, form])

  const provider = form.watch('TRANSCRIPTION_PROVIDER')
  const deepgramKey = form.watch('DEEPGRAM_API_KEY') || ''
  const elevenlabsKey = form.watch('ELEVENLABS_API_KEY') || ''
  const hfToken = form.watch('HF_TOKEN') || ''

  const onSubmit = form.handleSubmit(async (data) => {
    const payload: Record<string, string> = {
      TRANSCRIPTION_PROVIDER: data.TRANSCRIPTION_PROVIDER,
    }
    if (data.DEEPGRAM_API_KEY && data.DEEPGRAM_API_KEY.trim()) {
      payload.DEEPGRAM_API_KEY = data.DEEPGRAM_API_KEY.trim()
    }
    if (data.ELEVENLABS_API_KEY && data.ELEVENLABS_API_KEY.trim()) {
      payload.ELEVENLABS_API_KEY = data.ELEVENLABS_API_KEY.trim()
    }
    if (data.HF_TOKEN && data.HF_TOKEN.trim()) {
      payload.HF_TOKEN = data.HF_TOKEN.trim()
    }
    await updateConfig(payload)
    form.setValue('DEEPGRAM_API_KEY', '')
    form.setValue('ELEVENLABS_API_KEY', '')
    form.setValue('HF_TOKEN', '')
  })

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Provedores de Transcrição & Áudio</CardTitle>
        </div>
        <CardDescription>
          Gerencie o motor de extração de legendas, pontuação por palavras e diarização de
          locutores.
        </CardDescription>
      </CardHeader>

      <form onSubmit={onSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="stt-provider-select"
              className="text-sm font-medium"
            >
              Provedor Primário de STT (Speech-to-Text)
            </Label>
            <Select
              value={provider}
              onValueChange={(val) =>
                form.setValue('TRANSCRIPTION_PROVIDER', val as TranscriptionProvider)
              }
            >
              <SelectTrigger
                id="stt-provider-select"
                className="w-full sm:w-80"
              >
                <SelectValue placeholder="Selecione o provedor de transcrição" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deepgram">
                  Deepgram Nova-3 (Nuvem / Alta Fidelidade & Velocidade)
                </SelectItem>
                <SelectItem value="elevenlabs">
                  ElevenLabs Scribe (Nuvem / Tags de Eventos de Áudio)
                </SelectItem>
                <SelectItem value="whisper">
                  Whisper Local (Inference On-Premise / GPU/CPU)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Alert className="bg-muted/40 border-dashed">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
              Caso o provedor de nuvem falhe ou atinja limites de requisição, o pipeline executará
              automaticamente o fallback transparente para o motor Whisper local.
            </AlertDescription>
          </Alert>

          <Card className="space-y-5 border-border/60 bg-card/40 p-4 shadow-none">
            <div className="flex items-center gap-2">
              <AudioWaveform className="h-4 w-4 text-primary" />
              <Typography variant="h4">Credenciais dos Provedores</Typography>
            </div>

            <div className="space-y-4">
              <ApiKeyInput
                label="Deepgram API Key"
                description="Utilizada para o modelo Nova-3 com alinhamento preciso de timestamps por palavra."
                value={deepgramKey}
                onChange={(val) => form.setValue('DEEPGRAM_API_KEY', val)}
                isConfigured={Boolean(config?.DEEPGRAM_API_KEY)}
                maskedValue={config?.DEEPGRAM_API_KEY}
                onClear={async () => {
                  await updateConfig({ DEEPGRAM_API_KEY: '' })
                  form.setValue('DEEPGRAM_API_KEY', '')
                }}
                name="deepgram-key"
              />

              <ApiKeyInput
                label="ElevenLabs API Key"
                description="Utilizada para transcrição Scribe e enriquecimento de contexto auditivo."
                value={elevenlabsKey}
                onChange={(val) => form.setValue('ELEVENLABS_API_KEY', val)}
                isConfigured={Boolean(config?.ELEVENLABS_API_KEY)}
                maskedValue={config?.ELEVENLABS_API_KEY}
                onClear={async () => {
                  await updateConfig({ ELEVENLABS_API_KEY: '' })
                  form.setValue('ELEVENLABS_API_KEY', '')
                }}
                name="elevenlabs-key"
              />

              <ApiKeyInput
                label="HuggingFace Token (HF_TOKEN)"
                description="Token com acesso ao modelo pyannote/speaker-diarization para identificação de falantes no Whisper."
                value={hfToken}
                onChange={(val) => form.setValue('HF_TOKEN', val)}
                isConfigured={Boolean(config?.HF_TOKEN)}
                maskedValue={config?.HF_TOKEN}
                onClear={async () => {
                  await updateConfig({ HF_TOKEN: '' })
                  form.setValue('HF_TOKEN', '')
                }}
                name="hf-token"
              />
            </div>
          </Card>
        </CardContent>

        <CardFooter className="flex justify-end border-t border-border/40 pt-4">
          <Button
            type="submit"
            disabled={isUpdatingConfig}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isUpdatingConfig ? 'Salvando...' : 'Salvar Configurações de Transcrição'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
