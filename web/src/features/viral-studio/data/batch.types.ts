import type { z } from 'zod'
import type {
  viralItemStatusSchema,
  aiCopyDataSchema,
  viralItemInputSchema,
  batchCreateSchema,
  viralItemSchema,
  batchResponseSchema,
  batchListResponseSchema,
  viralItemUpdateSchema,
  storageStatsSchema,
  bulkDeleteResponseSchema,
} from './batch.schema'
import type {
  templateSchema,
  templateCreateSchema,
  templateUpdateSchema,
  templateListResponseSchema,
} from './brand.schema'

// Re-export sovereign brand types for backward compatibility
export type {
  Brand,
  BrandCreate,
  BrandUpdate,
  BrandListResponse,
  PostingSchedule,
  SocialChannelBinding,
  SocialChannel,
  WorkspaceSummary,
  ScheduledPost,
  BrandWorkspaceSummary,
  ScheduleSlotsUpdate,
  BrandFormData,
} from '@/features/brands'

export type ViralItemStatus = z.infer<typeof viralItemStatusSchema>
export type AICopyData = z.infer<typeof aiCopyDataSchema>
export type ViralItemInput = z.input<typeof viralItemInputSchema>
export type BatchCreateRequest = z.input<typeof batchCreateSchema>
export type ViralItem = z.infer<typeof viralItemSchema>
export type BatchResponse = z.infer<typeof batchResponseSchema>
export type BatchListResponse = z.infer<typeof batchListResponseSchema>
export type ViralItemUpdate = z.infer<typeof viralItemUpdateSchema>
export type StorageStats = z.infer<typeof storageStatsSchema>
export type BulkDeleteResponse = z.infer<typeof bulkDeleteResponseSchema>

export type VisualTemplate = z.infer<typeof templateSchema>
export type TemplateCreate = z.input<typeof templateCreateSchema>
export type TemplateUpdate = z.infer<typeof templateUpdateSchema>
export type TemplateListResponse = z.infer<typeof templateListResponseSchema>

export interface BatchKpis {
  totalBatches: number
  activeBatches: number
  totalVideos: number
  readyVideos: number
  processingVideos: number
  failedVideos: number
  successRate: number
}
