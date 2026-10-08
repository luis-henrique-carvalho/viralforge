import type { z } from 'zod'
import type {
  generationTaskSchema,
  visualTemplateSchema,
  templateCreateSchema,
  templateUpdateSchema,
  templateListResponseSchema,
  testGenerationRequestSchema,
  testGenerationResponseSchema,
} from './template.schema'

export type GenerationTask = z.infer<typeof generationTaskSchema>
export type VisualTemplate = z.infer<typeof visualTemplateSchema>
export type VideoAspect = VisualTemplate['video_aspect']
export type TemplateCreate = z.input<typeof templateCreateSchema>
export type TemplateUpdate = z.infer<typeof templateUpdateSchema>
export type TemplateListResponse = z.infer<typeof templateListResponseSchema>
export type TestGenerationRequest = z.input<typeof testGenerationRequestSchema>
export type TestGenerationResponse = z.infer<typeof testGenerationResponseSchema>

export interface CanvasLayerState {
  isDraggingVideo: boolean
  isDraggingHeadline: boolean
  isDraggingBadge: boolean
  isDraggingExtraImage: boolean
  snapGuideX: boolean
  snapGuideY: boolean
}
