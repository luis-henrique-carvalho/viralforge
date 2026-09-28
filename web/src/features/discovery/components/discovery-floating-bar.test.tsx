import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DiscoveryFloatingBar } from './discovery-floating-bar'

describe('DiscoveryFloatingBar', () => {
  it('returns null when selectedCount is 0', () => {
    const { container } = render(
      <DiscoveryFloatingBar
        selectedCount={0}
        onOpenDrawer={vi.fn()}
        onClearSelection={vi.fn()}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders and fires actions when selectedCount > 0', async () => {
    const handleOpen = vi.fn()
    const handleClear = vi.fn()
    const user = userEvent.setup()

    render(
      <DiscoveryFloatingBar
        selectedCount={3}
        onOpenDrawer={handleOpen}
        onClearSelection={handleClear}
      />,
    )

    expect(screen.getByText(/3 vídeos selecionados/i)).toBeInTheDocument()

    const openBtn = screen.getByRole('button', { name: /Criar Lote \(3\)/i })
    await user.click(openBtn)
    expect(handleOpen).toHaveBeenCalled()

    const clearBtn = screen.getByTitle('Limpar seleção')
    await user.click(clearBtn)
    expect(handleClear).toHaveBeenCalled()
  })
})
