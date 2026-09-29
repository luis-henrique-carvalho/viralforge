import { brandKeys } from '@/features/brands'

export const viralStudioKeys = {
  all: ['viral-studio'] as const,
  batches: () => [...viralStudioKeys.all, 'batches'] as const,
  batch: (id: string) => [...viralStudioKeys.all, 'batch', id] as const,
  item: (id: string) => [...viralStudioKeys.all, 'item', id] as const,
  brands: () => brandKeys.all,
  brand: (id: string) => brandKeys.detail(id),
  brandWorkspace: (id: string) => brandKeys.workspace(id),
  brandChannels: (id: string) => brandKeys.channels(id),
  brandAvailableChannels: (id: string) => brandKeys.availableChannels(id),
  brandVideos: (id: string, status?: string) => brandKeys.videos(id, status),
  brandScheduled: (id: string, startDate?: string, endDate?: string) =>
    brandKeys.scheduled(id, startDate, endDate),
  templates: () => [...viralStudioKeys.all, 'templates'] as const,
  template: (id: string) => [...viralStudioKeys.all, 'template', id] as const,
  publishingAccounts: () => [...viralStudioKeys.all, 'publishing', 'accounts'] as const,
  publishingWorkspaces: (provider?: string) => brandKeys.publishingWorkspaces(provider),
  previewSlots: (
    accountId: string,
    count: number,
    startDate?: string,
    preferredTime?: string,
    brandId?: string,
  ) =>
    [
      ...viralStudioKeys.all,
      'publishing',
      'preview-slots',
      accountId,
      count,
      startDate,
      preferredTime,
      brandId,
    ] as const,
}
