import { useRef, useState } from 'react'
import {
  Cookie,
  Upload,
  Trash2,
  CheckCircle2,
  XCircle,
  PlaySquare,
  Video,
  Camera,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'
import { useSettings } from '../hooks/use-settings'
import { useUpdateSettings } from '../hooks/use-update-settings'

interface PlatformItem {
  id: 'youtube' | 'tiktok' | 'instagram'
  name: string
  description: string
  icon: typeof PlaySquare
}

const PLATFORMS: PlatformItem[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Evita rate-limiting, captchas e bloqueios de IP ao baixar vídeos e streams.',
    icon: PlaySquare,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Permite descoberta contínua de metadados e download de mídias em alta qualidade.',
    icon: Video,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Garante extração estável de Reels públicos sem throttling de sessão.',
    icon: Camera,
  },
]

export function CookiesManagerCard() {
  const { cookies } = useSettings()
  const { uploadCookies, deleteCookies, isUploadingCookies, isDeletingCookies } =
    useUpdateSettings()
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleTriggerUpload = (platform: string) => {
    setSelectedPlatform(platform)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && selectedPlatform) {
      await uploadCookies({ platform: selectedPlatform, file })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setSelectedPlatform(null)
    }
  }

  const handleDelete = async (platform: string) => {
    await deleteCookies(platform)
  }

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Cookie className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Gerenciador de Cookies de Plataforma</CardTitle>
        </div>
        <CardDescription>
          Envie arquivos de cookies no formato Netscape (cookies.txt) para mitigar bloqueios de
          extração.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Alert className="bg-muted/40 border-dashed">
          <Cookie className="h-4 w-4 text-primary" />
          <AlertTitle className="text-sm font-semibold">Formato Netscape (.txt)</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Exporte os cookies autenticados do seu navegador utilizando extensões padrão (ex:{' '}
            <i>Get cookies.txt LOCALLY</i>). Os arquivos são gravados com permissões restritas
            (0600) e nunca são expostos externamente.
          </AlertDescription>
        </Alert>

        <Input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".txt"
          className="hidden"
          aria-label="Upload Netscape cookies file"
        />

        <div className="space-y-4">
          {PLATFORMS.map((platform) => {
            const Icon = platform.icon
            const isConfigured = Boolean(cookies && cookies[platform.id])

            return (
              <div
                key={platform.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border/60 bg-card/40 p-4 transition-colors hover:bg-card/60"
              >
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Typography variant="h4">{platform.name}</Typography>
                      {isConfigured ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1 font-medium"
                        >
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Configurado
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-muted-foreground flex items-center gap-1"
                        >
                          <XCircle className="h-2.5 w-2.5" />
                          Não Configurado
                        </Badge>
                      )}
                    </div>
                    <Typography
                      variant="muted"
                      className="max-w-lg"
                    >
                      {platform.description}
                    </Typography>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleTriggerUpload(platform.id)}
                    disabled={isUploadingCookies}
                    className="gap-1.5 text-xs"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {isConfigured ? 'Atualizar .txt' : 'Enviar Cookies'}
                  </Button>

                  {isConfigured && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(platform.id)}
                      disabled={isDeletingCookies}
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                      title={`Remover cookies de ${platform.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remover cookies</span>
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
