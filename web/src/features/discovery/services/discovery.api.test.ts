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
})
