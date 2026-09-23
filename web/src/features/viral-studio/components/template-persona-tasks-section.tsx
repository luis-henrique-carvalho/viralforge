import { Plus, Sparkles, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Typography } from '@/components/ui/typography'
import type { GenerationTask } from '../data/template.types'

interface TemplatePersonaTasksSectionProps {
  tasks: GenerationTask[]
  onOpenCatalog: () => void
  onRemoveTask: (id: string) => void
  onUpdateInstruction: (id: string, instruction: string) => void
}

export function TemplatePersonaTasksSection({
  tasks,
  onOpenCatalog,
  onRemoveTask,
  onUpdateInstruction,
}: TemplatePersonaTasksSectionProps) {
  return (
    // shadcn-ignore: layout
    <div className="space-y-3 rounded-lg border border-border/60 bg-card/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <Typography
            variant="small"
            className="font-semibold text-foreground"
          >
            Tarefas Modulares de Geração ({tasks.length})
          </Typography>
        </div>
        <Button
          size="sm"
          onClick={onOpenCatalog}
          className="h-7 gap-1 text-xs font-semibold"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar Tarefa
        </Button>
      </div>

      <Typography
        variant="muted"
        className="text-xs"
      >
        O modelo de linguagem executa exclusivamente as tarefas ativas abaixo ao gerar a cópia do
        vídeo.
      </Typography>

      {tasks.length === 0 ? (
        // shadcn-ignore: layout
        <div className="rounded-md border border-dashed border-border/80 p-4 text-center">
          <Typography
            variant="muted"
            className="text-xs"
          >
            Nenhuma tarefa de IA configurada. Clique em &quot;Adicionar Tarefa&quot; para definir as
            saídas da IA.
          </Typography>
        </div>
      ) : (
        <div className="space-y-2.5 pt-2">
          {tasks.map((task) => (
            <Card
              key={task.id}
              className="border-border/60 bg-card p-3 shadow-none"
            >
              <CardContent className="space-y-2 p-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Typography
                      variant="small"
                      className="font-semibold text-xs text-foreground"
                    >
                      {task.label}
                    </Typography>
                    <Badge
                      variant="outline"
                      className="text-[10px]"
                    >
                      {task.target}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveTask(task.id)}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <Textarea
                  value={task.instruction}
                  onChange={(e) => onUpdateInstruction(task.id, e.target.value)}
                  rows={2}
                  className="text-xs resize-none bg-background/60"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
