import { useQuery } from '@tanstack/react-query'
import { localAiApi } from '../services/local-ai.api'
import { AI_MODELS, type AIModelOption } from '../data/models.constants'
import type { LocalAIResponse } from '../data/local-ai.types'

export interface ModelSelectOption {
  value: string
  label: string
  group: string
  badge?: string
}

function buildModelOptions(localData?: LocalAIResponse): ModelSelectOption[] {
  const modelOptions: ModelSelectOption[] = []

  // 1. LM Studio Local Models (if online)
  if (localData?.lm_studio?.online && localData.lm_studio.models.length > 0) {
    for (const m of localData.lm_studio.models) {
      modelOptions.push({
        value: `lmstudio:${m.id}`,
        label: `${m.name} (LM Studio Local ⚡)`,
        group: `LM Studio Conectado (${localData.lm_studio.models.length})`,
        badge: 'Local LM Studio',
      })
    }
  }

  // 2. Ollama Local Models (if online)
  if (localData?.ollama?.online && localData.ollama.models.length > 0) {
    for (const m of localData.ollama.models) {
      const modelId = m.id || m.name
      modelOptions.push({
        value: `ollama:${modelId}`,
        label: `${m.name} (Ollama Local ⚡)`,
        group: `Ollama Conectado (${localData.ollama.models.length})`,
        badge: 'Local Ollama',
      })
    }
  }

  // 3. Static/Cloud AI Models (Gemini + predefined)
  for (const staticModel of AI_MODELS) {
    const isDuplicate = modelOptions.some(
      (opt) => opt.value === staticModel.id || opt.value === `ollama:${staticModel.id}`,
    )
    if (!isDuplicate) {
      const groupName =
        staticModel.provider === 'gemini'
          ? 'Google Gemini (Nuvem)'
          : staticModel.provider === 'ollama'
            ? 'Ollama (Catálogo Padrão)'
            : 'Outros Modelos'

      modelOptions.push({
        value: staticModel.id,
        label: staticModel.name,
        group: groupName,
        badge: staticModel.badge,
      })
    }
  }

  return modelOptions
}

export function useLocalAIModels() {
  const query = useQuery<LocalAIResponse>({
    queryKey: ['config', 'local-models'],
    queryFn: () => localAiApi.fetchLocalAIModels(),
    staleTime: 30_000,
    retry: 1,
  })

  const modelOptions = buildModelOptions(query.data)

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
    error: query.error,
    refetch: query.refetch,
    localData: query.data,
    modelOptions,
    defaultModel: AI_MODELS.find((m: AIModelOption) => m.isDefault)?.id || 'gemini-2.5-flash',
  }
}
