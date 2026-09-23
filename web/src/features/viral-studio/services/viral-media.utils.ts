import type { ViralItem } from '../data/batch.types'

/**
 * Returns the public URL to stream the rendered 9:16 MP4 video for a given ViralItem.
 * Returns undefined if the item has not been rendered yet or lacks essential IDs.
 */
export function getViralVideoUrl(item: ViralItem): string | undefined {
  if (!item.rendered_path) return undefined
  if (!item.id) return undefined

  // If the item has a batch_id, it is served under /videos/viral_studio/{batch_id}/{item_id}/rendered.mp4
  const batchSegment = item.batch_id ? `${item.batch_id}/` : ''
  const basePath = `/videos/viral_studio/${batchSegment}${item.id}/rendered.mp4`

  const cacheBuster = item.updated_at ? new Date(item.updated_at).getTime() : Date.now()
  return `${basePath}?v=${cacheBuster}`
}

/**
 * Returns the URL for the video thumbnail / poster image.
 * When the video has been rendered, it prefers the rendered thumbnail (which includes
 * the header, avatar, brand and headline). Falls back to the first keyframe during analysis.
 */
export function getViralPosterUrl(item: ViralItem): string | undefined {
  if (!item.id) return undefined

  const batchSegment = item.batch_id ? `${item.batch_id}/` : ''
  const cacheBuster = item.updated_at ? new Date(item.updated_at).getTime() : Date.now()

  if (item.rendered_path) {
    return `/videos/viral_studio/${batchSegment}${item.id}/rendered_thumbnail.jpg?v=${cacheBuster}`
  }

  return item.keyframe_urls?.[0] || undefined
}
