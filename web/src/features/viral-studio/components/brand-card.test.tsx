import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrandCard } from './brand-card'
import type { Brand } from '../data/batch.types'

describe('BrandCard', () => {
  const brand: Brand = {
    id: 'vale-o-clique',
    name: 'Vale o Clique?',
    handle: '@valeoclique',
    avatar_path: null,
    logo_path: null,
    default_cta: 'Confira os achadinhos no link da bio!',
    default_affiliate_url: 'https://amzn.to/valeoclique',
    template_id: 'classic-affiliate',
    publishing_profiles: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  it('renders brand card info and triggers onEdit', () => {
    const onEdit = vi.fn()
    render(
      <BrandCard
        brand={brand}
        onEdit={onEdit}
      />,
    )

    expect(screen.getByText('Vale o Clique?')).toBeInTheDocument()
    expect(screen.getByText('@valeoclique')).toBeInTheDocument()
    expect(screen.getByText('Confira os achadinhos no link da bio!')).toBeInTheDocument()
    expect(screen.getByText('classic-affiliate')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Editar Perfil'))
    expect(onEdit).toHaveBeenCalledWith(brand)
  })

  it('safely handles extra whitespace and single word brand names', () => {
    const singleBrand: Brand = {
      ...brand,
      name: '  Viral   ',
    }
    render(
      <BrandCard
        brand={singleBrand}
        onEdit={vi.fn()}
      />,
    )
    expect(screen.getByText('V')).toBeInTheDocument()
  })
})
