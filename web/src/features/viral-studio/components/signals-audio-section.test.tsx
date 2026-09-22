import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render'
import { SignalsAudioSection } from './signals-audio-section'

describe('SignalsAudioSection', () => {
  it('renders speech detection badge and transcript with copy action', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <SignalsAudioSection
        transcript="Esta é a transcrição do áudio gravado"
        transcriptWords={7}
      />,
    )

    expect(screen.getByText(/Fala detectada \(7 palavras\)/i)).toBeInTheDocument()
    expect(screen.getByText('Esta é a transcrição do áudio gravado')).toBeInTheDocument()

    const copyBtn = screen.getByRole('button', { name: /Copiar/i })
    await user.click(copyBtn)
    expect(screen.getByText('Copiado')).toBeInTheDocument()
  })

  it('renders instrumental badge when no speech is present', () => {
    renderWithProviders(<SignalsAudioSection transcript="" />)

    expect(screen.getByText(/Instrumental \/ Sem fala/i)).toBeInTheDocument()
    expect(screen.getByText(/Nenhuma faixa de voz identificada no áudio/i)).toBeInTheDocument()
  })
})
