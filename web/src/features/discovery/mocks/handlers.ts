import { http, HttpResponse } from 'msw'
import type {
  DiscoveryFilter,
  DiscoveryItem,
  DiscoveryPlatformsResponse,
  DiscoveryResult,
  DiscoverySearch,
  DiscoverySearchSummary,
} from '../data/discovery.types'

export const mockDiscoveryItems: DiscoveryItem[] = [
  {
    id: 'disc-tt-1',
    platform: 'tiktok',
    url: 'https://tiktok.com/@achadinhos/video/1001',
    title: 'Mini Selador Térmico Portátil para Embalagens 🔥',
    description: 'Compre no link da bio com cupom exclusivo',
    author_name: 'Achadinhos Shopee',
    author_handle: '@achadinhos',
    thumbnail_url: 'https://picsum.photos/400/700?random=1',
    duration_seconds: 24,
    view_count: 850000,
    like_count: 95000,
    comment_count: 1400,
    share_count: 4200,
    virality_score: 94.5,
    engagement_rate: 0.12,
    view_velocity: 15000,
    already_imported: false,
  },
  {
    id: 'disc-tt-2',
    platform: 'tiktok',
    url: 'https://tiktok.com/@achadinhos/video/1002',
    title: 'Suporte Magnético 360 Graus para Celular Veicular 🚗',
    description: 'O melhor suporte que você vai ver hoje!',
    author_name: 'Tech Dicas',
    author_handle: '@techdicas',
    thumbnail_url: 'https://picsum.photos/400/700?random=2',
    duration_seconds: 42,
    view_count: 420000,
    like_count: 48000,
    comment_count: 890,
    share_count: 1800,
    virality_score: 87.2,
    engagement_rate: 0.11,
    view_velocity: 8000,
    already_imported: true,
    imported_batch_id: 'batch-1',
  },
  {
    id: 'disc-yt-1',
    platform: 'youtube',
    url: 'https://youtube.com/shorts/yt1001',
    title: 'Garrafa Térmica Inteligente com Display LED de Temperatura',
    description: 'Mostra a temperatura exata ao toque na tampa!',
    author_name: 'Review Express',
    author_handle: '@reviewexpress',
    thumbnail_url: 'https://picsum.photos/400/700?random=3',
    duration_seconds: 35,
    view_count: 1200000,
    like_count: 130000,
    comment_count: 3200,
    share_count: 6500,
    virality_score: 96.8,
    engagement_rate: 0.14,
    view_velocity: 22000,
    already_imported: false,
  },
]

export const mockSearchesStore: Map<string, DiscoverySearch> = new Map([
  [
    'search-mock-1',
    {
      id: 'search-mock-1',
      platform: 'tiktok',
      query: 'achadinhos',
      filter_params: { query: 'achadinhos', platform: 'tiktok', limit: 20 },
      status: 'COMPLETED',
      total_found: mockDiscoveryItems.length,
      items: mockDiscoveryItems,
      created_at: '2026-09-24T12:00:00.000Z',
      started_at: '2026-09-24T12:00:00.100Z',
      completed_at: '2026-09-24T12:00:02.500Z',
      duration_seconds: 2.4,
    },
  ],
])

