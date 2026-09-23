import { describe, expect, it } from 'vitest'
import { env } from './env'

describe('env config', () => {
  it('fornece valores padronizados para variáveis essenciais', () => {
    expect(env.VITE_API_BASE_URL).toBeDefined()
    expect(typeof env.VITE_API_BASE_URL).toBe('string')
    expect(env.VITE_APP_TITLE).toBe('ViralForge')
  })
})
