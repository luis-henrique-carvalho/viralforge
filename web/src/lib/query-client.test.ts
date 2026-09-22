import { describe, expect, it } from 'vitest'
import { queryClient } from './query-client'

describe('queryClient', () => {
  it('instantiates query client with default options', () => {
    expect(queryClient).toBeDefined()
    expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(10000)
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(1)
  })
})
