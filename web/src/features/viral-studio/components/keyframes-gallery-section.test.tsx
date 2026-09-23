import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render'
import { KeyframesGallerySection } from './keyframes-gallery-section'

describe('KeyframesGallerySection', () => {
  it('renders keyframe thumbnails and opens lightbox when clicked', async () => {
    const user = userEvent.setup()
    const urls = ['https://example.com/frame1.jpg', 'https://example.com/frame2.jpg']

    renderWithProviders(<KeyframesGallerySection keyframeUrls={urls} />)

    expect(screen.getByText(/Frames Extraídos por Cena \(2 frames\)/i)).toBeInTheDocument()

    const sceneButtons = screen.getAllByRole('button', {
      name: /Frame da Cena/i,
    })
    expect(sceneButtons).toHaveLength(2)

    await user.click(sceneButtons[0])

    expect(screen.getByText(/Frame extraído para análise visual/i)).toBeInTheDocument()
  })

  it('renders fallback when no keyframes are available', () => {
    renderWithProviders(<KeyframesGallerySection keyframeUrls={[]} />)

    expect(
      screen.getByText(/Nenhum frame extraído ou extração de cena pendente/i),
    ).toBeInTheDocument()
  })
})
