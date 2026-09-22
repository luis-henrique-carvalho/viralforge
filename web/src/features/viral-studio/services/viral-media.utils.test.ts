import { describe, expect, it } from 'vitest'
import { getViralVideoUrl } from './viral-media.utils'
import type { ViralItem } from '../data/batch.types'

describe('viral-media.utils', () => {
  const baseItem: ViralItem = {
    id: 'item-abc',
    batch_id: 'batch-123',
    source_url: 'https://tiktok.com/@video/1',
    status: 'READY_FOR_REVIEW',
    rendered_path: '/data/rendered.mp4',
    keyframe_urls: [],
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
})
