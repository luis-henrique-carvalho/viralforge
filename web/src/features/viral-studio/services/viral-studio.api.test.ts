import { describe, expect, it } from 'vitest'
import { viralStudioApi } from './viral-studio.api'
import { viralStudioKeys } from './viral-studio.keys'

describe('viralStudioKeys', () => {
  it('generates structured query keys', () => {
    expect(viralStudioKeys.all).toEqual(['viral-studio'])
    expect(viralStudioKeys.batches()).toEqual(['viral-studio', 'batches'])
    expect(viralStudioKeys.batch('b1')).toEqual(['viral-studio', 'batch', 'b1'])
    expect(viralStudioKeys.item('i1')).toEqual(['viral-studio', 'item', 'i1'])
    expect(viralStudioKeys.brands()).toEqual(['viral-studio', 'brands'])
    expect(viralStudioKeys.brand('brand1')).toEqual(['viral-studio', 'brand', 'brand1'])
    expect(viralStudioKeys.templates()).toEqual(['viral-studio', 'templates'])
    expect(viralStudioKeys.template('t1')).toEqual(['viral-studio', 'template', 't1'])
  })
})

describe('viralStudioApi Service', () => {
  it('fetches batches', async () => {
    const data = await viralStudioApi.fetchBatches()
    expect(data.batches).toBeDefined()
    expect(data.batches.length).toBeGreaterThan(0)
  })

  it('fetches a single batch by ID', async () => {
    const data = await viralStudioApi.fetchBatch('batch-101')
    expect(data.id).toBe('batch-101')
    expect(data.items.length).toBe(3)
  })

  it('creates a new batch', async () => {
    const data = await viralStudioApi.createBatch({
      brand_id: 'vale-o-clique',
      items: [{ source_url: 'https://tiktok.com/@u/v/10' }],
    })
    expect(data.id).toBeDefined()
    expect(data.brand_id).toBe('vale-o-clique')
  })

  it('fetches a viral item', async () => {
    const data = await viralStudioApi.fetchItem('item-1')
    expect(data.id).toBe('item-1')
  })

  it('updates a viral item', async () => {
    const data = await viralStudioApi.updateItem('item-1', {
      selected_headline: 'Nova Headline Teste',
    })
    expect(data.selected_headline).toBe('Nova Headline Teste')
  })

  it('approves a viral item', async () => {
    const data = await viralStudioApi.approveItem('item-1')
    expect(data.status).toBe('APPROVED')
  })

  it('retries a viral item', async () => {
    const data = await viralStudioApi.retryItem('item-3')
    expect(data.status).toBe('PENDING')
  })

  it('fetches brands list', async () => {
    const data = await viralStudioApi.fetchBrands()
    expect(data.brands.length).toBeGreaterThan(0)
  })

  it('fetches a single brand', async () => {
    const data = await viralStudioApi.fetchBrand('vale-o-clique')
    expect(data.id).toBe('vale-o-clique')
  })

  it('creates a brand', async () => {
    const data = await viralStudioApi.createBrand({
      name: 'Marca Teste API',
      handle: '@marcateste',
      default_cta: 'Clique aqui!',
    })
    expect(data.name).toBe('Marca Teste API')
  })

  it('updates a brand', async () => {
    const data = await viralStudioApi.updateBrand('vale-o-clique', {
      name: 'Vale o Clique Atualizado',
    })
    expect(data.name).toBe('Vale o Clique Atualizado')
  })

  it('fetches templates list', async () => {
    const data = await viralStudioApi.fetchTemplates()
    expect(data.templates.length).toBeGreaterThan(0)
  })

  it('fetches a single template', async () => {
    const data = await viralStudioApi.fetchTemplate('classic-affiliate')
    expect(data.id).toBe('classic-affiliate')
  })
})
