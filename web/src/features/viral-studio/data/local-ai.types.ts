export interface LocalAIModel {
  id: string
  name: string
}

export interface LocalAIServiceInfo {
  online: boolean
  base_url: string
  models: LocalAIModel[]
}

export interface LocalAICombinedModel {
  id: string
  name: string
  provider: 'lm_studio' | 'ollama' | string
  group: string
}

export interface LocalAIResponse {
  lm_studio: LocalAIServiceInfo
  ollama: LocalAIServiceInfo
  models: LocalAICombinedModel[]
}
