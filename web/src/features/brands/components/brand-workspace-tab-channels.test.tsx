import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render'
import { BrandWorkspaceTabChannels } from './brand-workspace-tab-channels'
import type { Brand } from '../data/brand.types'

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

describe('BrandWorkspaceTabChannels', () => {
  it('renders channels list from MSW and handles sync', async () => {
    renderWithProviders(<BrandWorkspaceTabChannels brand={mockBrand} />)

    expect(screen.getByText('Canais Sociais Conectados')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getAllByText(/TikTok/i).length).toBeGreaterThan(0)
    })

    const syncBtn = screen.getByRole('button', { name: /Sincronizar/i })
    fireEvent.click(syncBtn)
  })

  it('triggers connect new channel action', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    renderWithProviders(<BrandWorkspaceTabChannels brand={mockBrand} />)

    const connectBtn = screen.getByRole('button', { name: /Conectar Nova Rede/i })
    fireEvent.click(connectBtn)

    await waitFor(() => {
      expect(openSpy).toHaveBeenCalled()
    })

    openSpy.mockRestore()
  })
})
