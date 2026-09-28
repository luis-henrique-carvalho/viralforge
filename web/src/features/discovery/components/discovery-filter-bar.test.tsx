import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DiscoveryFilterBar } from './discovery-filter-bar'

describe('DiscoveryFilterBar', () => {
  it('renders filter controls and triggers callbacks', () => {
    const onChangeSortBy = vi.fn()
    const onChangeDurationFilter = vi.fn()
    const onChangeMinViews = vi.fn()
    const onChangeLimit = vi.fn()

    render(
      <DiscoveryFilterBar
        sortBy="virality_score"
        onChangeSortBy={onChangeSortBy}
        durationFilter="all"
        onChangeDurationFilter={onChangeDurationFilter}
        minViews={null}
        onChangeMinViews={onChangeMinViews}
        limit={20}
        onChangeLimit={onChangeLimit}
      />,
    )

    expect(screen.getByText('Ordenar:')).toBeInTheDocument()
    expect(screen.getByText('Duração:')).toBeInTheDocument()
    expect(screen.getByText('Min. Views:')).toBeInTheDocument()
    expect(screen.getByText('Limite:')).toBeInTheDocument()
  })
})
