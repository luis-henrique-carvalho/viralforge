import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render'
import { SignalsMetadataSection } from './signals-metadata-section'

describe('SignalsMetadataSection', () => {
  it('renders post title, author, metrics, and tags', async () => {
    const user = userEvent.setup()
    const metadata = {
      title: 'Review de Gadgets',
      uploader: '@techmaster',
      caption: 'Link com desconto no perfil!',
      tags: ['tecnologia', 'achados'],
      viewCount: 1500000,
      likeCount: 45000,
      commentCount: 320,
      repostCount: 120,
    }

    renderWithProviders(<SignalsMetadataSection metadata={metadata} />)

    expect(screen.getByText('Review de Gadgets')).toBeInTheDocument()
    expect(screen.getByText('@techmaster')).toBeInTheDocument()
    expect(screen.getByText(/1.5M visualizações/i)).toBeInTheDocument()
    expect(screen.getByText(/45K curtidas/i)).toBeInTheDocument()
    expect(screen.getByText(/320 comentários/i)).toBeInTheDocument()
    expect(screen.getByText(/120 compartilhamentos/i)).toBeInTheDocument()
    expect(screen.getByText('#tecnologia')).toBeInTheDocument()

    const copyBtn = screen.getByRole('button', { name: /Copiar Legenda/i })
    await user.click(copyBtn)
    expect(screen.getByText('Copiado')).toBeInTheDocument()
  })
})
