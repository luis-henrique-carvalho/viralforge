import { describe, expect, it } from 'vitest'
import { brandApi } from './brand.api'
import { brandKeys } from './brand.keys'

describe('brandApi & brandKeys', () => {
  it('generates consistent brandKeys', () => {
    expect(brandKeys.all).toEqual(['brands'])
    expect(brandKeys.lists()).toEqual(['brands', 'list'])
    expect(brandKeys.list({ q: 'test' })).toEqual(['brands', 'list', { filters: { q: 'test' } }])
    expect(brandKeys.details()).toEqual(['brands', 'detail'])
    expect(brandKeys.detail('brand-1')).toEqual(['brands', 'detail', 'brand-1'])
    expect(brandKeys.workspaces()).toEqual(['brands', 'workspace'])
    expect(brandKeys.workspace('brand-1')).toEqual(['brands', 'workspace', 'brand-1'])
    expect(brandKeys.channels('brand-1')).toEqual(['brands', 'channels', 'brand-1'])
    expect(brandKeys.availableChannels('brand-1')).toEqual([
      'brands',
      'channels',
      'available',
      'brand-1',
    ])
    expect(brandKeys.videos('brand-1', 'all')).toEqual([
      'brands',
      'videos',
      'brand-1',
      { status: 'all' },
    ])
    expect(brandKeys.scheduled('brand-1', '2026-01-01', '2026-01-02')).toEqual([
      'brands',
      'scheduled',
      'brand-1',
      { startDate: '2026-01-01', endDate: '2026-01-02' },
    ])
    expect(brandKeys.publishingWorkspaces('postiz')).toEqual([
      'publishing',
      'workspaces',
      { provider: 'postiz' },
    ])
  })

  it('calls brandApi methods against MSW endpoints', async () => {
    const listRes = await brandApi.fetchBrands()
    expect(listRes.brands.length).toBeGreaterThan(0)

    const brandRes = await brandApi.fetchBrand('vale-o-clique')
    expect(brandRes.id).toBe('vale-o-clique')

    const createRes = await brandApi.createBrand({
      name: 'Nova Marca API Test',
      handle: '@novamarcaapi',
    })
    expect(createRes.name).toBe('Nova Marca API Test')

    const updateRes = await brandApi.updateBrand('vale-o-clique', {
      default_cta: 'CTA Atualizado',
    })
    expect(updateRes.id).toBe('vale-o-clique')

    const wsRes = await brandApi.fetchBrandWorkspace('vale-o-clique')
    expect(wsRes.brand.id).toBe('vale-o-clique')

    const channelsRes = await brandApi.fetchBrandChannels('vale-o-clique')
    expect(channelsRes.length).toBeGreaterThan(0)

    const availChannels = await brandApi.fetchAvailableBrandChannels('vale-o-clique')
    expect(availChannels.length).toBeGreaterThan(0)

    const bindRes = await brandApi.bindBrandChannels('vale-o-clique', {
      channel_ids: ['mock_tiktok_01'],
    })
    expect(bindRes.id).toBe('vale-o-clique')

    const connectUrl = await brandApi.getBrandConnectUrl('vale-o-clique')
    expect(connectUrl.url).toBeTruthy()

    const videos = await brandApi.fetchBrandVideos('vale-o-clique', 'all')
    expect(Array.isArray(videos)).toBe(true)

    const autoSched = await brandApi.autoScheduleBrandVideo('vale-o-clique', 'item-1')
    expect(autoSched.success).toBe(true)

    const pubRes = await brandApi.publishBrandVideo('vale-o-clique', {
      item_id: 'item-1',
      publish_now: true,
    })
    expect(pubRes.success).toBe(true)

    const schedRes = await brandApi.fetchBrandScheduled('vale-o-clique')
    expect(schedRes.posts.length).toBeGreaterThan(0)

    const cancelPost = await brandApi.cancelBrandScheduledPost('vale-o-clique', 'post_mock_101')
    expect(cancelPost.success).toBe(true)

    const pubNow = await brandApi.publishBrandScheduledNow('vale-o-clique', 'post_mock_101')
    expect(pubNow.success).toBe(true)

    const slotsRes = await brandApi.updateBrandScheduleSlots('vale-o-clique', {
      slots: ['10:00', '16:00'],
      timezone: 'America/Sao_Paulo',
    })
    expect(slotsRes.id).toBe('vale-o-clique')

    const workspaces = await brandApi.fetchPublishingWorkspaces('postiz')
    expect(workspaces.length).toBeGreaterThan(0)
  })
})
