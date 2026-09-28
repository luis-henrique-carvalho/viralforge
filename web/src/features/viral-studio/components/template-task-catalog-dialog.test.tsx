import { describe, expect, it, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render'
import { TemplateTaskCatalogDialog } from './template-task-catalog-dialog'

describe('TemplateTaskCatalogDialog', () => {
  it('renders catalog items and handles selection', () => {
    const onAddTask = vi.fn()
    const onOpenChange = vi.fn()

    renderWithProviders(
      <TemplateTaskCatalogDialog
        open={true}
        onOpenChange={onOpenChange}
        existingTaskIds={['headline']}
        onAddTask={onAddTask}
      />,
    )

    expect(screen.getByText('Catálogo de Tarefas Modulares de IA')).toBeInTheDocument()
    expect(screen.getByText('Headline no Vídeo')).toBeInTheDocument()
    expect(screen.getByText('Já Adicionada')).toBeInTheDocument()
    expect(screen.getByText('Legenda Completa')).toBeInTheDocument()

    // Select caption
    const addButtons = screen.getAllByRole('button', { name: /Adicionar/i })
    fireEvent.click(addButtons[1]) // click second item
    expect(onAddTask).toHaveBeenCalled()
  })
})
