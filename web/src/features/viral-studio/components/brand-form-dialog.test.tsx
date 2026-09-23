import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render'
import { BrandFormDialog } from './brand-form-dialog'
import type { Brand } from '../data/batch.types'

describe('BrandFormDialog', () => {
  it('submits a new brand form', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    renderWithProviders(
      <BrandFormDialog
        isOpen={true}
        onClose={onClose}
      />,
    )

    expect(screen.getByText('Nova Marca')).toBeInTheDocument()

    const nameInput = screen.getByPlaceholderText(/Ex: Vale o Clique/i)
    const handleInput = screen.getByPlaceholderText(/@valeoclique/i)

    await user.type(nameInput, 'Minha Nova Marca')
    await user.type(handleInput, '@minhanovamarca')

    const submitBtn = screen.getByRole('button', { name: /Criar Marca/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('populates fields when editing an existing brand and submits update', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const brandToEdit: Brand = {
      id: 'vale-o-clique',
      name: 'Vale o Clique?',
      handle: '@valeoclique',
      avatar_path: null,
      logo_path: null,
      default_cta: 'CTA Antigo',
      default_affiliate_url: 'https://amzn.to/link',
      template_id: 'classic-affiliate',
      publishing_profiles: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    renderWithProviders(
      <BrandFormDialog
        isOpen={true}
        onClose={onClose}
        brandToEdit={brandToEdit}
      />,
    )

    expect(screen.getByText('Editar Perfil de Marca')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Vale o Clique?')).toBeInTheDocument()
    expect(screen.getByDisplayValue('@valeoclique')).toBeInTheDocument()

    const submitBtn = screen.getByRole('button', { name: /Atualizar Marca/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })
})
