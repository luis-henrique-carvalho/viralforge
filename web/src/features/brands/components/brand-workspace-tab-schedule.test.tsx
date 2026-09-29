import { describe, expect, it } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test-utils/server'
import { renderWithProviders } from '@/test-utils/render'
import { BrandWorkspaceTabSchedule } from './brand-workspace-tab-schedule'
import type { Brand } from '../data/brand.types'

const mockBrand: Brand = {
  id: 'vale-o-clique',
  name: 'Vale o Clique?',
  handle: '@valeoclique',
  default_cta: 'CTA',
  template_id: 'classic-affiliate',
  publishing_profiles: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('BrandWorkspaceTabSchedule', () => {
  it('renders schedule timeline and triggers cancel modal', async () => {
    renderWithProviders(<BrandWorkspaceTabSchedule brand={mockBrand} />)

    expect(screen.getByText('Agenda de Postagens & Linha do Tempo')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Suporte Magnético 360')).toBeInTheDocument()
    })

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i })
    fireEvent.click(cancelBtn)

    await waitFor(() => {
      expect(screen.getByText('Cancelar Agendamento?')).toBeInTheDocument()
    })

    const confirmBtn = screen.getByRole('button', { name: /Confirmar Cancelamento/i })
    fireEvent.click(confirmBtn)
  })

  it('correctly handles posts with id and scheduled_for without passing undefined to cancel endpoint', async () => {
    let capturedDeletedPostId: string | null = null

    server.use(
      http.get('/api/brands/:id/scheduled', () => {
        return HttpResponse.json({
          brand_id: 'vale-o-clique',
          posts: [
            {
              id: 'post_real_999',
              title: 'A mesa de desenho que toda criança ama! 😍',
              status: 'scheduled',
              scheduled_for: '2026-10-15T14:30:00Z',
              channels: ['tiktok'],
            },
          ],
          total: 1,
        })
      }),
      http.delete('/api/brands/:id/scheduled/:postId', ({ params }) => {
        capturedDeletedPostId = params.postId as string
        return HttpResponse.json({ success: true, post_id: params.postId })
      }),
      http.get('/api/viral-studio/brands/:id/scheduled', () => {
        return HttpResponse.json({
          brand_id: 'vale-o-clique',
          posts: [
            {
              id: 'post_real_999',
              title: 'A mesa de desenho que toda criança ama! 😍',
              status: 'scheduled',
              scheduled_for: '2026-10-15T14:30:00Z',
              channels: ['tiktok'],
            },
          ],
          total: 1,
        })
      }),
      http.delete('/api/viral-studio/brands/:id/scheduled/:postId', ({ params }) => {
        capturedDeletedPostId = params.postId as string
        return HttpResponse.json({ success: true, post_id: params.postId })
      }),
    )

    renderWithProviders(<BrandWorkspaceTabSchedule brand={mockBrand} />)

    await waitFor(() => {
      expect(screen.getByText('A mesa de desenho que toda criança ama! 😍')).toBeInTheDocument()
    })

    // Assert that scheduled date is formatted instead of "Horário a definir"
    expect(screen.queryByText('Horário a definir')).not.toBeInTheDocument()

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i })
    fireEvent.click(cancelBtn)

    await waitFor(() => {
      expect(screen.getByText('Cancelar Agendamento?')).toBeInTheDocument()
    })

    const confirmBtn = screen.getByRole('button', { name: /Confirmar Cancelamento/i })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(capturedDeletedPostId).toBe('post_real_999')
    })
    expect(capturedDeletedPostId).not.toBe('undefined')
  })
})
