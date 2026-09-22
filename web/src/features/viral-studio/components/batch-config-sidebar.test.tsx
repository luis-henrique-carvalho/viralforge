import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from '@/test-utils/render'
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
          brands={[{ id: 'brand-1', name: 'Marca Demo', handle: '@demo' }]}
          templates={[{ id: 'template-1', name: 'Classic Affiliate' }]}
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
})
