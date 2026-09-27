import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render'
import { BrandWorkspaceView } from './brand-workspace-view'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    params,
    search,
    className,
  }: {
    children: React.ReactNode
    to: string
    params?: any
    search?: any
    className?: string
  }) => (
    <a
      href={to}
      className={className}
      data-params={JSON.stringify(params)}
      data-search={JSON.stringify(search)}
    >
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}))

describe('BrandWorkspaceView Integration', () => {
  it('renders workspace hero, tabs and switches between tabs', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BrandWorkspaceView brandId="vale-o-clique" />)

    // Wait for hero to load from MSW
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Vale o Clique?' })).toBeInTheDocument()
      expect(screen.getByText('@valeoclique')).toBeInTheDocument()
      expect(screen.getByText(/Motor Ativo: postiz/i)).toBeInTheDocument()
    })

    // Verify 4 tabs exist
    expect(screen.getByRole('tab', { name: /1\. Canais Sociais/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /2\. Vídeos da Marca/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /3\. Agenda & Fila/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /4\. Configurações da Marca/i })).toBeInTheDocument()

    // Default tab is 1. Canais Sociais
    expect(screen.getByText('Canais Sociais Conectados')).toBeInTheDocument()

    // Switch to Tab 2: Vídeos da Marca
    const videosTab = screen.getByRole('tab', { name: /2\. Vídeos da Marca/i })
    await user.click(videosTab)
    await waitFor(() => {
      expect(screen.getByText('Todos')).toBeInTheDocument()
      expect(screen.getByText('Prontos p/ Revisão')).toBeInTheDocument()
    })

    // Switch to Tab 3: Agenda & Fila
    const scheduleTab = screen.getByRole('tab', { name: /3\. Agenda & Fila/i })
    await user.click(scheduleTab)
    await waitFor(() => {
      expect(screen.getByText('Agenda de Postagens & Linha do Tempo')).toBeInTheDocument()
    })

    // Switch to Tab 4: Configurações da Marca
    const settingsTab = screen.getByRole('tab', { name: /4\. Configurações da Marca/i })
    await user.click(settingsTab)
    await waitFor(() => {
      expect(screen.getByText('Motor de Publicação & Provedor')).toBeInTheDocument()
      expect(screen.getByText(/Grade de Postagens Diárias/i)).toBeInTheDocument()
      expect(screen.getByText('Identidade & Diretrizes Editoriais')).toBeInTheDocument()
    })
  })

  it('renders error state for non-existent brand', async () => {
    renderWithProviders(<BrandWorkspaceView brandId="non-existent-brand" />)

    await waitFor(() => {
      expect(screen.getByText('Marca não encontrada')).toBeInTheDocument()
    })
  })
})
