import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { viralStudioHandlers } from '@/features/viral-studio/mocks/handlers'
import { settingsHandlers } from '@/features/settings/mocks/handlers'
import { discoveryHandlers } from '@/features/discovery/mocks/handlers'

export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
  ...viralStudioHandlers,
  ...settingsHandlers,
  ...discoveryHandlers,
]

export const server = setupServer(...handlers)
