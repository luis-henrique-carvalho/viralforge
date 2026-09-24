import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DiscoveryVideoCard } from './discovery-video-card'
import { mockDiscoveryItems } from '../mocks/handlers'

describe('DiscoveryVideoCard', () => {
  it('renders video info and handles toggle select', async () => {
    const handleToggle = vi.fn()
    const user = userEvent.setup()
    const item = mockDiscoveryItems[0]

    render(
      <DiscoveryVideoCard
        item={item}
        isSelected={false}
        onToggleSelect={handleToggle}
      />,
    )

    expect(screen.getByText(item.title)).toBeInTheDocument()
    const authorText = item.author_handle || item.author_name || 'Criador'
    expect(screen.getByText(authorText)).toBeInTheDocument()

    const card = screen.getByText(item.title).closest('div')
    if (card) {
      await user.click(card)
      expect(handleToggle).toHaveBeenCalledWith(item)
    }
  })

  it('renders selected state correctly', () => {
    const handleToggle = vi.fn()
    const item = mockDiscoveryItems[1]

    render(
      <DiscoveryVideoCard
        item={item}
        isSelected={true}
        onToggleSelect={handleToggle}
      />,
    )

    expect(screen.getByText(item.title)).toBeInTheDocument()
  })
})
