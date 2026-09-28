import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ScheduledTimelineCard } from './scheduled-timeline-card'
import type { ScheduledPost } from '../data/batch.types'

describe('ScheduledTimelineCard', () => {
  const basePost: ScheduledPost = {
    id: 'post_1',
    post_id: 'post_1',
    brand_id: 'brand_1',
    title: 'Top 5 Curiosidades que Vão Explodir Sua Mente',
    content: 'Legenda completa do post explicando todos os detalhes interessantes da publicação.',
    status: 'scheduled',
    scheduled_for: '2026-10-15T18:00:00Z',
    platform: 'tiktok',
    channels: ['tiktok'],
    channel_name: '@curiosidades',
    channel_handle: '@curiosidades',
    provider: 'postiz',
    thumbnail_url: 'https://example.com/thumb.jpg',
    metrics: { views: 1520, likes: 320, comments: 45 },
  }

  it('renders scheduled post with provider badge, channel info, and action buttons', () => {
    const onCancelClick = vi.fn()
    const onPublishNowClick = vi.fn()

    render(
      <ScheduledTimelineCard
        post={basePost}
        onCancelClick={onCancelClick}
        onPublishNowClick={onPublishNowClick}
      />,
    )

    expect(screen.getByText('Top 5 Curiosidades que Vão Explodir Sua Mente')).toBeInTheDocument()
    expect(screen.getByText('Agendado')).toBeInTheDocument()
    expect(screen.getByText('postiz')).toBeInTheDocument()
    expect(screen.getByText('@curiosidades')).toBeInTheDocument()

    const publishNowBtn = screen.getByRole('button', { name: /Publicar Agora/i })
    fireEvent.click(publishNowBtn)
    expect(onPublishNowClick).toHaveBeenCalledWith(basePost)

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i })
    fireEvent.click(cancelBtn)
    expect(onCancelClick).toHaveBeenCalledWith(basePost)
  })

  it('renders active queue state with spinner badge', () => {
    const queuedPost: ScheduledPost = {
      ...basePost,
      status: 'UPLOADING',
    }

    render(
      <ScheduledTimelineCard
        post={queuedPost}
        onCancelClick={vi.fn()}
      />,
    )

    expect(screen.getByText('Enviando...')).toBeInTheDocument()
  })

  it('renders published post with engagement metrics and post link', () => {
    const publishedPost: ScheduledPost = {
      ...basePost,
      status: 'PUBLISHED',
      post_url: 'https://tiktok.com/@curiosidades/video/12345',
    }

    render(
      <ScheduledTimelineCard
        post={publishedPost}
        onCancelClick={vi.fn()}
      />,
    )

    expect(screen.getByText('Publicado')).toBeInTheDocument()
    expect(screen.getByText('1520')).toBeInTheDocument()
    expect(screen.getByText('320')).toBeInTheDocument()
    expect(screen.getByText('45')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver Post/i })).toHaveAttribute(
      'href',
      'https://tiktok.com/@curiosidades/video/12345',
    )
  })
})
