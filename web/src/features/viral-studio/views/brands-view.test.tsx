import { describe, expect, it, vi } from 'vitest'
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
  it('renders brands from MSW and opens dialog on Nova Marca', async () => {
    renderWithProviders(<BrandsView />)

    expect(screen.getByText('Perfis de Marca')).toBeInTheDocument()

    // Wait for brands from MSW
    await waitFor(() => {
      expect(screen.getByText('Vale o Clique?')).toBeInTheDocument()
      expect(screen.getByText('Tech Review BR')).toBeInTheDocument()
    })

    // Click 'Nova Marca'
    const newBrandBtn = screen.getByRole('button', { name: /Nova Marca/i })
    fireEvent.click(newBrandBtn)

    // Dialog appears
    await waitFor(() => {
      expect(
        screen.getByText('Cadastre uma nova marca para personalizar a renderização 9:16 e CTAs.'),
      ).toBeInTheDocument()
    })
  })
})
