import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { DiscoverySkeletonGrid } from './discovery-skeleton-grid'

describe('DiscoverySkeletonGrid', () => {
  it('renders skeleton cards grid', () => {
    const { container } = render(<DiscoverySkeletonGrid />)
    expect(container.querySelectorAll('.aspect-\\[9\\/16\\]').length).toBe(10)
  })
})
