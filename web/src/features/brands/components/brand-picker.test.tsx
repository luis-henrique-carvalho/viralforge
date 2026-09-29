import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { BrandPicker } from './brand-picker'
import type { Brand } from '../data/brand.types'

const mockBrands: Brand[] = [
  {
    id: 'b1',
    name: 'Brand One',
    handle: '@brandone',
    niche: 'Tech',
    discovery_keywords: ['tech'],
    avatar_path: null,
    avatar_url: null,
    logo_path: null,
    default_cta: 'CTA 1',
    default_affiliate_url: null,
    template_id: 'classic-affiliate',
    posting_schedule: null,
    publishing_profiles: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'b2',
    name: 'Brand Two',
    handle: '@brandtwo',
    niche: 'Fashion',
    discovery_keywords: ['fashion'],
    avatar_path: null,
    avatar_url: null,
    logo_path: null,
    default_cta: 'CTA 2',
    default_affiliate_url: null,
    template_id: 'classic-affiliate',
    posting_schedule: null,
    publishing_profiles: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

describe('BrandPicker Component', () => {
  it('renders brands and handles toggle and select all', () => {
    const onToggle = vi.fn()
    const onSelectAll = vi.fn()

    render(
      <BrandPicker
        brands={mockBrands}
        selectedBrandIds={['b1']}
        onToggleBrand={onToggle}
        onSelectAllBrands={onSelectAll}
      />,
    )

    expect(screen.getByText('Brand One')).toBeInTheDocument()
    expect(screen.getByText('Brand Two')).toBeInTheDocument()
    expect(screen.getByText(/Pool de Marcas \(1 selecionada\)/i)).toBeInTheDocument()

    const selectAllBtn = screen.getByRole('button', { name: /Todas/i })
    fireEvent.click(selectAllBtn)
    expect(onSelectAll).toHaveBeenCalled()

    const brandTwo = screen.getByText('Brand Two')
    fireEvent.click(brandTwo)
    expect(onToggle).toHaveBeenCalledWith('b2')
  })
})
