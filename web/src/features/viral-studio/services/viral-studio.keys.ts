export const viralStudioKeys = {
  all: ['viral-studio'] as const,
  batches: () => [...viralStudioKeys.all, 'batches'] as const,
  batch: (id: string) => [...viralStudioKeys.all, 'batch', id] as const,
  item: (id: string) => [...viralStudioKeys.all, 'item', id] as const,
  brands: () => [...viralStudioKeys.all, 'brands'] as const,
  brand: (id: string) => [...viralStudioKeys.all, 'brand', id] as const,
  brandWorkspace: (id: string) => [...viralStudioKeys.brand(id), 'workspace'] as const,
  brandChannels: (id: string) => [...viralStudioKeys.brand(id), 'channels'] as const,
  brandAvailableChannels: (id: string) =>
    [...viralStudioKeys.brand(id), 'available-channels'] as const,
  brandVideos: (id: string, status?: string) =>
    [...viralStudioKeys.brand(id), 'videos', status || 'all'] as const,
  brandScheduled: (id: string, startDate?: string, endDate?: string) =>
    [...viralStudioKeys.brand(id), 'scheduled', startDate || 'all', endDate || 'all'] as const,
  templates: () => [...viralStudioKeys.all, 'templates'] as const,
  template: (id: string) => [...viralStudioKeys.all, 'template', id] as const,
  publishingAccounts: () => [...viralStudioKeys.all, 'publishing', 'accounts'] as const,
  publishingWorkspaces: (provider?: string) =>
    [...viralStudioKeys.all, 'publishing', 'workspaces', provider || 'default'] as const,
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
