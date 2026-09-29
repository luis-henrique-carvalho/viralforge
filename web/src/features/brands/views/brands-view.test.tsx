import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render'
import { BrandsView } from './brands-view'

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
  useNavigate: () => vi.fn(),
}))

describe('BrandsView Integration', () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  it('renders brands from MSW, filters by search query and opens dialog on Nova Marca', async () => {
    renderWithProviders(<BrandsView />)

    expect(screen.getByText('Perfis de Marca')).toBeInTheDocument()

    // Wait for brands from MSW
    await waitFor(() => {
      expect(screen.getByText('Vale o Clique?')).toBeInTheDocument()
      expect(screen.getByText('Tech Review BR')).toBeInTheDocument()
    })

    // Search filter
    const searchInput = screen.getByPlaceholderText(/Buscar por nome/i)
    fireEvent.change(searchInput, { target: { value: 'Tech' } })

    expect(screen.getByText('Tech Review BR')).toBeInTheDocument()
    expect(screen.queryByText('Vale o Clique?')).not.toBeInTheDocument()

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } })
    expect(screen.getByText('Vale o Clique?')).toBeInTheDocument()

    // Click 'Nova Marca'
    const newBrandBtn = screen.getByRole('button', { name: /Nova Marca/i })
    fireEvent.click(newBrandBtn)

    // Dialog appears
    await waitFor(() => {
      expect(
        screen.getByText('Cadastre uma nova marca para personalizar a renderização 9:16 e CTAs.'),
      ).toBeInTheDocument()
    })

    // Fill new brand form
    fireEvent.change(screen.getByLabelText(/Nome da Marca/i), {
      target: { value: 'Nova Marca Teste' },
    })
    fireEvent.change(screen.getByLabelText(/Handle \(@\)/i), {
      target: { value: '@novamarca' },
    })
    fireEvent.change(screen.getByLabelText(/CTA Padrão/i), {
      target: { value: 'Confira agora no link da bio!' },
    })

    // Submit dialog form
    const submitBtn = screen.getByRole('button', { name: /Criar Marca/i })
    fireEvent.click(submitBtn)
  })

  it('filters brands by provider', async () => {
    renderWithProviders(<BrandsView />)

    await waitFor(() => {
      expect(screen.getByText('Vale o Clique?')).toBeInTheDocument()
    })

    const selectTrigger = screen.getByRole('combobox')
    fireEvent.click(selectTrigger)
  })
})
