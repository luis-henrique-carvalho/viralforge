import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render'
import { TemplateStudioView } from './template-studio-view'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    className,
  }: {
    children: React.ReactNode
    to: string
    className?: string
  }) => (
    <a
      href={to}
      className={className}
    >
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
}))

vi.mock('../components/template-canvas-viewport', () => ({
  TemplateCanvasViewport: () => <div data-testid="canvas-viewport">Canvas Viewport Mock</div>,
}))

describe('TemplateStudioView', () => {
  it('renders editor tabs, allows editing and saves changes', async () => {
    renderWithProviders(<TemplateStudioView templateId="curiosities-viral" />)

    // Wait for template to load
    await waitFor(() => {
      expect(screen.getByTestId('canvas-viewport')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Curiosidades & Fatos Virais')).toBeInTheDocument()
      expect(screen.getByText('Visual & Layout')).toBeInTheDocument()
      expect(screen.getByText('Persona & Tarefas IA')).toBeInTheDocument()
    })

    // Edit Name
    const nameInput = screen.getByDisplayValue('Curiosidades & Fatos Virais')
    fireEvent.change(nameInput, { target: { value: 'Curiosidades Editadas' } })

    // Dirty badge appears
    await waitFor(() => {
      expect(screen.getByText('Alterações não salvas')).toBeInTheDocument()
    })

    // Click Save
    const saveBtn = screen.getByRole('button', { name: /Salvar Alterações/i })
    fireEvent.click(saveBtn)

    // Switch to Persona tab
    const personaTab = screen.getByRole('tab', { name: /Persona & Tarefas IA/i })
    fireEvent.click(personaTab)

    // Click Duplicate
    const dupBtn = screen.getByRole('button', { name: /Duplicar/i })
    fireEvent.click(dupBtn)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled()
    })
  })
})
