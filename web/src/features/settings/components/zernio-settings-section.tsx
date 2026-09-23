import { RefreshCw, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Typography } from '@/components/ui/typography'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ApiKeyInput } from './api-key-input'
import type { ZernioAccountItem } from '../data/settings.types'

export interface ZernioSettingsSectionProps {
  apiKey: string
  setApiKey: (val: string) => void
  timezone: string
  setTimezone: (val: string) => void
  onDiscover: () => Promise<void>
  onClearKey: () => Promise<void>
  isDiscovering: boolean
  isConfigured: boolean
  maskedKey?: string
  accountsList?: ZernioAccountItem[]
}

export function ZernioSettingsSection({
  apiKey,
  setApiKey,
  timezone,
  setTimezone,
  onDiscover,
  onClearKey,
  isDiscovering,
  isConfigured,
  maskedKey,
  accountsList = [],
}: ZernioSettingsSectionProps) {
  return (
    <Card className="space-y-5 border-border/60 bg-card/40 p-4 shadow-none">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex-1">
          <ApiKeyInput
            label="Zernio API Key"
            description="Chave de autenticação Bearer da sua organização no Zernio."
            value={apiKey}
            onChange={setApiKey}
            isConfigured={isConfigured}
            maskedValue={maskedKey}
            onClear={onClearKey}
            name="zernio-api-key"
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
          {isDiscovering ? 'Buscando...' : 'Descobrir Contas'}
        </Button>
      </div>

      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Contas Conectadas na Organização ({accountsList.length})
          </Label>
          <Typography
            variant="muted"
            className="text-[11px]"
          >
            O vínculo com marcas é feito na tela de Marcas (/brands).
          </Typography>
        </div>

        {accountsList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {accountsList.map((acc) => {
              const accId = acc.id || acc._id || acc.accountId || ''
              const name = acc.name || acc.displayName || acc.username || accId
              const platform = (acc.platform || 'unknown').toLowerCase()
              const avatarUrl = acc.avatar_url || acc.avatarUrl

              return (
                <div
                  key={accId}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/70 bg-card/80 shadow-xs"
                >
                  <Avatar className="size-9 shrink-0 border border-border">
                    {avatarUrl && (
                      <AvatarImage
                        src={avatarUrl}
                        alt={name}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs uppercase">
                      {platform.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <Typography
                        variant="small"
                        className="font-semibold truncate text-xs"
                      >
                        {name}
                      </Typography>
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1 py-0 h-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 flex items-center gap-0.5 shrink-0"
                      >
                        <CheckCircle2 className="size-2.5" />
                        Ativo
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                      <span className="capitalize font-sans font-medium text-foreground/80">
                        {platform}
                      </span>
                      <span>•</span>
                      <span
                        className="truncate max-w-[110px]"
                        title={accId}
                      >
                        {accId}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-4 text-center space-y-1.5">
            <ShieldAlert className="size-5 text-muted-foreground mx-auto" />
            <Typography
              variant="small"
              className="font-medium text-xs"
            >
              Nenhuma conta descoberta na organização ainda
            </Typography>
            <Typography
              variant="muted"
              className="text-[11px] max-w-sm mx-auto"
            >
              Clique em &quot;Descobrir Contas&quot; acima para sincronizar seus canais do
              Instagram, TikTok e YouTube configurados no Zernio.
            </Typography>
          </div>
        )}
      </div>

      <div className="space-y-2 pt-2">
        <Label
          htmlFor="timezone-input"
          className="text-xs font-medium"
        >
          Fuso Horário Padrão para Agendamento
        </Label>
        <Input
          id="timezone-input"
          placeholder="America/Sao_Paulo"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="max-w-xs font-mono text-xs"
        />
      </div>
    </Card>
  )
}
