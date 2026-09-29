import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render'
import { BrandWorkspaceTabVideos } from './brand-workspace-tab-videos'
import type { Brand } from '../data/batch.types'

const mockBrand: Brand = {
  id: 'vale-o-clique',
  name: 'Vale o Clique?',
  handle: '@valeoclique',
  default_cta: 'CTA',
  template_id: 'classic-affiliate',
  publishing_profiles: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('BrandWorkspaceTabVideos', () => {
  it('renders videos tab with status filters and handles interactions', async () => {
    const onNavigate = vi.fn()
    renderWithProviders(
      <BrandWorkspaceTabVideos
        brand={mockBrand}
        onNavigateToTab={onNavigate}
      />,
    )

    expect(screen.getByRole('button', { name: 'Todos' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Prontos p/ Revisão' })).toBeInTheDocument()

    // Wait for items to load
    await waitFor(() => {
      expect(
        screen.getByText('Este suporte magnético vai mudar sua mesa de trabalho!'),
      ).toBeInTheDocument()
    })

    // Filter by Ready for review
    const readyBtn = screen.getByRole('button', { name: 'Prontos p/ Revisão' })
    fireEvent.click(readyBtn)

    await waitFor(() => {
      expect(readyBtn).toHaveClass('bg-primary')
    })

    // Click Approve
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Aprovar Vídeo/i })).toBeInTheDocument()
    })
    const approveBtn = screen.getByRole('button', { name: /Aprovar Vídeo/i })
    fireEvent.click(approveBtn)

    // Filter by Aprovados
    const approvedBtn = screen.getByRole('button', { name: 'Aprovados' })
    fireEvent.click(approvedBtn)

    await waitFor(() => {
      expect(approvedBtn).toHaveClass('bg-primary')
    })
  })
})
