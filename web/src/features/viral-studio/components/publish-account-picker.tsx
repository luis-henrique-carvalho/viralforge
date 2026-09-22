import { CheckCircle2, Layers, Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { SocialAccount } from '../data/publishing.types'

export interface PublishAccountPickerProps {
  accounts: SocialAccount[]
  isLoading: boolean
  activeAccount?: SocialAccount
  onSelectAccount: (id: string) => void
}

export function PublishAccountPicker({
  accounts,
  isLoading,
  activeAccount,
  onSelectAccount,
}: PublishAccountPickerProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold flex items-center gap-2">
        <Layers className="size-4 text-muted-foreground" />
        Conta / Canal de Destino
      </Label>
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 className="size-4 animate-spin" /> Carregando contas conectadas...
        </div>
      ) : accounts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {accounts.map((acc) => {
            const isSelected = (activeAccount?.id || '') === acc.id
            return (
              <Button
                key={acc.id}
                type="button"
                variant="outline"
                onClick={() => onSelectAccount(acc.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all h-auto justify-start font-normal whitespace-normal ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-muted-foreground/30 bg-card'
                }`}
              >
                <div className="size-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs capitalize text-primary">
                  {acc.platform.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{acc.name}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">{acc.platform}</p>
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
