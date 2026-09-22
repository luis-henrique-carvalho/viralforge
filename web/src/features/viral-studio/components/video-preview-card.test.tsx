import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VideoPreviewCard } from './video-preview-card'
import type { ViralItem } from '../data/batch.types'

describe('VideoPreviewCard', () => {
  const baseItem: ViralItem = {
    id: 'item-1',
    source_url: 'https://tiktok.com/@user/video/1',
    status: 'READY_FOR_REVIEW',
    rendered_path: '/data/rendered/item-1.mp4',
    keyframe_urls: ['/data/keyframes/frame-1.jpg'],
    logs: [],
    publication_records: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  it('renders video element and triggers play and pause on user click', async () => {
    const playMock = vi.fn().mockResolvedValue(undefined)
    const pauseMock = vi.fn()
    window.HTMLMediaElement.prototype.play = playMock
    window.HTMLMediaElement.prototype.pause = pauseMock

    render(<VideoPreviewCard item={baseItem} />)
    const card = screen.getByRole('button')
    expect(card).toBeInTheDocument()

    // Click to play
    fireEvent.click(card)
    expect(playMock).toHaveBeenCalled()
  })

  it('handles keyboard space and enter triggers', () => {
    const playMock = vi.fn().mockResolvedValue(undefined)
    window.HTMLMediaElement.prototype.play = playMock

    render(<VideoPreviewCard item={baseItem} />)
    const card = screen.getByRole('button')

    fireEvent.keyDown(card, { key: 'Enter' })
    expect(playMock).toHaveBeenCalled()
  })

  it('renders active processing step when status is ANALYZING', () => {
    const busyItem: ViralItem = {
      ...baseItem,
      status: 'ANALYZING',
      rendered_path: null,
      model: 'gemini-2.5-flash',
    }
    render(<VideoPreviewCard item={busyItem} />)
    expect(screen.getByText('IA Analisando')).toBeInTheDocument()
    expect(screen.getByText('Modelo: gemini-2.5-flash')).toBeInTheDocument()
  })

  it('renders active processing step when status is DOWNLOADING and RENDERING', () => {
    const dlItem: ViralItem = { ...baseItem, status: 'DOWNLOADING', rendered_path: null }
    const { rerender } = render(<VideoPreviewCard item={dlItem} />)
    expect(screen.getByText('Baixando Fonte')).toBeInTheDocument()

    const renderItem: ViralItem = { ...baseItem, status: 'RENDERING', rendered_path: null }
    rerender(<VideoPreviewCard item={renderItem} />)
    expect(screen.getByText('Renderizando 9:16')).toBeInTheDocument()
  })

  it('renders failed state with error message', () => {
    const failedItem: ViralItem = {
      ...baseItem,
      status: 'FAILED',
      rendered_path: null,
      error_message: 'Video resolution too low',
    }
    render(<VideoPreviewCard item={failedItem} />)
    expect(screen.getByText('Falha no Processamento')).toBeInTheDocument()
    expect(screen.getByText('Video resolution too low')).toBeInTheDocument()
  })

  it('renders fallback when no media and idle', () => {
    const idleItem: ViralItem = {
      ...baseItem,
      status: 'PENDING',
      rendered_path: null,
      keyframe_urls: [],
    }
    render(<VideoPreviewCard item={idleItem} />)
    expect(screen.getByText('Aguardando Fila')).toBeInTheDocument()
  })
})
