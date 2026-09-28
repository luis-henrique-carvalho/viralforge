import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BatchBrandSelection } from './batch-brand-selection'
import type { Brand } from '../data/batch.types'

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

describe('BatchBrandSelection', () => {
  it('renders multi-brand list and selects all / toggles', async () => {
    const handleToggle = vi.fn()
    const handleSetBrandIds = vi.fn()
    const user = userEvent.setup()

    render(
      <BatchBrandSelection
        brands={mockBrands}
        isLoadingBrands={false}
        currentBrandIds={['brand-1']}
        setSelectedBrandIds={handleSetBrandIds}
        onToggleBrand={handleToggle}
      />,
    )

    expect(screen.getByText('Brand One')).toBeInTheDocument()
    expect(screen.getByText('Brand Two')).toBeInTheDocument()

    await user.click(screen.getByText('Brand Two'))
    expect(handleToggle).toHaveBeenCalledWith('brand-2')

    const selectAllBtn = screen.getByRole('button', { name: /Todas/i })
    await user.click(selectAllBtn)
    expect(handleSetBrandIds).toHaveBeenCalledWith(['brand-1', 'brand-2'])
  })

  it('renders select dropdown when single brand or setSelectedBrandIds not provided', () => {
    render(
      <BatchBrandSelection
        brands={[mockBrands[0]]}
        isLoadingBrands={false}
        currentBrandIds={['brand-1']}
        selectedBrandId="brand-1"
        onToggleBrand={vi.fn()}
      />,
    )

    expect(screen.getByText('Brand One (@brandone)')).toBeInTheDocument()
  })
})
