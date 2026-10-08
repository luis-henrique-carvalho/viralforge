import { ArrowLeft, Copy, Save } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { VisualTemplate } from '../data/template.types'

interface TemplateStudioHeaderProps {
  template: VisualTemplate
  isDirty: boolean
  isSaving: boolean
  isDuplicating: boolean
  onBack: () => void
  onNameChange: (name: string) => void
  onDuplicate: () => void
  onSave: () => void
}

export function TemplateStudioHeader({
  template,
  isDirty,
  isSaving,
  isDuplicating,
  onBack,
  onNameChange,
  onDuplicate,
  onSave,
}: TemplateStudioHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 gap-1.5 text-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          Galeria
        </Button>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-2">
          <Input
            value={template.name}
            onChange={(e) => onNameChange(e.target.value)}
            className="h-8 text-sm font-bold max-w-[280px] bg-background"
          />
          {template.is_system ? (
            <Badge
              variant="secondary"
              className="text-[10px] bg-primary/10 text-primary border-primary/20"
            >
              FÁBRICA
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-[10px]"
            >
              CUSTOM
            </Badge>
          )}
          {isDirty && (
            <Badge
              variant="secondary"
              className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20"
            >
              Alterações não salvas
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDuplicate}
          disabled={isDuplicating}
          className="h-8 gap-1.5 text-xs"
        >
          <Copy className="h-3.5 w-3.5" />
          Duplicar
        </Button>

        <Button
          size="sm"
          onClick={onSave}
          disabled={isSaving || !isDirty}
          className="h-8 gap-1.5 text-xs font-semibold shadow-sm"
        >
          <Save className="h-3.5 w-3.5" />
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </div>
  )
}
