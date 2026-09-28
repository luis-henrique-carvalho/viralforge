import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DiscoveryStrategyPicker } from './discovery-strategy-picker'

describe('DiscoveryStrategyPicker', () => {
  it('renders strategy options and allows selection', async () => {
    const handleStrategyChange = vi.fn()
    const user = userEvent.setup()

    render(
      <DiscoveryStrategyPicker
        distributionStrategy="round_robin"
        onChangeStrategy={handleStrategyChange}
      />,
    )

    expect(screen.getByText('Round-Robin (Alternado)')).toBeInTheDocument()
    expect(screen.getByText('Sequencial em Blocos')).toBeInTheDocument()

    await user.click(screen.getByText('Sequencial em Blocos'))
    expect(handleStrategyChange).toHaveBeenCalledWith('sequential')
  })
})
