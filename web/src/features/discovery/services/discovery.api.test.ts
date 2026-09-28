import { describe, expect, it } from 'vitest'
import { discoveryApi } from './discovery.api'

describe('discoveryApi', () => {
  it('searches videos via POST /api/discovery/search', async () => {
    const result = await discoveryApi.search({
      query: 'achadinhos',
      platform: 'tiktok',
      limit: 10,
    })
    expect(result.platform).toBe('tiktok')
    expect(result.query).toBe('achadinhos')
    expect(result.items.length).toBeGreaterThan(0)
  })

  it('fetches supported platforms via GET /api/discovery/platforms', async () => {
    const result = await discoveryApi.fetchPlatforms()
    const platformIds = result.platforms.map((p) => p.id)
    expect(platformIds).toContain('tiktok')
    expect(platformIds).toContain('instagram')
    expect(platformIds).toContain('youtube')
  })

  it('executes full async search lifecycle: create, get, list, cancel, delete', async () => {
    // 1. Create
    const summary = await discoveryApi.createSearch({
      query: 'novidades',
      platform: 'tiktok',
      limit: 10,
    })
    expect(summary.id).toBeDefined()
    expect(summary.query).toBe('novidades')

    // 2. Fetch detail
    const detail = await discoveryApi.fetchSearch(summary.id)
    expect(detail.id).toBe(summary.id)
    expect(detail.query).toBe('novidades')
    expect(detail.items.length).toBeGreaterThan(0)

    // 3. List
    const searches = await discoveryApi.fetchSearches()
    expect(searches.some((s) => s.id === summary.id)).toBe(true)

    // 4. Cancel
    const cancelled = await discoveryApi.cancelSearch(summary.id)
    expect(cancelled.status).toBe('CANCELLED')

    // 5. Delete
    const deleteRes = await discoveryApi.deleteSearch(summary.id)
    expect(deleteRes.success).toBe(true)
  })
})
