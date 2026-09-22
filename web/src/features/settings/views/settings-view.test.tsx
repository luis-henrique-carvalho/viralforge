import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render'
import { SettingsView } from './settings-view'

describe('SettingsView Integration', () => {
  it('renders settings view with header and switches tabs smoothly', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SettingsView />)

    expect(screen.getByText('Configurações & Provedores')).toBeInTheDocument()
    expect(screen.getByText('Infraestrutura')).toBeInTheDocument()

    // Tab 1: Publishing (default)
    await waitFor(() => {
      expect(screen.getByText('Provedores de Publicação Social')).toBeInTheDocument()
    })

    // Click Tab 2: Modelos & IA
    await user.click(screen.getByText('Modelos & IA'))
    expect(screen.getByText('Modelos de IA & Raciocínio')).toBeInTheDocument()

    // Click Tab 3: Transcrição & Áudio
    await user.click(screen.getByText('Transcrição & Áudio'))
    expect(screen.getByText('Provedores de Transcrição & Áudio')).toBeInTheDocument()

    // Click Tab 4: Cookies de Sessão
    await user.click(screen.getByText('Cookies de Sessão'))
    expect(screen.getByText('Gerenciador de Cookies de Plataforma')).toBeInTheDocument()

    // Click Tab 5: Aceleração & Hardware
    await user.click(screen.getByText('Aceleração & Hardware'))
    expect(screen.getByText('Aceleração de Hardware & Telemetria')).toBeInTheDocument()

    // Click Tab 6: Marca & Tipografia
    await user.click(screen.getByText('Marca & Tipografia'))
    expect(screen.getByText('Identidade de Marca & Tipografia')).toBeInTheDocument()
  })
})
