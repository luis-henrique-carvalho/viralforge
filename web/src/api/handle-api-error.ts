import axios from 'axios'
import { toast } from 'sonner'

export function handleApiError(error: unknown, fallbackMessage = 'Ocorreu um erro inesperado') {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    const message = error.response?.data?.message || error.message

    if (typeof detail === 'string') {
      toast.error(detail)
      return detail
    }

    if (Array.isArray(detail)) {
      // Erro de validação Pydantic / FastAPI
      const firstError = detail[0]?.msg || JSON.stringify(detail)
      toast.error(`Erro de validação: ${firstError}`)
      return firstError
    }

    toast.error(message || fallbackMessage)
    return message || fallbackMessage
  }

  if (error instanceof Error) {
    toast.error(error.message)
    return error.message
  }

  toast.error(fallbackMessage)
  return fallbackMessage
}
