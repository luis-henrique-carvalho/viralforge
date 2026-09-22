import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { viralStudioHandlers } from '@/features/viral-studio/mocks/handlers'

export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
  ...viralStudioHandlers,
]

export const server = setupServer(...handlers)
