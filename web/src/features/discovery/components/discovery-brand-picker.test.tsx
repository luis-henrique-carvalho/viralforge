import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DiscoveryBrandPicker } from './discovery-brand-picker'
import type { Brand } from '@/features/viral-studio/data/batch.types'

const mockBrands: Brand[] = [
  {
    id: 'brand-1',
    name: 'Brand One',
    handle: '@brandone',
    default_cta: 'Compre Agora',
    template_id: 'classic-affiliate',
    publishing_profiles: {},
    created_at: '',
    updated_at: '',
  },
  {
    id: 'brand-2',
    name: 'Brand Two',
    handle: '@brandtwo',
    default_cta: 'Saiba Mais',
    template_id: 'classic-affiliate',
    publishing_profiles: {},
    created_at: '',
    updated_at: '',
  },
]

describe('DiscoveryBrandPicker', () => {
  it('renders brands list and toggles selection', async () => {
    const handleToggle = vi.fn()
    const handleSelectAll = vi.fn()
    const user = userEvent.setup()

    render(
      <DiscoveryBrandPicker
        brands={mockBrands}
        selectedBrandIds={['brand-1']}
        onToggleBrand={handleToggle}
        onSelectAllBrands={handleSelectAll}
      />,
    )

    expect(screen.getByText('Brand One')).toBeInTheDocument()
    expect(screen.getByText('Brand Two')).toBeInTheDocument()

    await user.click(screen.getByText('Brand Two'))
    expect(handleToggle).toHaveBeenCalledWith('brand-2')

    const selectAllBtn = screen.getByRole('button', { name: /Todas/i })
    await user.click(selectAllBtn)
    expect(handleSelectAll).toHaveBeenCalled()
  })
})
