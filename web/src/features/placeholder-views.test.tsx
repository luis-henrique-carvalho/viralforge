import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render'
import { ViralStudioView } from '@/features/viral-studio/views/viral-studio-view'
import { DiscoveryView } from '@/features/discovery/views/discovery-view'
import { ClipsView } from '@/features/pipeline-clips/views/clips-view'
import { SettingsView } from '@/features/settings/views/settings-view'

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
  useNavigate: () => vi.fn(),
}))

describe('Feature Initial Placeholder Views', () => {
  it('renders ViralStudioView', () => {
    renderWithProviders(<ViralStudioView />)
    expect(screen.getByText('Viral Content Studio')).toBeInTheDocument()
  })

  it('renders DiscoveryView', () => {
    renderWithProviders(<DiscoveryView />)
    expect(screen.getByText('Descoberta Multiplataforma')).toBeInTheDocument()
  })

  it('renders ClipsView', () => {
    renderWithProviders(<ClipsView />)
    expect(screen.getByText('Cortes 9:16 (Pipeline Tradicional)')).toBeInTheDocument()
  })

  it('renders SettingsView', () => {
    renderWithProviders(<SettingsView />)
    expect(screen.getByText('Configurações & Provedores')).toBeInTheDocument()
  })
})
