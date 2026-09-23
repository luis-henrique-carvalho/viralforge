import { CheckCircle2, Layers, Loader2, Sparkles } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import type { SocialAccount } from '../data/publishing.types'

export interface PublishAccountPickerProps {
  accounts: SocialAccount[]
  isLoading: boolean
  selectedAccountIds: string[]
  onToggleAccount: (id: string) => void
  brandProfiles?: Record<string, any>
}

export function PublishAccountPicker({
  accounts,
  isLoading,
  selectedAccountIds,
  onToggleAccount,
  brandProfiles = {},
}: PublishAccountPickerProps) {
  const brandLinkedIds = new Set(
    Object.values(brandProfiles)
      .map((p: any) => p?.account_id)
      .filter(Boolean),
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Layers className="size-4 text-muted-foreground" />
          Contas / Canais de Destino ({selectedAccountIds.length} selecionado
          {selectedAccountIds.length !== 1 ? 's' : ''})
        </Label>
        {brandLinkedIds.size > 0 && (
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="size-3 text-primary" />
            Canais da marca pré-selecionados
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span>Carregando canais conectados...</span>
        </div>
      ) : accounts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {accounts.map((acc) => {
            const isSelected = selectedAccountIds.includes(acc.id)
            const isBrandLinked = brandLinkedIds.has(acc.id)

            return (
              <Button
                key={acc.id}
                type="button"
                variant="outline"
                onClick={() => onToggleAccount(acc.id)}
                className={`relative flex items-center gap-3 p-3 rounded-lg border text-left transition-all h-auto justify-start font-normal whitespace-normal ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-muted-foreground/30 bg-card'
                }`}
              >
                <Avatar className="size-8 shrink-0 border border-border">
                  {acc.avatar_url && (
                    <AvatarImage
                      src={acc.avatar_url}
                      alt={acc.name}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="bg-muted text-primary font-bold text-xs uppercase">
                    {acc.platform.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <Typography
                      variant="small"
                      className="font-semibold truncate text-xs"
                    >
                      {acc.name}
                    </Typography>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Typography
                      variant="muted"
                      className="capitalize text-[11px]"
                    >
                      {acc.platform}
                    </Typography>
                    {isBrandLinked && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1 py-0 h-3.5 bg-primary/15 text-primary border-0"
                      >
                        Marca
                      </Badge>
                    )}
                  </div>
                </div>
                {isSelected && <CheckCircle2 className="size-4 text-primary shrink-0" />}
              </Button>
            )
          })}
        </div>
      ) : (
        <Alert className="bg-muted/40 border-dashed text-xs text-muted-foreground">
          <AlertDescription className="text-xs text-muted-foreground">
            Nenhuma conta oficial vinculada. O modo de demonstração Mock será utilizado.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
