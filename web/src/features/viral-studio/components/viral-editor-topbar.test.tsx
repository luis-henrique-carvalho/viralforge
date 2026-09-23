import { describe, expect, it, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render'
import { ViralEditorTopbar } from './viral-editor-topbar'
import type { Brand, ViralItem, VisualTemplate } from '../data/batch.types'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    className,
  }: {
    children: React.ReactNode
    to: string
    className?: string
  }) => (
    <a
      href={to}
      className={className}
    >
      {children}
    </a>
  ),
}))

const mockItem: ViralItem = {
  id: 'item-101',
  source_url: 'https://example.com/video',
  product_code: 'PROD-99',
  status: 'READY_FOR_REVIEW',
  keyframe_urls: [],
  logs: [],
  publication_records: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const mockBrand: Brand = {
  id: 'brand-1',
  name: 'Vale o Clique?',
  handle: '@valeoclique',
  avatar_path: null,
  logo_path: null,
  default_cta: 'Link na bio',
  default_affiliate_url: null,
  template_id: 'classic',
  publishing_profiles: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const mockTemplate: VisualTemplate = {
  id: 'classic',
  name: 'Classic Affiliate',
  width: 1080,
  height: 1920,
  background_color: '#fff',
  avatar_enabled: true,
  brand_name_enabled: true,
  headline_enabled: true,
  watermark_enabled: true,
  video_fit: 'contain',
  avatar_x: 60,
  avatar_y: 80,
  avatar_size: 100,
  brand_name_font_size: 36,
  brand_name_color: '#000',
  handle_font_size: 26,
  handle_color: '#666',
  headline_font_size: 48,
  headline_color: '#000',
  headline_max_lines: 3,
  headline_margin_x: 60,
  headline_margin_top: 30,
  watermark_opacity: 0.7,
  watermark_position: 'bottom-right',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('ViralEditorTopbar', () => {
  it('renders breadcrumbs, brand, template, index indicator and triggers navigation callbacks', () => {
    const onBack = vi.fn()
    const onNavigatePrev = vi.fn()
    const onNavigateNext = vi.fn()

    renderWithProviders(
      <ViralEditorTopbar
        item={mockItem}
        batchId="batch-abc-12345"
        currentIndex={1}
        totalItems={5}
        brand={mockBrand}
        template={mockTemplate}
        onBack={onBack}
        onNavigatePrev={onNavigatePrev}
        onNavigateNext={onNavigateNext}
        hasPrev={true}
        hasNext={true}
      />,
    )

    // Breadcrumbs & labels
    expect(screen.getByText('Lotes')).toBeInTheDocument()
    expect(screen.getByText('Lote #batch-ab')).toBeInTheDocument()
    expect(screen.getByText('Vídeo #PROD-99')).toBeInTheDocument()
    expect(screen.getByText('Vale o Clique?')).toBeInTheDocument()
    expect(screen.getByText('Classic Affiliate')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()

    // Voltar ao Lote button
    const backBtn = screen.getByRole('button', { name: /Voltar ao Lote/i })
    fireEvent.click(backBtn)
    expect(onBack).toHaveBeenCalledTimes(1)

    // Prev / Next buttons
    const prevBtn = screen.getByRole('button', { name: /Vídeo anterior/i })
    fireEvent.click(prevBtn)
    expect(onNavigatePrev).toHaveBeenCalledTimes(1)

    const nextBtn = screen.getByRole('button', { name: /Próximo vídeo/i })
    fireEvent.click(nextBtn)
    expect(onNavigateNext).toHaveBeenCalledTimes(1)
  })

  it('disables prev/next buttons when hasPrev or hasNext is false', () => {
    renderWithProviders(
      <ViralEditorTopbar
        item={mockItem}
        batchId="batch-abc"
        currentIndex={0}
        totalItems={2}
        onBack={vi.fn()}
        onNavigatePrev={vi.fn()}
        onNavigateNext={vi.fn()}
        hasPrev={false}
        hasNext={false}
      />,
    )

    const prevBtn = screen.getByRole('button', { name: /Vídeo anterior/i })
    const nextBtn = screen.getByRole('button', { name: /Próximo vídeo/i })
    expect(prevBtn).toBeDisabled()
    expect(nextBtn).toBeDisabled()
  })
})
