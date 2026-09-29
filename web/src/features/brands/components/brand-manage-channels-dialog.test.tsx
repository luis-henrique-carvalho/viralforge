import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render'
import { BrandManageChannelsDialog } from './brand-manage-channels-dialog'
import type { Brand } from '../data/brand.types'

const mockBrand: Brand = {
  id: 'vale-o-clique',
  name: 'Vale o Clique?',
  handle: '@valeoclique',
  default_cta: 'CTA',
  template_id: 'classic-affiliate',
  publishing_profiles: {
    postiz: {
      active: true,
      channel_ids: ['acc_tiktok_1'],
    },
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('BrandManageChannelsDialog', () => {
  it('renders modal when open and allows selecting and saving channels', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    renderWithProviders(
      <BrandManageChannelsDialog
        brand={mockBrand}
        open={true}
        onOpenChange={onOpenChange}
      />,
    )

    expect(screen.getByText('Vincular Redes Sociais à Marca')).toBeInTheDocument()

    // Wait for MSW channels to load
    await waitFor(() => {
      expect(screen.getByText(/Salvar Canais da Marca/i)).toBeInTheDocument()
    })

    const saveBtn = screen.getByRole('button', { name: /Salvar Canais da Marca/i })
    await user.click(saveBtn)

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })
})
