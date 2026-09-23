import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { TopNav } from './top-nav'
import { renderWithProviders } from '@/test-utils/render'
import { server } from '@/test-utils/server'

// Mock TanStack router state
vi.mock('@tanstack/react-router', () => ({
  useRouterState: () => ({
    location: { pathname: '/viral-studio' },
  }),
}))

describe('TopNav Component', () => {
  it('renders brand title and active route breadcrumb', async () => {
    renderWithProviders(<TopNav />)

    expect(screen.getByText('Viral Content Studio')).toBeInTheDocument()
    expect(screen.getByText('v0.1.0 Beta')).toBeInTheDocument()
    expect(screen.getByText('VF')).toBeInTheDocument()
  })

  it('displays API Conectada when healthcheck returns ok via MSW', async () => {
    renderWithProviders(<TopNav />)

    await waitFor(() => {
      expect(screen.getByText('API Conectada')).toBeInTheDocument()
    })
  })

  it('displays API Desconectada when healthcheck fails via MSW', async () => {
    server.use(
      http.get('/api/health', () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    renderWithProviders(<TopNav />)

    await waitFor(() => {
      expect(screen.getByText('API Desconectada')).toBeInTheDocument()
    })
  })
})
