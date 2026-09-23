import { useState } from 'react'
import { Check, Plus, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Typography } from '@/components/ui/typography'
import { DEFAULT_TASK_CATALOG } from '../data/template.schema'
import type { GenerationTask } from '../data/template.types'

interface TemplateTaskCatalogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingTaskIds: string[]
  onAddTask: (task: GenerationTask) => void
}

export function TemplateTaskCatalogDialog({
  open,
  onOpenChange,
  existingTaskIds,
  onAddTask,
}: TemplateTaskCatalogDialogProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const handleSelect = (catalogItem: (typeof DEFAULT_TASK_CATALOG)[number]) => {
    const isAlreadyAdded = existingTaskIds.includes(catalogItem.id)
    const finalId = isAlreadyAdded
      ? `${catalogItem.id}_${Date.now().toString().slice(-4)}`
      : catalogItem.id

    onAddTask({
      id: finalId,
      label: catalogItem.label,
      target: catalogItem.target,
      instruction: catalogItem.instruction,
      output_type: catalogItem.output_type,
      is_required: true,
    })
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <DialogTitle>Catálogo de Tarefas Modulares de IA</DialogTitle>
          </div>
          <DialogDescription>
            Selecione uma tarefa pronta para adicionar ao fluxo de geração automática deste
            template.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-2">
          <div className="grid gap-2">
            {DEFAULT_TASK_CATALOG.map((item) => {
              const isAdded = existingTaskIds.includes(item.id)
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedTaskId(item.id)}
                  className={`group flex cursor-pointer items-start justify-between rounded-lg border p-3 transition-all ${
                    selectedTaskId === item.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border/60 bg-card hover:border-primary/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Typography
                        variant="small"
                        className="font-semibold text-foreground"
                      >
                        {item.label}
                      </Typography>
                      <Badge
                        variant="outline"
                        className="text-[10px]"
                      >
                        {item.target}
                      </Badge>
                      {isAdded && (
                        <Badge
                          variant="secondary"
                          className="gap-1 text-[10px]"
                        >
                          <Check className="h-2.5 w-2.5" />
                          Já Adicionada
                        </Badge>
                      )}
                    </div>
                    <Typography
                      variant="muted"
                      className="text-xs line-clamp-1"
                    >
                      {item.description}
                    </Typography>
                    <Typography
                      variant="inlineCode"
                      className="block text-[11px] text-muted-foreground"
                    >
                      {item.instruction}
                    </Typography>
                  </div>

                  <Button
                    size="sm"
                    variant={selectedTaskId === item.id ? 'default' : 'outline'}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelect(item)
                    }}
                    className="h-8 shrink-0 text-xs gap-1 ml-3"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar
                  </Button>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Typography
            variant="muted"
            className="text-xs"
          >
            Tags dinâmicas suportadas: <code className="text-primary">{`{transcript}`}</code>,{' '}
            <code className="text-primary">{`{cta}`}</code>,{' '}
            <code className="text-primary">{`{brand_name}`}</code>
          </Typography>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
