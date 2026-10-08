import { z } from 'zod'

export const viralItemStatusSchema = z.enum([
  'PENDING',
  'DOWNLOADING',
  'ANALYZING',
  'RENDERING',
  'READY_FOR_REVIEW',
  'APPROVED',
  'SCHEDULED',
  'PUBLISHED',
  'FAILED',
  'CANCELLED',
])

export const aiCopyDataSchema = z.object({
  product: z.string().min(1).max(200),
  product_description: z.string().max(1000).optional().default(''),
  headlines: z.array(z.string()).min(1).max(10),
  selected_headline: z.string().min(1).max(300),
  caption: z.string().max(2200),
  hashtags: z.array(z.string()).default([]),
  social_title: z.string().max(120).optional().nullable(),
  custom_outputs: z.record(z.string(), z.unknown()).optional(),
})

export const importProvenanceSchema = z.object({
  search_id: z.string(),
  platform: z.string(),
  query: z.string(),
  discovered_item_id: z.string().optional().nullable(),
  virality_score: z.number().optional().nullable(),
})

export const viralItemInputSchema = z.object({
  source_url: z.string().min(1, 'URL de origem é obrigatória').max(2048),
  product_code: z.string().max(64).optional().nullable(),
  product_url: z.string().max(2048).optional().nullable(),
  manual_headline: z.string().max(300).optional().nullable(),
  additional_instructions: z.string().max(1000).optional().nullable(),
  model: z.string().max(128).optional().nullable(),
  provenance: importProvenanceSchema.optional().nullable(),
})

export const batchCreateSchema = z.object({
  brand_id: z.string().max(64).optional().nullable(),
  brand_ids: z.array(z.string().min(1)).max(64).optional().nullable(),
  distribution_strategy: z.enum(['round_robin', 'sequential']).default('round_robin'),
  template_id: z.string().max(64).optional().nullable(),
  model: z.string().max(128).optional().nullable(),
  items: z.array(viralItemInputSchema).min(1, 'Adicione pelo menos um item').max(100),
})

export const viralItemSchema = z.object({
  id: z.string(),
  batch_id: z.string().optional().nullable(),
  brand_id: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  source_url: z.string(),
  product_code: z.string().optional().nullable(),
  product_url: z.string().optional().nullable(),
  manual_headline: z.string().optional().nullable(),
  additional_instructions: z.string().optional().nullable(),
  selected_headline: z.string().optional().nullable(),
  caption: z.string().optional().nullable(),
  badge_text: z.string().max(60).optional().nullable(),
  footer_text: z.string().max(240).optional().nullable(),
  social_title: z.string().max(120).optional().nullable(),
  ai_copy: aiCopyDataSchema.optional().nullable(),
  provenance: importProvenanceSchema.optional().nullable(),
  status: viralItemStatusSchema.default('PENDING'),
  media_purged: z.boolean().optional().nullable(),
  source_path: z.string().optional().nullable(),
  rendered_path: z.string().optional().nullable(),
  error_message: z.string().optional().nullable(),
  job_id: z.string().optional().nullable(),
  source_metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  ai_context_summary: z.record(z.string(), z.unknown()).optional().nullable(),
  ai_telemetry: z.record(z.string(), z.unknown()).optional().nullable(),
  keyframe_urls: z.array(z.string()).default([]),
  logs: z.array(z.record(z.string(), z.unknown())).default([]),
  publication_records: z.array(z.record(z.string(), z.unknown())).default([]),
  scheduled_for: z.string().optional().nullable(),
  account_id: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  post_id: z.string().optional().nullable(),
  post_url: z.string().optional().nullable(),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
})

export const batchResponseSchema = z.object({
  id: z.string(),
  batch_id: z.string(),
  brand_id: z.string(),
  brand_ids: z.array(z.string()).optional().nullable(),
  distribution_strategy: z.string().optional().nullable(),
  template_id: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  status: z.string().default('PENDING'),
  total_items: z.number().default(0),
  items: z.array(viralItemSchema).default([]),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
})

export const batchListResponseSchema = z.object({
  batches: z.array(batchResponseSchema).default([]),
  total: z.number().default(0),
})

export const viralItemUpdateSchema = z.object({
  selected_headline: z.string().max(300).optional().nullable(),
  caption: z.string().max(2200).optional().nullable(),
  product_code: z.string().max(64).optional().nullable(),
  product_url: z.string().max(2048).optional().nullable(),
  manual_headline: z.string().max(300).optional().nullable(),
  additional_instructions: z.string().max(1000).optional().nullable(),
  model: z.string().max(128).optional().nullable(),
  badge_text: z.string().max(60).optional().nullable(),
  footer_text: z.string().max(240).optional().nullable(),
  social_title: z.string().max(120).optional().nullable(),
})

export const storageStatsSchema = z.object({
  disk_total_bytes: z.number().default(0),
  disk_used_bytes: z.number().default(0),
  disk_free_bytes: z.number().default(0),
  viral_studio_used_bytes: z.number().default(0),
  purged_items_count: z.number().default(0),
  total_items_count: z.number().default(0),
  failed_or_cancelled_count: z.number().default(0),
})

export const bulkDeleteResponseSchema = z.object({
  success: z.boolean().default(true),
  affected_items: z.number().default(0),
  purge_only: z.boolean().default(false),
  freed_bytes: z.number().default(0),
})
