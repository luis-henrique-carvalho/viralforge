import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render'
import { BatchResultsView } from './batch-results-view'

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

describe('BatchResultsView Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads batch details, displays video cards, and supports search filtering', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BatchResultsView batchId="batch-101" />)

    // Wait for batch header and items to load from MSW
    await waitFor(() => {
      expect(screen.getByText(/batch-101/)).toBeInTheDocument()
      expect(screen.getByText('PROD-01')).toBeInTheDocument()
    })

    // Verify item count tabs
    expect(screen.getByText(/Todos/)).toBeInTheDocument()
    expect(screen.getByText(/Prontos/)).toBeInTheDocument()
    expect(screen.getByText(/Falhas/)).toBeInTheDocument()

    // Test search filter
    const searchInput = screen.getByPlaceholderText(/Buscar por código, copy ou link/i)
    await user.type(searchInput, 'magnético')
    expect(screen.getByText('PROD-01')).toBeInTheDocument()
    expect(screen.queryByText('PROD-02')).not.toBeInTheDocument()
    expect(screen.queryByText('PROD-03')).not.toBeInTheDocument()

    // Clear search
    await user.clear(searchInput)
    expect(screen.getByText('PROD-02')).toBeInTheDocument()
    expect(screen.getByText('PROD-03')).toBeInTheDocument()
  })

  it('opens item inspection sheet on clicking Logs', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BatchResultsView batchId="batch-101" />)

    await waitFor(() => {
      expect(screen.getByText('PROD-01')).toBeInTheDocument()
    })

    const logButtons = screen.getAllByText('Logs')
    await user.click(logButtons[0])

    // Inspection sheet opens
    await waitFor(() => {
      expect(screen.getByText('Copy & Ganchos')).toBeInTheDocument()
      expect(screen.getByText('Telemetria IA')).toBeInTheDocument()
    })
  })

  it('navigates to dedicated item editor page on clicking Editar button or headline', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BatchResultsView batchId="batch-101" />)

    await waitFor(() => {
      expect(screen.getByText('PROD-01')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByText('Editar')
    await user.click(editButtons[0])

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/viral-studio/$id/items/$itemId',
      params: { id: 'batch-101', itemId: 'item-1' },
    })
  })

  it('supports multi-selection and bulk actions bar', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BatchResultsView batchId="batch-101" />)

    await waitFor(() => {
      expect(screen.getByText('PROD-01')).toBeInTheDocument()
    })

    // Click 'Ações em Massa'
    await user.click(screen.getByText('Ações em Massa'))

    // Checkboxes appear for selectable items
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThan(0)

    // Select first item
    await user.click(checkboxes[0])

    // Bulk actions bar appears
    expect(screen.getByText('1 vídeo selecionado')).toBeInTheDocument()
    expect(screen.getByText('Aprovar (1)')).toBeInTheDocument()

    // Select all
    await user.click(screen.getByText(/Selecionar todos/i))
    expect(screen.getByText('3 vídeos selecionados')).toBeInTheDocument()

    // Deselect all
    await user.click(screen.getByText(/Desmarcar todos/i))
    expect(screen.queryByText('Aprovar (3)')).not.toBeInTheDocument()

    // Toggle off selection mode
    await user.click(screen.getByText('Modo Seleção (0)'))
  })

  it('renders not found state on non-existent batch', async () => {
    renderWithProviders(<BatchResultsView batchId="non-existent" />)

    await waitFor(() => {
      expect(screen.getByText('Lote não encontrado')).toBeInTheDocument()
    })
  })
})
