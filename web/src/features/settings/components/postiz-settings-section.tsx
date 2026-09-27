import { RefreshCw, Sparkles, CheckCircle2, ShieldAlert, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Typography } from '@/components/ui/typography'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ApiKeyInput } from './api-key-input'
import type { PostizIntegrationItem } from '../data/settings.types'

export interface PostizSettingsSectionProps {
  baseUrl: string
  setBaseUrl: (val: string) => void
  apiKey: string
  setApiKey: (val: string) => void
  onDiscover: () => Promise<void>
  onClearKey: () => Promise<void>
  isDiscovering: boolean
  isConfigured: boolean
  maskedKey?: string
  integrationsList?: PostizIntegrationItem[]
}

export function PostizSettingsSection({
  baseUrl,
  setBaseUrl,
  apiKey,
  setApiKey,
  onDiscover,
  onClearKey,
  isDiscovering,
  isConfigured,
  maskedKey,
  integrationsList = [],
}: PostizSettingsSectionProps) {
  const cleanBaseUrl = baseUrl.trim() || 'http://localhost:4007'

  return (
    <Card className="space-y-5 border-border/60 bg-card/40 p-4 shadow-none">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="postiz-base-url-input"
            className="text-xs font-medium"
          >
            URL Base do Postiz (Self-Hosted Docker)
          </Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="postiz-base-url-input"
              placeholder="http://localhost:4007"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="flex-1 font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
              className="gap-1.5 text-xs shrink-0"
            >
              <a
                href={cleanBaseUrl}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="size-3.5" />
                Abrir Painel Postiz
              </a>
            </Button>
          </div>
          <Typography variant="muted">
            Endereço onde a stack do Postiz está exposta (padrão local: http://localhost:4007).
          </Typography>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
          <div className="flex-1">
            <ApiKeyInput
              label="Postiz API Key"
              description="Chave de autenticação gerada nas configurações do Postiz."
              value={apiKey}
              onChange={setApiKey}
              isConfigured={isConfigured}
              maskedValue={maskedKey}
              onClear={onClearKey}
              name="postiz-api-key"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onDiscover}
            disabled={isDiscovering || (!isConfigured && !apiKey.trim())}
            className="gap-2 shrink-0"
          >
            <RefreshCw className={isDiscovering ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            {isDiscovering ? 'Conectando...' : 'Testar Conexão / Sincronizar'}
          </Button>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-border/40">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Canais e Integrações no Postiz ({integrationsList.length})
          </Label>
          <Typography variant="muted">
            O vínculo individual com marcas é gerenciado no Brand Workspace (/brands).
          </Typography>
        </div>

        {integrationsList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {integrationsList.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/70 bg-card/80 shadow-xs"
              >
                <Avatar className="size-9 shrink-0 border border-border">
                  {item.avatar_url && (
                    <AvatarImage
                      src={item.avatar_url}
                      alt={item.name}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs uppercase">
                    {item.platform.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <Typography
                      variant="small"
                      className="font-semibold truncate text-xs"
                    >
                      {item.name}
                    </Typography>
                    <Badge
                      variant="secondary"
                      className="text-[9px] px-1 py-0 h-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 flex items-center gap-0.5 shrink-0"
                    >
                      <CheckCircle2 className="size-2.5" />
                      Conectado
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                    <span className="capitalize font-sans font-medium text-foreground/80">
                      {item.platform}
                    </span>
                    <span>•</span>
                    <span
                      className="truncate max-w-[110px]"
                      title={item.id}
                    >
                      {item.id}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-4 text-center space-y-1.5">
            <ShieldAlert className="size-5 text-muted-foreground mx-auto" />
            <Typography
              variant="small"
              className="font-medium text-xs"
            >
              Nenhum canal social sincronizado ainda
            </Typography>
            <Typography
              variant="muted"
              className="text-[11px] max-w-sm mx-auto"
            >
              Configure sua API Key e clique em &quot;Testar Conexão / Sincronizar&quot; para
              validar o acesso à sua instância do Postiz.
            </Typography>
          </div>
        )}
      </div>
    </Card>
  )
}