export const discoveryHandlers = [
  http.get('*/api/discovery/platforms', () => {
    return HttpResponse.json<DiscoveryPlatformsResponse>({
      platforms: [
        {
          id: 'instagram',
          name: 'Instagram Reels',
          icon: 'instagram',
          description: 'Busca por hashtag, explorador e Reels virais',
          enabled: true,
        },
        {
          id: 'tiktok',
          name: 'TikTok',
          icon: 'video',
          description: 'Busca por hashtags e tendências',
          enabled: true,
        },
        {
          id: 'youtube',
          name: 'YouTube Shorts',
          icon: 'youtube',
          description: 'Busca por palavras-chave com ordenação por visualizações',
          enabled: true,
        },
      ],
    })
  }),

  http.get('*/api/discover/platforms', () => {
    return HttpResponse.json<DiscoveryPlatformsResponse>({
      platforms: [
        {
          id: 'instagram',
          name: 'Instagram Reels',
          icon: 'instagram',
          description: 'Busca por hashtag, explorador e Reels virais',
          enabled: true,
        },
        {
          id: 'tiktok',
          name: 'TikTok',
          icon: 'video',
          description: 'Busca por hashtags e tendências',
          enabled: true,
        },
        {
          id: 'youtube',
          name: 'YouTube Shorts',
          icon: 'youtube',
          description: 'Busca por palavras-chave com ordenação por visualizações',
          enabled: true,
        },
      ],
    })
  }),

  http.post('*/api/discovery/searches', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as DiscoveryFilter
    const query = String(body.query || 'achadinhos')
    const platform = body.platform || 'tiktok'
    const id = `search-${Date.now()}`
    const items = query === 'empty' ? [] : mockDiscoveryItems

    const search: DiscoverySearch = {
      id,
      platform,
      query,
      filter_params: body,
      status: 'COMPLETED',
      total_found: items.length,
      items,
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      duration_seconds: 1.5,
    }

    mockSearchesStore.set(id, search)

    return HttpResponse.json<DiscoverySearchSummary>(
      {
        id: search.id,
        platform: search.platform,
        query: search.query,
        status: search.status,
        total_found: search.total_found,
        created_at: search.created_at,
        completed_at: search.completed_at,
      },
      { status: 202 },
    )
  }),

  http.get('*/api/discovery/searches', () => {
    const summaries: DiscoverySearchSummary[] = Array.from(mockSearchesStore.values()).map((s) => ({
      id: s.id,
      platform: s.platform,
      query: s.query,
      status: s.status,
      total_found: s.total_found,
      created_at: s.created_at,
      completed_at: s.completed_at,
      error_message: s.error_message,
    }))
    return HttpResponse.json<DiscoverySearchSummary[]>(summaries)
  }),

  http.get('*/api/discovery/searches/:id', ({ params }) => {
    const id = String(params.id)
    const search = mockSearchesStore.get(id)
    if (!search) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json<DiscoverySearch>(search)
  }),

  http.post('*/api/discovery/searches/:id/cancel', ({ params }) => {
    const id = String(params.id)
    const search = mockSearchesStore.get(id)
    if (!search) {
      return new HttpResponse(null, { status: 404 })
    }
    search.status = 'CANCELLED'
    search.completed_at = new Date().toISOString()
    mockSearchesStore.set(id, search)

    return HttpResponse.json<DiscoverySearchSummary>({
      id: search.id,
      platform: search.platform,
      query: search.query,
      status: search.status,
      total_found: search.total_found,
      created_at: search.created_at,
      completed_at: search.completed_at,
    })
  }),

  http.delete('*/api/discovery/searches/:id', ({ params }) => {
    const id = String(params.id)
    mockSearchesStore.delete(id)
    return HttpResponse.json<{ success: boolean }>({ success: true })
  }),

  http.post('*/api/discovery/search', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const query = String(body.query || 'achadinhos')
    const platform = (body.platform as 'tiktok' | 'youtube' | 'instagram') || 'tiktok'
    const items = query === 'empty' ? [] : mockDiscoveryItems

    return HttpResponse.json<DiscoveryResult>({
      query,
      platform,
      total_found: items.length,
      items,
      cached: false,
      fetched_at: new Date().toISOString(),
    })
  }),

  http.post('*/api/discover/search', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const query = String(body.query || 'achadinhos')
    const platform = (body.platform as 'tiktok' | 'youtube' | 'instagram') || 'tiktok'
    const items = query === 'empty' ? [] : mockDiscoveryItems

    return HttpResponse.json<DiscoveryResult>({
      query,
      platform,
      total_found: items.length,
      items,
      cached: false,
      fetched_at: new Date().toISOString(),
    })
  }),
]
