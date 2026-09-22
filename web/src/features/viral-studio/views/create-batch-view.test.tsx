import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render'
import { CreateBatchView } from './create-batch-view'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, className }: any) => (
    <a
      href={to}
      className={className}
    >
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
}))

describe('CreateBatchView Integration', () => {
  it('renders creation form and enables submission on typing URLs', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateBatchView />)

    expect(screen.getByText('Novo Lote de Criação')).toBeInTheDocument()
    expect(screen.getByText('URLs de Origem & Produtos')).toBeInTheDocument()
    expect(screen.getByText('Parâmetros de Produção')).toBeInTheDocument()

    // Wait for brands to load
    await waitFor(() => {
      expect(screen.getByText(/Perfil da Marca/i)).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/Cole a URL do vídeo/i)
    await user.type(input, 'https://tiktok.com/@user/video/999 #TEST01{enter}')

    await user.type(input, 'https://youtube.com/shorts/888 #TEST02{enter}')

    expect(screen.getByText('2 vídeos na lista')).toBeInTheDocument()

    const submitBtn = screen.getByRole('button', { name: /Processar Lote \(2 vídeos\)/i })
    expect(submitBtn).toBeEnabled()

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
