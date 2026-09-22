import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
  it('combines multiple class names into a single string', () => {
    expect(cn('px-2', 'py-1', 'bg-primary')).toBe('px-2 py-1 bg-primary')
  })

  it('handles conditional falsy class names', () => {
    const isHidden = false
    const isVisible = true
    expect(cn('base-class', isHidden && 'hidden', isVisible && 'visible')).toBe(
      'base-class visible',
    )
  })

  it('merges tailwind conflicts correctly using tailwind-merge', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
  })
})
