import { describe, expect, it, vi } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { toast } from 'sonner'
import { handleApiError } from './handle-api-error'

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

describe('handleApiError helper', () => {
  it('handles string detail from FastAPI error response', () => {
    const axiosError = new AxiosError('Request failed', '400', undefined, undefined, {
      data: { detail: 'Lote não encontrado' },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: new AxiosHeaders() },
    })

    const result = handleApiError(axiosError)
    expect(toast.error).toHaveBeenCalledWith('Lote não encontrado')
    expect(result).toBe('Lote não encontrado')
  })

  it('handles Pydantic validation error array from FastAPI', () => {
    const axiosError = new AxiosError('Validation Error', '422', undefined, undefined, {
      data: {
        detail: [{ msg: 'Campo obrigatório' }],
      },
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: {},
      config: { headers: new AxiosHeaders() },
    })

    const result = handleApiError(axiosError)
    expect(toast.error).toHaveBeenCalledWith('Erro de validação: Campo obrigatório')
    expect(result).toBe('Campo obrigatório')
  })

  it('handles generic JS Error instances', () => {
    const error = new Error('Falha de rede local')
    const result = handleApiError(error)
    expect(toast.error).toHaveBeenCalledWith('Falha de rede local')
    expect(result).toBe('Falha de rede local')
  })

  it('handles unknown non-error objects with fallback message', () => {
    const result = handleApiError('erro estranho', 'Mensagem de fallback customizada')
    expect(toast.error).toHaveBeenCalledWith('Mensagem de fallback customizada')
    expect(result).toBe('Mensagem de fallback customizada')
  })
})
