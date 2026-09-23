// shadcn-ignore: layout
import { useState } from 'react'
import { Bot, Plus, Sparkles, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Typography } from '@/components/ui/typography'
import { TemplateAiTestSection } from './template-ai-test-section'
import { TemplateTaskCatalogDialog } from './template-task-catalog-dialog'
import type { GenerationTask, VisualTemplate } from '../data/template.types'

interface TemplatePersonaTabProps {
  template: VisualTemplate
  onChange: (field: keyof VisualTemplate, value: unknown) => void
}

export function TemplatePersonaTab({ template, onChange }: TemplatePersonaTabProps) {
  const [catalogOpen, setCatalogOpen] = useState(false)

  const tasks = template.generation_tasks || []

  const handleAddTask = (newTask: GenerationTask) => {
    onChange('generation_tasks', [...tasks, newTask])
  }

  const handleRemoveTask = (taskId: string) => {
    onChange(
      'generation_tasks',
      tasks.filter((t) => t.id !== taskId),
    )
  }

  const handleUpdateTaskInstruction = (taskId: string, instruction: string) => {
    onChange(
      'generation_tasks',
      tasks.map((t) => (t.id === taskId ? { ...t, instruction } : t)),
    )
  }

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Nicho & Objetivo de Conversão */}
      <div className="space-y-3 rounded-lg border border-border/60 bg-card/50 p-4">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <Typography
            variant="small"
            className="font-semibold text-foreground"
          >
            Estratégia Editorial & Nicho
          </Typography>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs">Nicho do Canal</Label>
            <Select
              value={template.niche_type}
              onValueChange={(v) => onChange('niche_type', v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="curiosities">🌟 Curiosidades & Mistérios</SelectItem>
                <SelectItem value="affiliate">🛍️ Achadinhos & Ofertas</SelectItem>
                <SelectItem value="news">📰 Notícias & Fatos Rápidos</SelectItem>
                <SelectItem value="tech">⚡ Tech & Gadgets</SelectItem>
                <SelectItem value="custom">🎯 Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Objetivo de Conversão</Label>
            <Select
              value={template.conversion_goal}
              onValueChange={(v) => onChange('conversion_goal', v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="engagement">🔥 Engajamento Puro (Sem Links)</SelectItem>
                <SelectItem value="affiliate">🛒 Afiliado / Vendas</SelectItem>
                <SelectItem value="keyword_direct">💬 Comentário / DM</SelectItem>
                <SelectItem value="lead_capture">🎯 Captura de Leads</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <Label className="text-xs">Papel / Persona da IA</Label>
          <Input
            value={template.persona_role}
            onChange={(e) => onChange('persona_role', e.target.value)}
            placeholder="Ex: Roteirista investigativo especialista em ciência e mistérios..."
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Tom de Voz</Label>
          <Input
            value={template.tone_of_voice}
            onChange={(e) => onChange('tone_of_voice', e.target.value)}
            placeholder="Ex: Intrigante, misterioso, dinâmico..."
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Chamada para Ação Padrão (CTA)</Label>
          <Input
            value={template.call_to_action_template || ''}
            onChange={(e) => onChange('call_to_action_template', e.target.value)}
            placeholder="Ex: Qual desses fatos você já sabia? Comente e siga!"
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* 2. Gerenciador Modular de Tarefas de IA */}
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
            onClick={() => setCatalogOpen(true)}
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
                    onClick={() => handleRemoveTask(task.id)}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <Textarea
                  value={task.instruction}
                  onChange={(e) => handleUpdateTaskInstruction(task.id, e.target.value)}
                  rows={2}
                  className="text-xs resize-none bg-background/60"
                  placeholder="Instrução para a IA com suporte a {transcript}, {cta}, etc."
                />
              </CardContent>
            </Card>
          ))}

          {tasks.length === 0 && (
            <div className="rounded-lg border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground">
              Nenhuma tarefa de IA configurada. Clique em "+ Adicionar Tarefa" para selecionar do
              catálogo.
            </div>
          )}
        </div>
      </div>

      {/* 3. Seção de Teste em Tempo Real */}
      <TemplateAiTestSection template={template} />

      <TemplateTaskCatalogDialog
        open={catalogOpen}
        onOpenChange={setCatalogOpen}
        existingTaskIds={tasks.map((t) => t.id)}
        onAddTask={handleAddTask}
      />
    </div>
  )
}
