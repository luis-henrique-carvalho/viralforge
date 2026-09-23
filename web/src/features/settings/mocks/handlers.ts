import { http, HttpResponse } from 'msw'
import type {
  CookiesStatus,
  FontsResponse,
  HardwareTelemetry,
  LocalModelsResponse,
  LogoStatusResponse,
  SystemConfig,
  ZernioConfigStatus,
} from '../data/settings.types'

export const mockSystemConfig: SystemConfig = {
  GEMINI_API_KEY: 'AIza...4xyz',
  GEMINI_MODEL: 'gemini-2.5-flash',
  DEFAULT_AI_MODEL: 'gemini-2.5-flash',
  LM_STUDIO_BASE_URL: 'http://localhost:1234',
  OLLAMA_BASE_URL: 'http://localhost:11434',
  TRANSCRIPTION_PROVIDER: 'deepgram',
  PUBLISHING_PROVIDER: 'zernio',
  DEEPGRAM_API_KEY: 'dg_...1234',
  ELEVENLABS_API_KEY: '',
  HF_TOKEN: '',
}

export const mockHardwareTelemetry: HardwareTelemetry = {
  device: 'cuda',
  backend: 'CUDA',
  cuda_available: true,
  device_name: 'NVIDIA GeForce RTX 4090',
  vram_gb: 24.0,
  total_ram_gb: 64.0,
  whisper_device: 'cuda',
  whisper_model: 'large-v3',
}

export const mockCookiesStatus: CookiesStatus = {
  youtube: true,
  instagram: false,
  tiktok: true,
  legacy: false,
  configured: true,
}

export const mockZernioConfigStatus: ZernioConfigStatus = {
  configured: true,
  api_key_masked: 'zk_live...9999',
  accounts: {
    tiktok: 'acc_tiktok_123',
    instagram: 'acc_insta_456',
    youtube: 'acc_yt_789',
  },
  timezone: 'America/Sao_Paulo',
}

export const mockLocalModelsResponse: LocalModelsResponse = {
  lm_studio: {
    online: true,
    base_url: 'http://localhost:1234',
    models: [{ id: 'qwen2.5-7b-instruct', name: 'Qwen 2.5 7B Instruct' }],
  },
  ollama: {
    online: true,
    base_url: 'http://localhost:11434',
    models: [{ id: 'llama3.2:latest', name: 'Llama 3.2 Latest' }],
  },
  models: [
    {
      id: 'lmstudio:qwen2.5-7b-instruct',
      name: 'Qwen 2.5 7B Instruct',
      provider: 'lm_studio',
      group: 'LM Studio',
    },
    {
      id: 'ollama:llama3.2:latest',
      name: 'Llama 3.2 Latest',
      provider: 'ollama',
      group: 'Ollama',
    },
  ],
}

export const mockFontsResponse: FontsResponse = {
  fonts: ['Inter', 'Montserrat', 'Roboto', 'Bebas Neue', 'The Bold Font'],
}

export const mockLogoStatusResponse: LogoStatusResponse = {
  configured: true,
}

export const settingsHandlers = [
  http.get('/api/config', () => {
    return HttpResponse.json(mockSystemConfig)
  }),

  http.post('/api/config', async ({ request }) => {
    await request.json()
    return HttpResponse.json({ success: true, message: 'Configuration updated and persisted.' })
  }),

  http.get('/api/config/hardware', () => {
    return HttpResponse.json(mockHardwareTelemetry)
  }),

  http.get('/api/config/zernio', () => {
    return HttpResponse.json(mockZernioConfigStatus)
  }),

  http.post('/api/config/zernio', async ({ request }) => {
    const body = (await request.json()) as Partial<ZernioConfigStatus>
    return HttpResponse.json({
      ...mockZernioConfigStatus,
      ...body,
    })
  }),

  http.get('/api/zernio/accounts', () => {
    return HttpResponse.json({
      accounts: [
        { id: 'acc_tiktok_123', platform: 'tiktok', name: '@viral_shorts' },
        { id: 'acc_insta_456', platform: 'instagram', name: 'viral.reels' },
        { id: 'acc_yt_789', platform: 'youtube', name: 'Viral Studio Official' },
      ],
    })
  }),

  http.get('/api/config/cookies/status', () => {
    return HttpResponse.json(mockCookiesStatus)
  }),

  http.post('/api/config/cookies/:platform', ({ params }) => {
    return HttpResponse.json({ status: 'ok', message: `${params.platform} cookies saved` })
  }),

  http.delete('/api/config/cookies/:platform', ({ params }) => {
    return HttpResponse.json({ status: 'ok', message: `${params.platform} cookies removed` })
  }),

  http.get('/api/config/local-models', () => {
    return HttpResponse.json(mockLocalModelsResponse)
  }),

  http.get('/api/config/models', () => {
    return HttpResponse.json(['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro'])
  }),

  http.get('/api/config/fonts', () => {
    return HttpResponse.json(mockFontsResponse)
  }),

  http.post('/api/config/fonts', () => {
    return HttpResponse.json({
      status: 'ok',
      name: 'CustomFont',
      fonts: [...mockFontsResponse.fonts, 'CustomFont'],
    })
  }),

  http.delete('/api/config/fonts/:name', () => {
    return HttpResponse.json({ status: 'ok', fonts: mockFontsResponse.fonts })
  }),

  http.get('/api/config/logo/status', () => {
    return HttpResponse.json(mockLogoStatusResponse)
  }),

  http.post('/api/config/logo', () => {
    return HttpResponse.json({ status: 'ok', message: 'Logo saved' })
  }),

  http.delete('/api/config/logo', () => {
    return HttpResponse.json({ status: 'ok', message: 'Logo removed' })
  }),
]
