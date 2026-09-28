import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DiscoverySearchBar } from './discovery-search-bar'

describe('DiscoverySearchBar', () => {
  it('triggers onSearch with entered query and selected platform', async () => {
    const handleSearch = vi.fn()
    const user = userEvent.setup()

    render(<DiscoverySearchBar onSearch={handleSearch} />)

    const input = screen.getByPlaceholderText(/Busque por palavras-chave/i)
    await user.type(input, 'tecnologia')

    const igBtn = screen.getByRole('button', { name: /Instagram Reels/i })
    await user.click(igBtn)

    const submitBtn = screen.getByRole('button', { name: /Buscar Tendências/i })
    await user.click(submitBtn)

    expect(handleSearch).toHaveBeenCalledWith('tecnologia', 'instagram')
  })

  it('disables button when loading', () => {
    const handleSearch = vi.fn()
    render(
      <DiscoverySearchBar
        onSearch={handleSearch}
        isLoading={true}
        initialQuery=""
      />,
    )

    const submitBtn = screen.getByRole('button', { name: /Buscando/i })
    expect(submitBtn).toBeDisabled()
  })
})
