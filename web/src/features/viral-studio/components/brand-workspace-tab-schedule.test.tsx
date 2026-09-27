import { describe, expect, it } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render'
import { BrandWorkspaceTabSchedule } from './brand-workspace-tab-schedule'
import type { Brand } from '../data/batch.types'

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

    const cancelBtn = screen.getByRole('button', { name: /Cancelar Agendamento/i })
    fireEvent.click(cancelBtn)

    await waitFor(() => {
      expect(screen.getByText('Cancelar Agendamento?')).toBeInTheDocument()
    })

    const confirmBtn = screen.getByRole('button', { name: /Confirmar Cancelamento/i })
    fireEvent.click(confirmBtn)
  })
})
