import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { ScrollArea } from './scroll-area'

describe('ScrollArea', () => {
  it('renders children within the viewport with max-height inheritance', () => {
    const { container } = render(
      <ScrollArea className="max-h-56">
        <div>Item 1</div>
        <div>Item 2</div>
      </ScrollArea>,
    )

    const root = container.querySelector('[data-slot="scroll-area"]')
    const viewport = container.querySelector('[data-slot="scroll-area-viewport"]')

    expect(root).toBeInTheDocument()
    expect(root).toHaveClass('max-h-56')
    expect(viewport).toBeInTheDocument()
    expect(viewport).toHaveClass('max-h-[inherit]')
  })
})
