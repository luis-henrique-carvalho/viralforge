import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from '@/test-utils/render'
import { brandSchema, templateSchema } from '../data/brand.schema'
import { BatchConfigSidebar } from './batch-config-sidebar'

describe('BatchConfigSidebar', () => {
  it('renders dynamically fetched local and cloud AI models grouped correctly', async () => {
    const qc = createTestQueryClient()
    const handleBrand = vi.fn()
    const handleTemplate = vi.fn()
    const handleModel = vi.fn()

    render(
      <QueryClientProvider client={qc}>
        <BatchConfigSidebar
          brands={[brandSchema.parse({ id: 'brand-1', name: 'Marca Demo', handle: '@demo' })]}
          templates={[templateSchema.parse({ id: 'template-1', name: 'Classic Affiliate' })]}
          isLoadingBrands={false}
          isLoadingTemplates={false}
          selectedBrandId="brand-1"
          setSelectedBrandId={handleBrand}
          selectedTemplateId="template-1"
          setSelectedTemplateId={handleTemplate}
          selectedModel="gemini-2.5-flash"
          setSelectedModel={handleModel}
          isPending={false}
          itemsCount={1}
        />
      </QueryClientProvider>,
    )

    expect(screen.getByText('Parâmetros de Produção')).toBeInTheDocument()
    expect(screen.getByText('Modelo de Copywriting & Visão')).toBeInTheDocument()
  })

  it('renders multi-brand pool and distribution strategy when multiple brands selected', async () => {
    const qc = createTestQueryClient()
    const handleSetBrandIds = vi.fn()
    const handleSetStrategy = vi.fn()
    const user = userEvent.setup()

    const brands = [
      brandSchema.parse({ id: 'brand-1', name: 'Marca Alpha', handle: '@alpha' }),
      brandSchema.parse({ id: 'brand-2', name: 'Marca Beta', handle: '@beta' }),
    ]

    render(
      <QueryClientProvider client={qc}>
        <BatchConfigSidebar
          brands={brands}
          templates={[templateSchema.parse({ id: 'template-1', name: 'Classic Affiliate' })]}
          isLoadingBrands={false}
          isLoadingTemplates={false}
          selectedBrandIds={['brand-1', 'brand-2']}
          setSelectedBrandIds={handleSetBrandIds}
          distributionStrategy="round_robin"
          setDistributionStrategy={handleSetStrategy}
          selectedTemplateId="template-1"
          setSelectedTemplateId={vi.fn()}
          selectedModel="gemini-2.5-flash"
          setSelectedModel={vi.fn()}
          isPending={false}
          itemsCount={2}
        />
      </QueryClientProvider>,
    )

    expect(screen.getByText('Distribuição Multi-Marca')).toBeInTheDocument()
    expect(screen.getByText('Round-Robin (Alternado)')).toBeInTheDocument()
    expect(screen.getByText('Sequencial em Blocos')).toBeInTheDocument()

    await user.click(screen.getByText('Sequencial em Blocos'))
    expect(handleSetStrategy).toHaveBeenCalledWith('sequential')

    await user.click(screen.getByText('Marca Beta'))
    expect(handleSetBrandIds).toHaveBeenCalled()
  })
})
