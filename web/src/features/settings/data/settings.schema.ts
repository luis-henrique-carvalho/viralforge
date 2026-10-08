import { z } from 'zod'

export const publishingProviderSchema = z.object({
  PUBLISHING_PROVIDER: z.enum(['postiz', 'zernio', 'mock']),
  postizBaseUrl: z.string().optional(),
  postizApiKey: z.string().optional(),
  zernioApiKey: z.string().optional(),
  tiktokAccountId: z.string().optional(),
  instagramAccountId: z.string().optional(),
  youtubeAccountId: z.string().optional(),
  timezone: z.string().optional(),
})

export type PublishingProviderFormData = z.infer<typeof publishingProviderSchema>

export const aiModelsSchema = z.object({
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  DEFAULT_AI_MODEL: z.string().optional(),
  LM_STUDIO_BASE_URL: z.string().optional(),
  OLLAMA_BASE_URL: z.string().optional(),
})

export type AiModelsFormData = z.infer<typeof aiModelsSchema>

export const transcriptionProviderSchema = z.object({
  TRANSCRIPTION_PROVIDER: z.enum(['deepgram', 'elevenlabs', 'whisper']),
  DEEPGRAM_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  HF_TOKEN: z.string().optional(),
})

export type TranscriptionProviderFormData = z.infer<typeof transcriptionProviderSchema>
