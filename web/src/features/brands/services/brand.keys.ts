export const brandKeys = {
  all: ['brands'] as const,
  lists: () => [...brandKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...brandKeys.lists(), { filters }] as const,
  details: () => [...brandKeys.all, 'detail'] as const,
  detail: (id: string) => [...brandKeys.details(), id] as const,
  workspaces: () => [...brandKeys.all, 'workspace'] as const,
  workspace: (brandId: string) => [...brandKeys.workspaces(), brandId] as const,
  channels: (brandId: string) => [...brandKeys.all, 'channels', brandId] as const,
  availableChannels: (brandId: string) =>
    [...brandKeys.all, 'channels', 'available', brandId] as const,
  videos: (brandId: string, status?: string) =>
    [...brandKeys.all, 'videos', brandId, { status }] as const,
  scheduled: (brandId: string, startDate?: string, endDate?: string) =>
    [...brandKeys.all, 'scheduled', brandId, { startDate, endDate }] as const,
  publishingWorkspaces: (provider?: string) => ['publishing', 'workspaces', { provider }] as const,
}
