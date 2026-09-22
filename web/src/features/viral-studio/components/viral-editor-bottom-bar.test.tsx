import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ViralEditorBottomBar } from './viral-editor-bottom-bar'
import type { ViralItem } from '../data/batch.types'

const mockItem: ViralItem = {
  id: 'item-101',
  source_url: 'https://example.com/video',
  product_code: 'PROD-99',
  status: 'READY_FOR_REVIEW',
  keyframe_urls: [],
  logs: [],
  publication_records: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('ViralEditorBottomBar', () => {
  it('renders all saved state and triggers actions', () => {
    const onDiscard = vi.fn()
    const onSave = vi.fn()
    const onApprove = vi.fn()

    const { rerender } = render(
      <ViralEditorBottomBar
        item={mockItem}
        isDirty={false}
        isSaving={false}
        onDiscard={onDiscard}
        onSave={onSave}
        onApprove={onApprove}
      />,
    )

    expect(screen.getByText('Todas as alterações salvas')).toBeInTheDocument()
    const saveBtn = screen.getByRole('button', { name: /Salvar Alterações/i })
    const discardBtn = screen.getByRole('button', { name: /Descartar/i })
    expect(saveBtn).toBeDisabled()
    expect(discardBtn).toBeDisabled()

    // Approve button works
    const approveBtn = screen.getByRole('button', { name: /Aprovar Vídeo/i })
    fireEvent.click(approveBtn)
    expect(onApprove).toHaveBeenCalledWith('item-101')

    // Rerender as dirty
    rerender(
      <ViralEditorBottomBar
        item={mockItem}
        isDirty={true}
        isSaving={false}
        onDiscard={onDiscard}
        onSave={onSave}
        onApprove={onApprove}
      />,
    )

    expect(screen.getByText('Alterações não salvas')).toBeInTheDocument()
    expect(saveBtn).not.toBeDisabled()
    expect(discardBtn).not.toBeDisabled()

    fireEvent.click(discardBtn)
    expect(onDiscard).toHaveBeenCalledTimes(1)

    fireEvent.click(saveBtn)
    expect(onSave).toHaveBeenCalledTimes(1)
  })
})
