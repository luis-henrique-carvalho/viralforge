import { describe, expect, it } from 'vitest'
import { getViralPosterUrl, getViralVideoUrl } from './viral-media.utils'
import type { ViralItem } from '../data/batch.types'

describe('viral-media.utils', () => {
  const baseItem: ViralItem = {
    id: 'item-abc',
    batch_id: 'batch-123',
    source_url: 'https://tiktok.com/@video/1',
    status: 'READY_FOR_REVIEW',
    rendered_path: '/data/rendered.mp4',
    keyframe_urls: ['/data/keyframes/scene_0.jpg'],
    logs: [],
    publication_records: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T12:00:00Z',
  }

  it('returns correctly formatted video URL with batch and cache buster', () => {
    const url = getViralVideoUrl(baseItem)
    expect(url).toContain('/videos/viral_studio/batch-123/item-abc/rendered.mp4?v=')
  })

  it('returns undefined when rendered_path is null', () => {
    const url = getViralVideoUrl({ ...baseItem, rendered_path: null })
    expect(url).toBeUndefined()
  })

  it('returns undefined when item.id is empty', () => {
    const url = getViralVideoUrl({ ...baseItem, id: '' })
    expect(url).toBeUndefined()
  })

  it('returns rendered thumbnail URL when rendered_path is present', () => {
    const posterUrl = getViralPosterUrl(baseItem)
    expect(posterUrl).toContain('/videos/viral_studio/batch-123/item-abc/rendered_thumbnail.jpg?v=')
  })

  it('falls back to keyframe when rendered_path is null', () => {
    const posterUrl = getViralPosterUrl({ ...baseItem, rendered_path: null })
    expect(posterUrl).toBe('/data/keyframes/scene_0.jpg')
  })
})
