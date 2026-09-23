import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { AppSidebar } from './app-sidebar'
import { renderWithProviders } from '@/test-utils/render'
import { SidebarProvider } from '@/components/ui/sidebar'

// Mock TanStack router
vi.mock('@tanstack/react-router', () => ({
  useRouterState: () => ({
    location: { pathname: '/viral-studio' },
  }),
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

describe('AppSidebar Component', () => {
  it('renders all main navigation links and brand title', () => {
    renderWithProviders(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>,
    )

    expect(screen.getByText('Viral')).toBeInTheDocument()
    expect(screen.getByText('Forge')).toBeInTheDocument()
    expect(screen.getByText('Viral Studio')).toBeInTheDocument()
    expect(screen.getByText('Descoberta')).toBeInTheDocument()
    expect(screen.getByText('Cortes 9:16')).toBeInTheDocument()
    expect(screen.getByText('Configurações')).toBeInTheDocument()
    expect(screen.getByText('CORE')).toBeInTheDocument()
  })
})
