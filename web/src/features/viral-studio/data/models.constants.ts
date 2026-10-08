export interface AIModelOption {
  id: string
  name: string
  provider: 'gemini' | 'ollama' | 'openai'
  description: string
  badge?: string
  isDefault?: boolean
}

export const AI_MODELS: AIModelOption[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    description:
      'Ultra-rápido, multimodal nativo, ideal para análise visual de frames e transcrição.',
    badge: 'Recomendado',
    isDefault: true,
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'gemini',
    description: 'Econômico e ágil para lotes massivos de URLs.',
    badge: 'Mais Rápido',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'gemini',
    description: 'Raciocínio aprofundado para copywriting persuasivo complexo e múltiplos ângulos.',
    badge: 'Alta Precisão',
  },
]
