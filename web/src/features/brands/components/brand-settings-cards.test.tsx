import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render'
import { BrandSettingsMotorCard, getBrandActiveProvider } from './brand-settings-motor-card'
import { BrandSettingsScheduleCard } from './brand-settings-schedule-card'
import { BrandSettingsIdentityCard } from './brand-settings-identity-card'
import { visualTemplateSchema } from '@/features/viral-studio/data/template.schema'
import type { Brand } from '../data/brand.types'

const mockBrand: Brand = {
  id: 'vale-o-clique',
  name: 'Vale o Clique?',
  handle: '@valeoclique',
  niche: 'Achadinhos',
  discovery_keywords: ['achadinhos', 'shopee'],
  avatar_path: null,
  avatar_url: null,
  logo_path: null,
  default_cta: 'Confira os achadinhos!',
  default_affiliate_url: 'https://amzn.to/vale',
  template_id: 'classic-affiliate',
  posting_schedule: {
    frequency: 3,
    slots: ['10:00', '15:00', '20:00'],
    timezone: 'America/Sao_Paulo',
  },
  publishing_profiles: {
    zernio: { customer_id: 'cust_z', active: false, linked_at: '2026-09-27T10:00:00Z' },
    postiz: { customer_id: 'cust_p', active: true, linked_at: '2026-09-27T12:00:00Z' },
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('Brand Settings Cards', () => {
  it('correctly resolves active provider via getBrandActiveProvider', () => {
    expect(getBrandActiveProvider(mockBrand)).toBe('postiz')

    const brandWithoutActiveFlag: Brand = {
      ...mockBrand,
      publishing_profiles: {
        zernio: { customer_id: 'z1', linked_at: '2026-09-27T10:00:00Z' },
        postiz: { customer_id: 'p1', linked_at: '2026-09-27T14:00:00Z' },
      },
    }
    expect(getBrandActiveProvider(brandWithoutActiveFlag)).toBe('postiz')
  })

  it('renders and saves Motor Card with active flag', async () => {
    const onSave = vi.fn()
    renderWithProviders(
      <BrandSettingsMotorCard
        brand={mockBrand}
        workspaces={[{ id: 'ws_1', name: 'Workspace 1', provider: 'postiz' }]}
        onSave={onSave}
        isPending={false}
      />,
    )

    expect(screen.getByText('Motor de Publicação & Provedor')).toBeInTheDocument()
    const saveBtn = screen.getByRole('button', { name: /Salvar Configurações do Motor/i })
    fireEvent.click(saveBtn)

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        postiz: expect.objectContaining({ active: true }),
        zernio: expect.objectContaining({ active: false }),
      }),
    )
  })

  it('renders, modifies slots and saves Schedule Card', async () => {
    const onSave = vi.fn()
    renderWithProviders(
      <BrandSettingsScheduleCard
        brand={mockBrand}
        onSave={onSave}
        isPending={false}
      />,
    )

    expect(screen.getByText(/Grade de Postagens Diárias/i)).toBeInTheDocument()

    // Change frequency
    const freq2Btn = screen.getByRole('button', { name: /2x ao dia/i })
    fireEvent.click(freq2Btn)

    // Add slot
    const addBtn = screen.getByRole('button', { name: /Adicionar Horário/i })
    fireEvent.click(addBtn)

    // Modify a slot input
    const timeInputs = screen.getAllByDisplayValue(/^(12:00|19:00)/)
    if (timeInputs[0]) {
      fireEvent.change(timeInputs[0], { target: { value: '11:00' } })
    }

    // Remove a slot
    const removeBtns = screen.getAllByRole('button', { name: '' })
    if (removeBtns[0]) {
      fireEvent.click(removeBtns[0])
    }

    const saveBtn = screen.getByRole('button', { name: /Salvar Grade de Postagens/i })
    fireEvent.click(saveBtn)

    expect(onSave).toHaveBeenCalled()
  })

  it('renders and saves Identity Card', async () => {
    const onSave = vi.fn()
    const mockTmpl = visualTemplateSchema.parse({
      id: 'classic-affiliate',
      name: 'Classic Affiliate',
    })
    renderWithProviders(
      <BrandSettingsIdentityCard
        brand={mockBrand}
        templates={[mockTmpl]}
        onSave={onSave}
        isPending={false}
      />,
    )

    expect(screen.getByText('Identidade & Diretrizes Editoriais')).toBeInTheDocument()

    const nameInput = screen.getByLabelText(/Nome da Marca/i)
    fireEvent.change(nameInput, { target: { value: 'Vale o Clique Novo' } })

    const saveBtn = screen.getByRole('button', { name: /Salvar Diretrizes da Marca/i })
    fireEvent.click(saveBtn)

    expect(onSave).toHaveBeenCalled()
  })
})
