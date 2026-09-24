import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render'
import { DiscoveryView } from './discovery-view'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

describe('DiscoveryView Integration', () => {
  it('renders discovery page and executes search to display video cards', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DiscoveryView />)

    expect(screen.getByText('Descoberta Multiplataforma')).toBeInTheDocument()
    expect(screen.getByText('Mineração Inteligente de Conteúdo')).toBeInTheDocument()

    const input = screen.getByPlaceholderText(/Busque por palavras-chave/i)
    await user.type(input, 'achadinhos')

    const searchBtn = screen.getByRole('button', { name: /Buscar Tendências/i })
    await user.click(searchBtn)

    await waitFor(() => {
      expect(screen.getByText(/Mini Selador Térmico/i)).toBeInTheDocument()
      expect(screen.getByText(/Suporte Magnético 360 Graus/i)).toBeInTheDocument()
    })

    expect(screen.getByText('3 vídeos minerados para “achadinhos”')).toBeInTheDocument()

    // Test Select All / Deselect All
    const selectAllBtn = screen.getByRole('button', { name: /Selecionar Todos/i })
    await user.click(selectAllBtn)

    await waitFor(() => {
      expect(screen.getByText(/3 vídeos selecionados/i)).toBeInTheDocument()
    })

    const deselectBtn = screen.getByRole('button', { name: /Desmarcar Todos/i })
    await user.click(deselectBtn)

    expect(screen.queryByText(/vídeos selecionados/i)).not.toBeInTheDocument()
  })

  it('allows selecting videos, clearing selection, and opening the import drawer', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DiscoveryView />)

    const input = screen.getByPlaceholderText(/Busque por palavras-chave/i)
    await user.type(input, 'gadgets')

    const searchBtn = screen.getByRole('button', { name: /Buscar Tendências/i })
    await user.click(searchBtn)

    await waitFor(() => {
      expect(screen.getByText(/Mini Selador Térmico/i)).toBeInTheDocument()
    })

    // Click on the card to select it
    const card = screen.getByText(/Mini Selador Térmico/i).closest('.cursor-pointer')
    if (card) {
      await user.click(card)
    }

    await waitFor(() => {
      expect(screen.getByText(/1 vídeo selecionado/i)).toBeInTheDocument()
    })

    // Clear selection test
    const clearBtn = screen.getByTitle('Limpar seleção')
    await user.click(clearBtn)
    expect(screen.queryByText(/1 vídeo selecionado/i)).not.toBeInTheDocument()

    // Select again
    if (card) {
      await user.click(card)
    }

    await waitFor(() => {
      expect(screen.getByText(/1 vídeo selecionado/i)).toBeInTheDocument()
    })

    const createBatchBtn = screen.getByRole('button', { name: /Criar Lote \(1\)/i })
    await user.click(createBatchBtn)

    await waitFor(() => {
      expect(screen.getByText(/Importar 1 Vídeo em Lote/i)).toBeInTheDocument()
      expect(screen.getAllByText(/Pool de Marcas/i).length).toBeGreaterThan(0)
    })
  })

  it('handles search with empty results properly', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DiscoveryView />)

    const input = screen.getByPlaceholderText(/Busque por palavras-chave/i)
    await user.type(input, 'empty')

    const searchBtn = screen.getByRole('button', { name: /Buscar Tendências/i })
    await user.click(searchBtn)

    await waitFor(() => {
      expect(screen.getByText(/Nenhum vídeo encontrado/i)).toBeInTheDocument()
    })
  })
})
