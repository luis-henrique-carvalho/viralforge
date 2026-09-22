import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UnsavedChangesDialog } from './unsaved-changes-dialog'

describe('UnsavedChangesDialog', () => {
  it('renders dialog when open and triggers discard, save and cancel actions', () => {
    const onOpenChange = vi.fn()
    const onConfirmDiscard = vi.fn()
    const onSaveAndProceed = vi.fn()

    const { rerender } = render(
      <UnsavedChangesDialog
        isOpen={true}
        onOpenChange={onOpenChange}
        onConfirmDiscard={onConfirmDiscard}
        onSaveAndProceed={onSaveAndProceed}
      />,
    )

    expect(screen.getByText('Alterações não salvas')).toBeInTheDocument()
    expect(screen.getByText(/Você possui alterações não salvas neste vídeo/i)).toBeInTheDocument()

    // Discard button
    const discardBtn = screen.getByRole('button', { name: /Descartar Alterações/i })
    fireEvent.click(discardBtn)
    expect(onConfirmDiscard).toHaveBeenCalledTimes(1)

    // Save and continue button
    const saveBtn = screen.getByRole('button', { name: /Salvar e Continuar/i })
    fireEvent.click(saveBtn)
    expect(onSaveAndProceed).toHaveBeenCalledTimes(1)

    // Cancel / Remain button
    const cancelBtn = screen.getByRole('button', { name: /Permanecer no Vídeo/i })
    fireEvent.click(cancelBtn)
    expect(onOpenChange).toHaveBeenCalledWith(false)

    // Rerender with isSaving=true
    rerender(
      <UnsavedChangesDialog
        isOpen={true}
        onOpenChange={onOpenChange}
        onConfirmDiscard={onConfirmDiscard}
        onSaveAndProceed={onSaveAndProceed}
        isSaving={true}
      />,
    )
    expect(screen.getByText('Salvando…')).toBeInTheDocument()
  })
})
