import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render'
import { DiscoveryImportDrawer } from './discovery-import-drawer'
import { mockDiscoveryItems } from '../mocks/handlers'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

describe('DiscoveryImportDrawer', () => {
  it('renders drawer with selected items count, brands, and template selection', async () => {
    const handleClose = vi.fn()
    const user = userEvent.setup()

    renderWithProviders(
      <DiscoveryImportDrawer
        isOpen={true}
        onClose={handleClose}
        selectedItems={mockDiscoveryItems}
      />,
    )

    expect(screen.getByText('Importar 3 Vídeos em Lote')).toBeInTheDocument()
    expect(screen.getByText('Template Visual Unificado (1080x1920)')).toBeInTheDocument()
    expect(screen.getAllByText(/Pool de Marcas/i).length).toBeGreaterThan(0)

    // Wait for brands to be rendered
    await waitFor(() => {
      expect(screen.getByText('Vale o Clique?')).toBeInTheDocument()
    })

    // Test select all brands button if available
    const selectAllBtn = screen.queryByRole('button', { name: /Todas|Desmarcar/i })
    if (selectAllBtn) {
      await user.click(selectAllBtn)
    }

    // Toggle a brand item
    await user.click(screen.getByText('Vale o Clique?'))

    const submitBtn = screen.getByRole('button', { name: /Criar Lote/i })
    await waitFor(() => {
      expect(submitBtn).toBeEnabled()
    })

    await user.click(submitBtn)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '/viral-studio/$id',
        }),
      )
    })
  })
})
