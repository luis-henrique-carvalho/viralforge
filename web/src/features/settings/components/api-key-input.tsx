import { useState } from 'react'
import { Eye, EyeOff, KeyRound, Trash2, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ApiKeyInputProps {
  label: string
  description?: string
  value: string
  onChange: (value: string) => void
  isConfigured?: boolean
  maskedValue?: string
  onClear?: () => void
  placeholder?: string
  disabled?: boolean
  name?: string
  error?: string
}

export function ApiKeyInput({
  label,
  description,
  value,
  onChange,
  isConfigured = false,
  maskedValue,
  onClear,
  placeholder = 'Cole sua chave de API aqui...',
  disabled = false,
  name,
  error,
}: ApiKeyInputProps) {
  const [showSecret, setShowSecret] = useState(false)

  const effectivePlaceholder = isConfigured
    ? maskedValue || 'Chave configurada no servidor (••••••••)'
    : placeholder

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label
          htmlFor={name}
          className="text-sm font-medium text-foreground flex items-center gap-2"
        >
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          {label}
        </Label>
        {isConfigured && (
          <Badge
            variant="outline"
            className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1 font-medium"
          >
            <CheckCircle2 className="h-3 w-3" />
            Configurado
          </Badge>
        )}
      </div>

      {description && (
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      )}

      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            id={name}
            name={name}
            type={showSecret ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={effectivePlaceholder}
            disabled={disabled}
            className="pr-10 font-mono text-xs"
            autoComplete="off"
            spellCheck={false}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowSecret(!showSecret)}
            disabled={disabled}
            className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
            title={showSecret ? 'Ocultar chave' : 'Mostrar chave'}
          >
            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="sr-only">{showSecret ? 'Ocultar chave' : 'Mostrar chave'}</span>
          </Button>
        </div>

        {(isConfigured || value) && onClear && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onClear}
            disabled={disabled}
            className="text-muted-foreground hover:text-destructive shrink-0"
            title="Limpar chave"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Limpar chave</span>
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
    </div>
  )
}
