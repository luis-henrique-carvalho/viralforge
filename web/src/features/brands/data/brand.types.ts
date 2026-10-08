import type { z } from 'zod'
import type {
  brandSchema,
  brandCreateSchema,
  brandUpdateSchema,
  brandListResponseSchema,
  socialChannelBindingSchema,
  socialChannelSchema,
  workspaceSummarySchema,
  scheduledPostSchema,
  brandWorkspaceSummaryResponseSchema,
  scheduleSlotsUpdateSchema,
  postingScheduleSchema,
  brandFormSchema,
} from './brand.schema'

export type PostingSchedule = z.infer<typeof postingScheduleSchema>
export type SocialChannelBinding = z.infer<typeof socialChannelBindingSchema>
export type SocialChannel = z.infer<typeof socialChannelSchema>
export type WorkspaceSummary = z.infer<typeof workspaceSummarySchema>
export type ScheduledPost = z.infer<typeof scheduledPostSchema>
export type BrandWorkspaceSummary = z.infer<typeof brandWorkspaceSummaryResponseSchema>
export type ScheduleSlotsUpdate = z.infer<typeof scheduleSlotsUpdateSchema>

export interface PublishingProfile {
  active?: boolean
  customer_id?: string
  workspace_id?: string
  channel_ids?: string[]
  linked_at?: string
  [key: string]: unknown
}

export type PublishingProfileRecord = Record<string, PublishingProfile>

export type Brand = z.infer<typeof brandSchema>
export type BrandCreate = z.input<typeof brandCreateSchema>
export type BrandUpdate = z.infer<typeof brandUpdateSchema>
export type BrandListResponse = z.infer<typeof brandListResponseSchema>
export type BrandFormData = z.infer<typeof brandFormSchema>
