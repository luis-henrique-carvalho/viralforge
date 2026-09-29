import { describe, expect, it } from 'vitest'
import { brandKeys } from '@/features/brands'
import { viralStudioApi } from './viral-studio.api'
import { viralStudioKeys } from './viral-studio.keys'

describe('viralStudioKeys', () => {
  it('generates structured query keys', () => {
    expect(viralStudioKeys.all).toEqual(['viral-studio'])
    expect(viralStudioKeys.batches()).toEqual(['viral-studio', 'batches'])
    expect(viralStudioKeys.batch('b1')).toEqual(['viral-studio', 'batch', 'b1'])
    expect(viralStudioKeys.item('i1')).toEqual(['viral-studio', 'item', 'i1'])
    expect(viralStudioKeys.brands()).toEqual(brandKeys.all)
    expect(viralStudioKeys.brandWorkspace('b1')).toEqual(brandKeys.workspace('b1'))
    expect(viralStudioKeys.brandChannels('b1')).toEqual(brandKeys.channels('b1'))
    expect(viralStudioKeys.brandAvailableChannels('b1')).toEqual(brandKeys.availableChannels('b1'))
    expect(viralStudioKeys.brandVideos('b1', 'ready')).toEqual(brandKeys.videos('b1', 'ready'))
    expect(viralStudioKeys.brandScheduled('b1', '2026-01-01', '2026-01-02')).toEqual(
      brandKeys.scheduled('b1', '2026-01-01', '2026-01-02'),
    )
    expect(viralStudioKeys.publishingAccounts()).toEqual(['viral-studio', 'publishing', 'accounts'])
    expect(viralStudioKeys.publishingWorkspaces('postiz')).toEqual(
      brandKeys.publishingWorkspaces('postiz'),
    )
    expect(viralStudioKeys.previewSlots('acc1', 3)).toEqual([
      'viral-studio',
      'publishing',
      'preview-slots',
      'acc1',
      3,
      undefined,
      undefined,
      undefined,
    ])
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

  it('cancels a viral item processing', async () => {
    const data = await viralStudioApi.cancelItemProcessing('item-1')
    expect(data.status).toBe('CANCELLED')
  })

  it('cancels a batch processing', async () => {
    const data = await viralStudioApi.cancelBatchProcessing('batch-101')
    expect(data.id).toBe('batch-101')
    expect(data.status).toBeDefined()
  })

  it('calls brand methods delegated to brandApi', async () => {
    const data = await viralStudioApi.fetchBrands()
    expect(data.brands.length).toBeGreaterThan(0)

    const brand = await viralStudioApi.fetchBrand('vale-o-clique')
    expect(brand.id).toBe('vale-o-clique')

    const created = await viralStudioApi.createBrand({
      name: 'Marca Teste API',
      handle: '@marcateste',
      default_cta: 'Clique aqui!',
    })
    expect(created.name).toBe('Marca Teste API')

    const updated = await viralStudioApi.updateBrand('vale-o-clique', {
      name: 'Vale o Clique Atualizado',
    })
    expect(updated.name).toBe('Vale o Clique Atualizado')

    const ws = await viralStudioApi.fetchBrandWorkspace('vale-o-clique')
    expect(ws.brand.id).toBe('vale-o-clique')

    const channels = await viralStudioApi.fetchBrandChannels('vale-o-clique')
    expect(channels.length).toBeGreaterThan(0)

    const avail = await viralStudioApi.fetchAvailableBrandChannels('vale-o-clique')
    expect(avail.length).toBeGreaterThan(0)

    const bind = await viralStudioApi.bindBrandChannels('vale-o-clique', { channel_ids: ['ch1'] })
    expect(bind.id).toBe('vale-o-clique')

    const conn = await viralStudioApi.getBrandConnectUrl('vale-o-clique')
    expect(conn.url).toBeDefined()

    const vids = await viralStudioApi.fetchBrandVideos('vale-o-clique', 'all')
    expect(Array.isArray(vids)).toBe(true)

    const autoSched = await viralStudioApi.autoScheduleBrandVideo('vale-o-clique', 'item-1')
    expect(autoSched.success).toBe(true)

    const pub = await viralStudioApi.publishBrandVideo('vale-o-clique', {
      item_id: 'item-1',
      publish_now: true,
    })
    expect(pub.success).toBe(true)

    const sched = await viralStudioApi.fetchBrandScheduled('vale-o-clique')
    expect(sched.posts.length).toBeGreaterThan(0)

    const cancel = await viralStudioApi.cancelBrandScheduledPost('vale-o-clique', 'post-1')
    expect(cancel.success).toBe(true)

    const pubNow = await viralStudioApi.publishBrandScheduledNow('vale-o-clique', 'post-1')
    expect(pubNow.success).toBe(true)

    const slots = await viralStudioApi.updateBrandScheduleSlots('vale-o-clique', {
      slots: ['10:00'],
      timezone: 'America/Sao_Paulo',
    })
    expect(slots.id).toBe('vale-o-clique')

    const pubWs = await viralStudioApi.fetchPublishingWorkspaces('postiz')
    expect(pubWs.length).toBeGreaterThan(0)
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
