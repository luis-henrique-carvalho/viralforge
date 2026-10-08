import { z } from 'zod'

export const postingScheduleSchema = z.object({
  frequency: z.number().default(3),
  slots: z.array(z.string()).default(['10:00', '15:00', '20:00']),
  timezone: z.string().default('America/Sao_Paulo'),
})

export const brandSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(100),
  handle: z.string().min(1).max(60),
  niche: z.string().max(150).optional().nullable(),
  discovery_keywords: z.array(z.string()).optional(),
  avatar_path: z.string().max(512).optional().nullable(),
  avatar_url: z.string().max(1024).optional().nullable(),
  logo_path: z.string().max(512).optional().nullable(),
  default_cta: z.string().max(500).default('Confira os achadinhos no link da bio!'),
  default_affiliate_url: z.string().max(2048).optional().nullable(),
  template_id: z.string().max(64).default('classic-affiliate'),
  posting_schedule: postingScheduleSchema.optional().nullable(),
  publishing_profiles: z.record(z.string(), z.unknown()).default({}),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
})

export const socialChannelBindingSchema = z.object({
  account_id: z.string(),
  name: z.string().optional().nullable(),
  platform: z.string(),
  avatar_url: z.string().optional().nullable(),
  handle: z.string().optional().nullable(),
})

export const socialChannelSchema = z.object({
  id: z.string(),
  platform: z.string(),
  name: z.string(),
  connected: z.boolean().default(true),
  handle: z.string().optional().nullable(),
  avatar_url: z.string().optional().nullable(),
  group_id: z.string().optional().nullable(),
  group_name: z.string().optional().nullable(),
  bound_to_brand_id: z.string().optional().nullable(),
  bound_to_brand_name: z.string().optional().nullable(),
  provider: z.string().default('postiz'),
  metadata: z.record(z.string(), z.unknown()).default({}),
})

export const workspaceSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
})

export const scheduledPostSchema = z.object({
  id: z.string().optional(),
  post_id: z.string().optional(),
  brand_id: z.string().optional().nullable(),
  item_id: z.string().optional().nullable(),
  job_id: z.string().optional().nullable(),
  title: z.string().default(''),
  content: z.string().optional().nullable(),
  scheduled_time: z.string().optional().nullable(),
  scheduled_for: z.string().optional().nullable(),
  published_at: z.string().optional().nullable(),
  status: z.string().default('scheduled'), // 'QUEUED', 'UPLOADING', 'scheduled', 'published', 'failed'
  channels: z.array(z.string()).default([]),
  platform: z.string().optional().nullable(),
  channel_id: z.string().optional().nullable(),
  channel_name: z.string().optional().nullable(),
  channel_handle: z.string().optional().nullable(),
  channel_avatar_url: z.string().optional().nullable(),
  provider: z.string().optional().default('postiz'),
  provider_url: z.string().optional().nullable(),
  provider_post_url: z.string().optional().nullable(),
  thumbnail_url: z.string().optional().nullable(),
  video_url: z.string().optional().nullable(),
  external_url: z.string().optional().nullable(),
  post_url: z.string().optional().nullable(),
  metrics: z.record(z.string(), z.unknown()).default({}),
  raw_response: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const brandWorkspaceSummaryResponseSchema = z.object({
  brand: brandSchema,
  provider: z.string().optional(),
  active_provider: z.string().optional(),
  channels: z.array(socialChannelSchema).default([]),
  connected_channels: z.array(socialChannelSchema).default([]),
  counts: z
    .object({
      total_videos: z.number().default(0),
      approved_videos: z.number().default(0),
      scheduled_posts: z.number().default(0),
      published_posts: z.number().default(0),
    })
    .optional(),
  video_stats: z
    .object({
      total: z.number().default(0),
      ready: z.number().default(0),
      approved: z.number().default(0),
      scheduled: z.number().default(0),
      published: z.number().default(0),
    })
    .optional(),
  template: z.record(z.string(), z.unknown()).optional().nullable(),
  next_slot: z.string().optional().nullable(),
  scheduled_count: z.number().default(0),
})

export const scheduleSlotsUpdateSchema = z.object({
  slots: z.array(z.string()),
  timezone: z.string(),
  frequency: z.number().optional(),
})

export const brandFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  handle: z.string().min(1, 'Handle é obrigatório').max(60),
  avatar_url: z.string().max(1024).optional().nullable(),
  default_cta: z.string().max(500),
  default_affiliate_url: z.string().max(2048).optional().nullable(),
  template_id: z.string().max(64),
  publishing_profiles: z.record(z.string(), z.unknown()),
})

export type BrandFormData = z.infer<typeof brandFormSchema>

export const brandCreateSchema = z.object({
  id: z.string().max(64).optional(),
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  handle: z.string().min(1, 'Handle é obrigatório').max(60),
  niche: z.string().max(150).optional().nullable(),
  discovery_keywords: z.array(z.string()).optional().default([]),
  avatar_path: z.string().max(512).optional().nullable(),
  avatar_url: z.string().max(1024).optional().nullable(),
  logo_path: z.string().max(512).optional().nullable(),
  default_cta: z.string().max(500).optional().default('Confira os achadinhos no link da bio!'),
  default_affiliate_url: z.string().max(2048).optional().nullable(),
  template_id: z.string().max(64).optional().default('classic-affiliate'),
  posting_schedule: postingScheduleSchema.optional().nullable(),
  publishing_profiles: z.record(z.string(), z.unknown()).optional().default({}),
})

export const brandUpdateSchema = brandCreateSchema.partial()

export const brandListResponseSchema = z.object({
  brands: z.array(brandSchema).default([]),
  total: z.number().default(0),
})

export const templateSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(100),
  width: z.number().min(360).max(3840).default(1080),
  height: z.number().min(640).max(3840).default(1920),
  background_color: z.string().max(9).default('#FFFFFF'),
  avatar_enabled: z.boolean().default(true),
  brand_name_enabled: z.boolean().default(true),
  headline_enabled: z.boolean().default(true),
  watermark_enabled: z.boolean().default(true),
  video_fit: z.enum(['contain', 'cover', 'crop']).default('contain'),
  avatar_x: z.number().default(60),
  avatar_y: z.number().default(80),
  avatar_size: z.number().default(100),
  brand_name_font_size: z.number().default(36),
  brand_name_color: z.string().default('#111111'),
  handle_font_size: z.number().default(26),
  handle_color: z.string().default('#666666'),
  headline_font_size: z.number().default(48),
  headline_color: z.string().default('#111111'),
  headline_max_lines: z.number().default(3),
  headline_margin_x: z.number().default(60),
  headline_margin_top: z.number().default(30),
  watermark_opacity: z.number().default(0.7),
  watermark_position: z
    .enum(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'])
    .default('bottom-right'),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
})

export const templateCreateSchema = templateSchema
  .omit({ created_at: true, updated_at: true })
  .partial({ id: true })

export const templateUpdateSchema = templateCreateSchema.partial()

export const templateListResponseSchema = z.object({
  templates: z.array(templateSchema).default([]),
  total: z.number().default(0),
})
