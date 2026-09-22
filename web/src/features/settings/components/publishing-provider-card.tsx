import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Share2, Save, ShieldAlert } from 'lucide-react'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'
import { ZernioSettingsSection } from './zernio-settings-section'
import { useSettings } from '../hooks/use-settings'
import { useUpdateSettings } from '../hooks/use-update-settings'
import { publishingProviderSchema, type PublishingProviderFormData } from '../data/settings.schema'
import type { PublishingProvider } from '../data/settings.types'

export function PublishingProviderCard() {
  const { config, zernio } = useSettings()
  const {
    updateConfig,
    updateZernio,
    discoverAccounts,
    isUpdatingConfig,
    isUpdatingZernio,
    isDiscoveringAccounts,
  } = useUpdateSettings()

  const form = useForm<PublishingProviderFormData>({
    resolver: zodResolver(publishingProviderSchema),
    defaultValues: {
      PUBLISHING_PROVIDER: config?.PUBLISHING_PROVIDER || 'zernio',
      zernioApiKey: '',
      tiktokAccountId: zernio?.accounts?.tiktok || '',
      instagramAccountId: zernio?.accounts?.instagram || '',
      youtubeAccountId: zernio?.accounts?.youtube || '',
      timezone: zernio?.timezone || 'America/Sao_Paulo',
    },
  })

  useEffect(() => {
    if (config?.PUBLISHING_PROVIDER) {
      form.setValue('PUBLISHING_PROVIDER', config.PUBLISHING_PROVIDER)
    }
  }, [config?.PUBLISHING_PROVIDER, form])

  useEffect(() => {
    if (zernio) {
      form.setValue('tiktokAccountId', zernio.accounts?.tiktok || '')
      form.setValue('instagramAccountId', zernio.accounts?.instagram || '')
      form.setValue('youtubeAccountId', zernio.accounts?.youtube || '')
      form.setValue('timezone', zernio.timezone || 'America/Sao_Paulo')
    }
  }, [zernio, form])

  const provider = form.watch('PUBLISHING_PROVIDER')
  const zernioApiKey = form.watch('zernioApiKey') || ''
  const tiktokAccountId = form.watch('tiktokAccountId') || ''
  const instagramAccountId = form.watch('instagramAccountId') || ''
  const youtubeAccountId = form.watch('youtubeAccountId') || ''
  const timezone = form.watch('timezone') || 'America/Sao_Paulo'

  const handleDiscoverAccounts = async () => {
    if (zernioApiKey.trim()) {
      await updateZernio({ api_key: zernioApiKey.trim() })
      form.setValue('zernioApiKey', '')
    }
    const res = await discoverAccounts()
    if (res?.accounts) {
      for (const acc of res.accounts) {
        if (acc.platform === 'tiktok') form.setValue('tiktokAccountId', acc.id)
        if (acc.platform === 'instagram') form.setValue('instagramAccountId', acc.id)
        if (acc.platform === 'youtube') form.setValue('youtubeAccountId', acc.id)
      }
    }
  }

  const onSubmit = form.handleSubmit(async (data) => {
    await updateConfig({ PUBLISHING_PROVIDER: data.PUBLISHING_PROVIDER })
    if (data.PUBLISHING_PROVIDER === 'zernio') {
      const payload: {
        api_key?: string
        accounts: Record<string, string>
        timezone: string
      } = {
        accounts: {
          tiktok: (data.tiktokAccountId || '').trim(),
          instagram: (data.instagramAccountId || '').trim(),
          youtube: (data.youtubeAccountId || '').trim(),
        },
        timezone: (data.timezone || '').trim() || 'America/Sao_Paulo',
      }
      if (data.zernioApiKey && data.zernioApiKey.trim()) {
        payload.api_key = data.zernioApiKey.trim()
      }
      await updateZernio(payload)
      form.setValue('zernioApiKey', '')
    }
  })

  const isPending = isUpdatingConfig || isUpdatingZernio

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Provedores de Publicação Social</CardTitle>
        </div>
        <CardDescription>
          Gerencie o adaptador ativo de agendamento e postagem de vídeos curtos nas redes sociais.
        </CardDescription>
      </CardHeader>

      <form onSubmit={onSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="provider-select"
              className="text-sm font-medium"
            >
              Provedor Ativo
            </Label>
            <Select
              value={provider}
              onValueChange={(val) =>
                form.setValue('PUBLISHING_PROVIDER', val as PublishingProvider)
              }
            >
              <SelectTrigger
                id="provider-select"
                className="w-full sm:w-80"
              >
                <SelectValue placeholder="Selecione o provedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zernio">Zernio Social API (Produção Cloud)</SelectItem>
                <SelectItem value="mock">Mock Offline (Desenvolvimento & Testes)</SelectItem>
              </SelectContent>
            </Select>
            <Typography variant="muted">
              O orquestrador utilizará este adaptador para envio imediato e agendamento contínuo.
            </Typography>
          </div>

          {provider === 'mock' ? (
            <Alert className="bg-muted/40 border-dashed">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-sm font-semibold">Modo Simulado (Mock)</AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Todas as publicações e agendamentos serão salvos em memória com recibos mock de
                sucesso. Nenhuma chamada externa para TikTok, Instagram ou YouTube será realizada.
              </AlertDescription>
            </Alert>
          ) : (
            <ZernioSettingsSection
              apiKey={zernioApiKey}
              setApiKey={(val) => form.setValue('zernioApiKey', val)}
              accounts={{
                tiktok: tiktokAccountId,
                instagram: instagramAccountId,
                youtube: youtubeAccountId,
              }}
              setAccounts={(accs) => {
                form.setValue('tiktokAccountId', accs.tiktok)
                form.setValue('instagramAccountId', accs.instagram)
                form.setValue('youtubeAccountId', accs.youtube)
              }}
              timezone={timezone}
              setTimezone={(val) => form.setValue('timezone', val)}
              onDiscover={handleDiscoverAccounts}
              onClearKey={async () => {
                await updateZernio({ api_key: '' })
                form.setValue('zernioApiKey', '')
              }}
              isDiscovering={isDiscoveringAccounts}
              isConfigured={Boolean(zernio?.configured)}
              maskedKey={zernio?.api_key_masked}
            />
          )}
        </CardContent>

        <CardFooter className="flex justify-end border-t border-border/40 pt-4">
          <Button
            type="submit"
            disabled={isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isPending ? 'Salvando...' : 'Salvar Configurações de Publicação'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
