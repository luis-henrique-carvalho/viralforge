import { describe, expect, it } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { useLocalAIModels } from './use-local-ai-models'
import { createTestQueryClient } from '@/test-utils/render'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useLocalAIModels hook', () => {
  it('discovers local models and merges with cloud catalog', async () => {
    const qc = createTestQueryClient()
    const { result } = renderHook(() => useLocalAIModels(), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.localData?.lm_studio?.online).toBe(true)
    expect(result.current.localData?.ollama?.online).toBe(true)

    const values = result.current.modelOptions.map((o) => o.value)
    expect(values).toContain('lmstudio:qwen2.5-coder-7b-instruct')
    expect(values).toContain('gemini-2.5-flash')
    expect(values).toContain('gemini-2.5-pro')
    expect(result.current.defaultModel).toBe('gemini-2.5-flash')
  })
})
