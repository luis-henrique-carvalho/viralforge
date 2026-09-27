import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrandCard } from './brand-card'
import type { Brand } from '../data/batch.types'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    params,
    search,
    className,
  }: {
    children: React.ReactNode
    to: string
    params?: any
    search?: any
    className?: string
  }) => (
    <a
      href={to}
      className={className}
      data-params={JSON.stringify(params)}
      data-search={JSON.stringify(search)}
    >
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}))

describe('BrandCard', () => {
  const brand: Brand = {
    id: 'vale-o-clique',
    name: 'Vale o Clique?',
    handle: '@valeoclique',
    niche: 'Achadinhos & Promoções',
    discovery_keywords: ['achadinhos', 'shopee'],
    avatar_path: null,
    avatar_url: null,
    logo_path: null,
    default_cta: 'Confira os achadinhos no link da bio!',
    default_affiliate_url: 'https://amzn.to/valeoclique',
    template_id: 'classic-affiliate',
    posting_schedule: {
      frequency: 3,
      slots: ['10:00', '15:00', '20:00'],
      timezone: 'America/Sao_Paulo',
    },
    publishing_profiles: {
      postiz: { customer_id: 'cust_01' },
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  it('renders enriched brand card info with workspace and discovery actions', () => {
    render(
      <BrandCard
        brand={brand}
        videoCount={5}
      />,
    )

    expect(screen.getByText('Vale o Clique?')).toBeInTheDocument()
    expect(screen.getByText('@valeoclique')).toBeInTheDocument()
    expect(screen.getByText('Achadinhos & Promoções')).toBeInTheDocument()
    expect(screen.getByText('Confira os achadinhos no link da bio!')).toBeInTheDocument()
    expect(screen.getByText('classic-affiliate')).toBeInTheDocument()
    expect(screen.getByText('Acessar Workspace')).toBeInTheDocument()
    expect(screen.getByText('Discovery')).toBeInTheDocument()
    expect(screen.getByText('3x/dia')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('safely handles extra whitespace and single word brand names for avatar initials', () => {
    const singleBrand: Brand = {
      ...brand,
      name: '  Viral   ',
    }
    render(<BrandCard brand={singleBrand} />)
    expect(screen.getByText('V')).toBeInTheDocument()
  })

  it('covers branches for avatar_url, empty channels/niche/cta, and more than 3 keywords', () => {
    const edgeBrand: Brand = {
      ...brand,
      name: '',
      avatar_url: 'https://example.com/avatar.jpg',
      niche: undefined,
      default_cta: '',
      publishing_profiles: {},
      discovery_keywords: ['kw1', 'kw2', 'kw3', 'kw4', 'kw5'],
    }

    render(<BrandCard brand={edgeBrand} />)
    expect(screen.getByText('BR')).toBeInTheDocument()
    expect(screen.getByText('Nenhum CTA padrão configurado.')).toBeInTheDocument()
    expect(screen.getByText('+2')).toBeInTheDocument()
    expect(screen.getAllByText('0')).toHaveLength(2)
  })
})
