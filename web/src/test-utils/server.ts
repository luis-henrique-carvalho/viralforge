import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { viralStudioHandlers } from '@/features/viral-studio/mocks/handlers'
import { settingsHandlers } from '@/features/settings/mocks/handlers'

export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
  ...viralStudioHandlers,
  ...settingsHandlers,
]

export const server = setupServer(...handlers)
