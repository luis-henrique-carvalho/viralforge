import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render'
import { ViralStudioView } from './viral-studio-view'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, className }: any) => (
    <a
      href={to}
      className={className}
    >
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}))

describe('ViralStudioView Integration', () => {
  it('renders header, KPIs and loads batches from MSW', async () => {
    renderWithProviders(<ViralStudioView />)

    expect(screen.getByText('Viral Content Studio')).toBeInTheDocument()
    expect(screen.getByText('Lotes Recentes')).toBeInTheDocument()

    // Wait for batches to load from MSW
    await waitFor(() => {
      expect(screen.getByText('batch-101')).toBeInTheDocument()
    })

    expect(screen.getByText('vale-o-clique')).toBeInTheDocument()
    expect(screen.getByText('Ver Resultados do Lote')).toBeInTheDocument()
  })
})
