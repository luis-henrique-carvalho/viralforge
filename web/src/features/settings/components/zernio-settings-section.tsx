import { RefreshCw, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ApiKeyInput } from './api-key-input'

export interface ZernioAccountsState {
  tiktok: string
  instagram: string
  youtube: string
}

export interface ZernioSettingsSectionProps {
  apiKey: string
  setApiKey: (val: string) => void
  accounts: ZernioAccountsState
  setAccounts: (accounts: ZernioAccountsState) => void
  timezone: string
  setTimezone: (val: string) => void
  onDiscover: () => Promise<void>
  onClearKey: () => Promise<void>
  isDiscovering: boolean
  isConfigured: boolean
  maskedKey?: string
}

export function ZernioSettingsSection({
  apiKey,
  setApiKey,
  accounts,
  setAccounts,
  timezone,
  setTimezone,
  onDiscover,
  onClearKey,
  isDiscovering,
  isConfigured,
  maskedKey,
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="space-y-2">
          <Label
            htmlFor="tiktok-id"
            className="text-xs font-medium flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" /> TikTok Account ID
          </Label>
          <Input
            id="tiktok-id"
            placeholder="Ex: acc_tiktok_123"
            value={accounts.tiktok}
            onChange={(e) => setAccounts({ ...accounts, tiktok: e.target.value })}
            className="font-mono text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="instagram-id"
            className="text-xs font-medium flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Instagram Account ID
          </Label>
          <Input
            id="instagram-id"
            placeholder="Ex: acc_instagram_456"
            value={accounts.instagram}
            onChange={(e) => setAccounts({ ...accounts, instagram: e.target.value })}
            className="font-mono text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="youtube-id"
            className="text-xs font-medium flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" /> YouTube Account ID
          </Label>
          <Input
            id="youtube-id"
            placeholder="Ex: acc_youtube_789"
            value={accounts.youtube}
            onChange={(e) => setAccounts({ ...accounts, youtube: e.target.value })}
            className="font-mono text-xs"
          />
        </div>
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
