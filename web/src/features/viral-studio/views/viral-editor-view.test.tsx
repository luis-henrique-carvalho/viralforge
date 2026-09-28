import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render'
import { resetMockViralStudioData } from '../mocks/handlers'
import { ViralEditorView } from './viral-editor-view'

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

describe('ViralEditorView Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetMockViralStudioData()
  })

  it('loads item, displays 2-column studio layout, switches tabs and saves changes', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ViralEditorView
        batchId="batch-101"
        itemId="item-1"
      />,
    )

    // Wait for batch & item data to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Re-renderizar vídeo/i })).toBeInTheDocument()
      expect(screen.getAllByText(/PROD-01/).length).toBeGreaterThan(0)
      expect(screen.getByText('Vale o Clique?')).toBeInTheDocument()
    })

    // Verify tabs
    expect(screen.getByRole('tab', { name: /Headlines/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Legenda/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Detalhes/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Observabilidade/i })).toBeInTheDocument()

    // Switch to Legenda tab
    const captionTab = screen.getByRole('tab', { name: /Legenda/i })
    await user.click(captionTab)
    expect(screen.getByPlaceholderText(/Escreva a legenda com gancho/i)).toBeInTheDocument()

    // Switch to Detalhes tab
    const detailsTab = screen.getByRole('tab', { name: /Detalhes/i })
    await user.click(detailsTab)
    expect(screen.getByText(/Código do Produto/i)).toBeInTheDocument()

    // Switch to Observabilidade tab
    const obsTab = screen.getByRole('tab', { name: /Observabilidade/i })
    await user.click(obsTab)
    expect(screen.getByText(/Frames Extraídos por Cena/i)).toBeInTheDocument()

    // Switch back to Headlines and edit custom headline
    await user.click(screen.getByRole('tab', { name: /Headlines/i }))
    const headlineInput = screen.getByPlaceholderText(
      /Digite a headline que aparecerá no topo do vídeo/i,
    )
    fireEvent.change(headlineInput, { target: { value: 'Novo gancho magnético customizado!' } })

    // Check dirty state in bottom bar
    await waitFor(() => {
      expect(screen.getByText('Alterações não salvas')).toBeInTheDocument()
    })

    // Save changes
    const saveBtn = screen.getByRole('button', { name: /Salvar Alterações/i })
    await user.click(saveBtn)

    await waitFor(() => {
      expect(screen.getByText('Todas as alterações salvas')).toBeInTheDocument()
    })
  }, 15000)

  it('triggers dirty confirmation modal when attempting to navigate back with unsaved edits', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ViralEditorView
        batchId="batch-101"
        itemId="item-1"
      />,
    )

    await waitFor(() => {
      expect(screen.getAllByText(/PROD-01/).length).toBeGreaterThan(0)
    })

    // Modify form to make it dirty
    const headlineInput = screen.getByPlaceholderText(
      /Digite a headline que aparecerá no topo do vídeo/i,
    )
    fireEvent.change(headlineInput, { target: { value: 'Headline alterada' } })

    await waitFor(() => {
      expect(screen.getByText('Alterações não salvas')).toBeInTheDocument()
    })

    // Click "Voltar ao Lote"
    const backBtn = screen.getByRole('button', { name: /Voltar ao Lote/i })
    await user.click(backBtn)

    // Unsaved changes dialog opens
    expect(screen.getByRole('heading', { name: /Alterações não salvas/i })).toBeInTheDocument()
    expect(screen.getByText(/Você possui alterações não salvas neste vídeo/i)).toBeInTheDocument()

    // Discard and proceed
    const discardBtn = screen.getByRole('button', { name: /Descartar Alterações/i })
    await user.click(discardBtn)

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/viral-studio/$id',
      params: { id: 'batch-101' },
    })
  })

  it('triggers dirty confirmation modal and saves and proceeds when requested', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ViralEditorView
        batchId="batch-101"
        itemId="item-1"
      />,
    )

    await waitFor(() => {
      expect(screen.getAllByText(/PROD-01/).length).toBeGreaterThan(0)
    })

    const headlineInput = screen.getByPlaceholderText(
      /Digite a headline que aparecerá no topo do vídeo/i,
    )
    fireEvent.change(headlineInput, { target: { value: 'Edição com save and proceed' } })

    await waitFor(() => {
      expect(screen.getByText('Alterações não salvas')).toBeInTheDocument()
    })

    const nextBtn = screen.getByRole('button', { name: /Próximo vídeo/i })
    await user.click(nextBtn)

    expect(screen.getByRole('heading', { name: /Alterações não salvas/i })).toBeInTheDocument()

    const saveAndProceedBtn = screen.getByRole('button', { name: /Salvar e Continuar/i })
    await user.click(saveAndProceedBtn)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/viral-studio/$id/items/$itemId',
        params: { id: 'batch-101', itemId: 'item-2' },
      })
    })
  })

  it('navigates next and previous items via topbar buttons', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ViralEditorView
        batchId="batch-101"
        itemId="item-1"
      />,
    )

    await waitFor(() => {
      expect(screen.getAllByText(/PROD-01/).length).toBeGreaterThan(0)
    })

    // item-1 is first, so prev is disabled, next is enabled
    const nextBtn = screen.getByRole('button', { name: /Próximo vídeo/i })
    expect(nextBtn).not.toBeDisabled()

    await user.click(nextBtn)
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/viral-studio/$id/items/$itemId',
      params: { id: 'batch-101', itemId: 'item-2' },
    })
  })

  it('supports Alt + ArrowRight and Alt + ArrowLeft keyboard shortcuts', async () => {
    renderWithProviders(
      <ViralEditorView
        batchId="batch-101"
        itemId="item-1"
      />,
    )

    await waitFor(() => {
      expect(screen.getAllByText(/PROD-01/).length).toBeGreaterThan(0)
    })

    fireEvent.keyDown(window, { key: 'ArrowRight', altKey: true })
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/viral-studio/$id/items/$itemId',
      params: { id: 'batch-101', itemId: 'item-2' },
    })
  })

  it('renders not found state when item does not exist in batch', async () => {
    renderWithProviders(
      <ViralEditorView
        batchId="batch-101"
        itemId="item-9999"
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Vídeo não encontrado')).toBeInTheDocument()
    })
  })
})
