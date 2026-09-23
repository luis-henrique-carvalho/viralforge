import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { createTestQueryClient } from '@/test-utils/render'
import { QueryClientProvider } from '@tanstack/react-query'
import { useSettings } from './use-settings'
import { useUpdateSettings } from './use-update-settings'
import { settingsApi } from '../services/settings.api'
import type { ReactNode } from 'react'

function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useSettings Hook', () => {
  it('fetches system configuration, hardware, and status', async () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.config).toBeDefined()
    expect(result.current.hardware).toBeDefined()
    expect(result.current.cookies).toBeDefined()
    expect(result.current.zernio).toBeDefined()
    expect(result.current.localModels).toBeDefined()
    expect(result.current.fonts).toBeInstanceOf(Array)
    expect(typeof result.current.logoConfigured).toBe('boolean')

    await act(async () => {
      await result.current.refetchAll()
    })
  })
})

describe('useUpdateSettings Hook & Mutations', () => {
  it('executes all mutation operations successfully', async () => {
    const { result } = renderHook(() => useUpdateSettings(), {
      wrapper: createWrapper(),
    })

    const testFile = new File(['dummy content'], 'test.txt', {
      type: 'text/plain',
    })
    const fontFile = new File(['dummy font'], 'TestFont.ttf', {
      type: 'font/ttf',
    })
    const logoFile = new File(['dummy logo'], 'logo.png', {
      type: 'image/png',
    })

    vi.spyOn(settingsApi, 'uploadPlatformCookies').mockResolvedValue({
      status: 'ok',
      message: 'Saved',
    })
    vi.spyOn(settingsApi, 'uploadFont').mockResolvedValue({
      status: 'ok',
      name: 'TestFont',
      fonts: ['TestFont'],
    })
    vi.spyOn(settingsApi, 'uploadLogo').mockResolvedValue({
      status: 'ok',
      message: 'Saved',
    })

    await act(async () => {
      // 1. Config mutations
      await result.current.updateConfig({ PUBLISHING_PROVIDER: 'zernio' })
      await result.current.updateZernio({ timezone: 'America/Sao_Paulo' })
      const accounts = await result.current.discoverAccounts()
      expect(accounts.accounts.length).toBeGreaterThan(0)

      // 2. Cookie mutations
      await result.current.uploadCookies({
        platform: 'youtube',
        file: testFile,
      })
      await result.current.deleteCookies('youtube')

      // 3. Font mutations
      await result.current.uploadFont(fontFile)
      await result.current.deleteFont('CustomFont')

      // 4. Logo mutations
      await result.current.uploadLogo(logoFile)
      await result.current.deleteLogo()
    })
  })
})

describe('settingsApi direct unit execution', () => {
  it('exercises direct API methods with full coverage', async () => {
    const config = await settingsApi.fetchConfig()
    expect(config).toBeDefined()

    const updateRes = await settingsApi.updateConfig({
      GEMINI_MODEL: 'gemini-2.5-flash',
    })
    expect(updateRes.success).toBe(true)

    const hw = await settingsApi.fetchHardware()
    expect(hw.backend).toBeDefined()

    const zernio = await settingsApi.fetchZernioConfig()
    expect(zernio.timezone).toBeDefined()

    const zernioUpdate = await settingsApi.updateZernioConfig({
      timezone: 'Europe/Rome',
    })
    expect(zernioUpdate).toBeDefined()

    const geminiModelsWithKey = await settingsApi.fetchGeminiModels('test_key')
    expect(geminiModelsWithKey).toBeInstanceOf(Array)

    const geminiModelsWithoutKey = await settingsApi.fetchGeminiModels()
    expect(geminiModelsWithoutKey).toBeInstanceOf(Array)

    const localModels = await settingsApi.fetchLocalModels()
    expect(localModels.models).toBeInstanceOf(Array)

    const cookies = await settingsApi.fetchCookiesStatus()
    expect(cookies.configured).toBeDefined()

    const cookieDel = await settingsApi.deletePlatformCookies('tiktok')
    expect(cookieDel.status).toBe('ok')

    const fontDel = await settingsApi.deleteFont('Font')
    expect(fontDel.status).toBe('ok')

    const logoStatus = await settingsApi.fetchLogoStatus()
    expect(logoStatus.configured).toBeDefined()

    const logoDel = await settingsApi.deleteLogo()
    expect(logoDel.status).toBe('ok')
  })
})
