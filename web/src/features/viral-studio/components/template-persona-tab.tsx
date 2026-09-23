// shadcn-ignore: composite-tab
import { useState } from 'react'
import { TemplatePersonaStrategySection } from './template-persona-strategy-section'
import { TemplatePersonaTasksSection } from './template-persona-tasks-section'
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
      {/* 1. Nicho, Persona & Estratégia Editorial */}
      <TemplatePersonaStrategySection
        template={template}
        onChange={onChange}
      />

      {/* 2. Gerenciador Modular de Tarefas de IA */}
      <TemplatePersonaTasksSection
        tasks={tasks}
        onOpenCatalog={() => setCatalogOpen(true)}
        onRemoveTask={handleRemoveTask}
        onUpdateInstruction={handleUpdateTaskInstruction}
      />

      {/* 3. Seção de Teste de IA com Amostra */}
      <TemplateAiTestSection template={template} />

      {/* Catálogo de Tarefas Modal */}
      <TemplateTaskCatalogDialog
        open={catalogOpen}
        onOpenChange={setCatalogOpen}
        onAddTask={handleAddTask}
        existingTaskIds={tasks.map((t) => t.id)}
      />
    </div>
  )
}
