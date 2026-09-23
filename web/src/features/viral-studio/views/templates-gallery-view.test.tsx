import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render'
import { TemplatesGalleryView } from './templates-gallery-view'

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

describe('TemplatesGalleryView', () => {
  it('renders templates gallery and filters templates by search', async () => {
    renderWithProviders(<TemplatesGalleryView />)

    expect(screen.getByText('Estúdio de Templates 9:16')).toBeInTheDocument()

    // Wait for templates from MSW
    await waitFor(() => {
      expect(screen.getAllByText('Curiosidades & Fatos Virais').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Achadinhos & Afiliados').length).toBeGreaterThan(0)
    })

    // Search filter
    const searchInput = screen.getByPlaceholderText(/Buscar template por nome/i)
    fireEvent.change(searchInput, { target: { value: 'Curiosidades' } })

    expect(screen.getAllByText('Curiosidades & Fatos Virais').length).toBeGreaterThan(0)
  })

  it('opens reset defaults confirmation dialog and confirms reset', async () => {
    renderWithProviders(<TemplatesGalleryView />)

    const resetBtn = screen.getByRole('button', { name: /Restaurar Fábrica/i })
    fireEvent.click(resetBtn)

    await waitFor(() => {
      expect(screen.getByText(/Restaurar Templates de Fábrica/i)).toBeInTheDocument()
    })

    const confirmResetBtn = screen.getByRole('button', { name: /Restaurar Padrões/i })
    fireEvent.click(confirmResetBtn)
  })

  it('creates a new template and navigates to studio', async () => {
    renderWithProviders(<TemplatesGalleryView />)

    const newBtn = screen.getByRole('button', { name: /Novo Template/i })
    fireEvent.click(newBtn)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled()
    })
  })
})
