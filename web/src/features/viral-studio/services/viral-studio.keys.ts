export const viralStudioKeys = {
  all: ['viral-studio'] as const,
  batches: () => [...viralStudioKeys.all, 'batches'] as const,
  batch: (id: string) => [...viralStudioKeys.all, 'batch', id] as const,
  item: (id: string) => [...viralStudioKeys.all, 'item', id] as const,
  brands: () => [...viralStudioKeys.all, 'brands'] as const,
  brand: (id: string) => [...viralStudioKeys.all, 'brand', id] as const,
  templates: () => [...viralStudioKeys.all, 'templates'] as const,
  template: (id: string) => [...viralStudioKeys.all, 'template', id] as const,
}
