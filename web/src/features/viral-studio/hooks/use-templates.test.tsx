import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  useCreateTemplate,
  useDeleteTemplate,
  useDuplicateTemplate,
  useReplaceTemplate,
  useResetDefaultTemplates,
  useTemplate,
  useTemplates,
  useTestTemplateGeneration,
  useUpdateTemplate,
  useUploadExtraImage,
} from './use-templates'
import { templateApi } from '../services/template.api'
import { createTestQueryClient } from '@/test-utils/render'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useTemplates hooks', () => {
  it('fetches templates list and single template detail', async () => {
    const qc = createTestQueryClient()
    const { result: listResult } = renderHook(() => useTemplates(), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => {
      expect(listResult.current.isSuccess).toBe(true)
      expect(listResult.current.data?.templates.length).toBeGreaterThan(0)
    })

    const { result: detailResult } = renderHook(() => useTemplate('curiosities-viral'), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => {
      expect(detailResult.current.isSuccess).toBe(true)
      expect(detailResult.current.data?.id).toBe('curiosities-viral')
    })
  })

  it('handles create, update, replace and duplicate mutations', async () => {
    const qc = createTestQueryClient()

    const { result: createResult } = renderHook(() => useCreateTemplate(), {
      wrapper: createWrapper(qc),
    })
    const created = await createResult.current.mutateAsync({
      name: 'Template Hook Test',
      background_color: '#111111',
    })
    expect(created.name).toBe('Template Hook Test')

    const { result: updateResult } = renderHook(() => useUpdateTemplate(), {
      wrapper: createWrapper(qc),
    })
    const updated = await updateResult.current.mutateAsync({
      id: created.id,
      data: { name: 'Template Hook Updated' },
    })
    expect(updated.name).toBe('Template Hook Updated')

    const { result: replaceResult } = renderHook(() => useReplaceTemplate(), {
      wrapper: createWrapper(qc),
    })
    const replaced = await replaceResult.current.mutateAsync({
      id: created.id,
      data: { ...created, name: 'Template Hook Replaced' },
    })
    expect(replaced.name).toBe('Template Hook Replaced')

    const { result: dupResult } = renderHook(() => useDuplicateTemplate(), {
      wrapper: createWrapper(qc),
    })
    const dup = await dupResult.current.mutateAsync('curiosities-viral')
    expect(dup.id).toContain('copy')

    const { result: resetResult } = renderHook(() => useResetDefaultTemplates(), {
      wrapper: createWrapper(qc),
    })
    const reset = await resetResult.current.mutateAsync()
    expect(reset.templates.length).toBeGreaterThan(0)

    const { result: testGenResult } = renderHook(() => useTestTemplateGeneration(), {
      wrapper: createWrapper(qc),
    })
    const testGen = await testGenResult.current.mutateAsync({
      template_id: 'curiosities-viral',
    })
    expect(testGen.copy).toBeDefined()

    // Test upload extra image via spy
    const uploadSpy = vi.spyOn(templateApi, 'uploadExtraImage').mockResolvedValueOnce({
      ...created,
      extra_image_enabled: true,
      extra_image_path: '/path.png',
    })
    const { result: uploadResult } = renderHook(() => useUploadExtraImage(), {
      wrapper: createWrapper(qc),
    })
    const fakeFile = new File([''], 'test.png')
    const uploaded = await uploadResult.current.mutateAsync({
      id: created.id,
      file: fakeFile,
    })
    expect(uploaded.extra_image_enabled).toBe(true)
    expect(uploadSpy).toHaveBeenCalled()

    const { result: deleteResult } = renderHook(() => useDeleteTemplate(), {
      wrapper: createWrapper(qc),
    })
    await expect(deleteResult.current.mutateAsync(created.id)).resolves.not.toThrow()
  })
})
