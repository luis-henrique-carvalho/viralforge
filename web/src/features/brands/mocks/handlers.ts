import { http, HttpResponse } from 'msw'
import type { Brand, BrandCreate, BrandListResponse, BrandUpdate } from '../data/brand.types'

export const mockBrands: Brand[] = [
  {
    id: 'vale-o-clique',
    name: 'Vale o Clique?',
    handle: '@valeoclique',
    niche: 'Achadinhos & Utilidades Domésticas',
    discovery_keywords: ['achadinhos', 'shopee', 'utilidades'],
    avatar_path: null,
    avatar_url: null,
    logo_path: null,
    default_cta: 'Confira os achadinhos no link da bio!',
    default_affiliate_url: 'https://amzn.to/valeoclique',
    template_id: 'classic-affiliate',
    posting_schedule: {
      frequency: 3,
      slots: ['10:00', '15:00', '20:00'],
      timezone: 'America/Sao_Paulo',
    },
    publishing_profiles: {
      postiz: { customer_id: 'cust_postiz_01' },
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tech-review',
    name: 'Tech Review BR',
    handle: '@techreviewbr',
    niche: 'IA & Gadgets',
    discovery_keywords: ['gadgets', 'tech', 'smartphones'],
    avatar_path: null,
    avatar_url: null,
    logo_path: null,
    default_cta: 'Link com desconto no perfil!',
    default_affiliate_url: 'https://mercadolivre.com/sec/tech',
    template_id: 'tech-review',
    posting_schedule: {
      frequency: 2,
      slots: ['12:00', '19:00'],
      timezone: 'America/Sao_Paulo',
    },
    publishing_profiles: {
      postiz: { customer_id: 'cust_postiz_02' },
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const mockBrandVideos = [
  {
    id: 'item-1',
    batch_id: 'batch-101',
    brand_id: 'vale-o-clique',
    model: 'gemini-2.5-flash',
    source_url: 'https://www.tiktok.com/@user/video/111111',
    product_code: 'PROD-01',
    product_url: 'https://amzn.to/prod01',
    manual_headline: null,
    additional_instructions: null,
    selected_headline: 'Este suporte magnético vai mudar sua mesa de trabalho!',
    caption: 'Suporte ultra resistente em liga de alumínio com rotação 360. #achadinhos #setup',
    status: 'READY_FOR_REVIEW',
    source_path: '/data/sources/item-1.mp4',
    rendered_path: '/data/rendered/item-1-916.mp4',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export function resetMockBrandsData() {
  mockBrands.length = 0
  mockBrands.push(
    {
      id: 'vale-o-clique',
      name: 'Vale o Clique?',
      handle: '@valeoclique',
      niche: 'Achadinhos & Utilidades Domésticas',
      discovery_keywords: ['achadinhos', 'shopee', 'utilidades'],
      avatar_path: null,
      avatar_url: null,
      logo_path: null,
      default_cta: 'Confira os achadinhos no link da bio!',
      default_affiliate_url: 'https://amzn.to/valeoclique',
      template_id: 'classic-affiliate',
      posting_schedule: {
        frequency: 3,
        slots: ['10:00', '15:00', '20:00'],
        timezone: 'America/Sao_Paulo',
      },
      publishing_profiles: {
        postiz: { customer_id: 'cust_postiz_01' },
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'tech-review',
      name: 'Tech Review BR',
      handle: '@techreviewbr',
      niche: 'IA & Gadgets',
      discovery_keywords: ['gadgets', 'tech', 'smartphones'],
      avatar_path: null,
      avatar_url: null,
      logo_path: null,
      default_cta: 'Link com desconto no perfil!',
      default_affiliate_url: 'https://mercadolivre.com/sec/tech',
      template_id: 'tech-review',
      posting_schedule: {
        frequency: 2,
        slots: ['12:00', '19:00'],
        timezone: 'America/Sao_Paulo',
      },
      publishing_profiles: {
        postiz: { customer_id: 'cust_postiz_02' },
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  )
}

function handleGetBrands() {
  const response: BrandListResponse = {
    brands: mockBrands,
    total: mockBrands.length,
  }
  return HttpResponse.json(response)
}

function handleGetBrand(id: string) {
  const brand = mockBrands.find((b) => b.id === id)
  if (!brand) {
    return new HttpResponse(JSON.stringify({ detail: 'Brand not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return HttpResponse.json(brand)
}

async function handleCreateBrand(request: Request) {
  const body = (await request.json()) as BrandCreate
  const newBrand: Brand = {
    id: body.id || body.name.toLowerCase().replace(/\s+/g, '-'),
    name: body.name,
    handle: body.handle.startsWith('@') ? body.handle : `@${body.handle}`,
    avatar_path: body.avatar_path || null,
    logo_path: body.logo_path || null,
    default_cta: body.default_cta || 'Confira os achadinhos no link da bio!',
    default_affiliate_url: body.default_affiliate_url || null,
    template_id: body.template_id || 'classic-affiliate',
    publishing_profiles: body.publishing_profiles || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  mockBrands.push(newBrand)
  return HttpResponse.json(newBrand, { status: 201 })
}

async function handlePatchBrand(id: string, request: Request) {
  const body = (await request.json()) as BrandUpdate
  const brand = mockBrands.find((b) => b.id === id)
  if (!brand) {
    return new HttpResponse(JSON.stringify({ detail: 'Brand not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  Object.assign(brand, body, { updated_at: new Date().toISOString() })
  return HttpResponse.json(brand)
}

function handleGetBrandWorkspace(id: string) {
  const brand = mockBrands.find((b) => b.id === id)
  if (!brand) {
    return new HttpResponse(JSON.stringify({ detail: 'Brand not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const videoStats = {
    total: 3,
    ready: 1,
    approved: 1,
    scheduled: 1,
    published: 0,
  }
  const connectedChannels = [
    {
      id: 'mock_tiktok_01',
      platform: 'tiktok',
      name: `${brand.name} TikTok`,
      connected: true,
      handle: brand.handle,
      provider: 'postiz',
    },
    {
      id: 'mock_insta_01',
      platform: 'instagram',
      name: `${brand.name} Instagram`,
      connected: true,
      handle: brand.handle,
      provider: 'postiz',
    },
  ]

  return HttpResponse.json({
    brand,
    active_provider: 'postiz',
    connected_channels: connectedChannels,
    video_stats: videoStats,
    next_slot: new Date(Date.now() + 3600 * 1000 * 4).toISOString(),
    scheduled_count: videoStats.scheduled,
  })
}

function handleGetBrandChannels(id: string) {
  const brand = mockBrands.find((b) => b.id === id)
  return HttpResponse.json([
    {
      id: 'mock_tiktok_01',
      platform: 'tiktok',
      name: `${brand?.name || 'Brand'} TikTok`,
      connected: true,
      handle: brand?.handle,
      provider: 'postiz',
    },
    {
      id: 'mock_insta_01',
      platform: 'instagram',
      name: `${brand?.name || 'Brand'} Instagram`,
      connected: true,
      handle: brand?.handle,
      provider: 'postiz',
    },
  ])
}

function handleGetAvailableChannels() {
  return HttpResponse.json([
    {
      id: 'mock_tiktok_01',
      platform: 'tiktok',
      name: 'Vale o Clique TikTok',
      connected: true,
      handle: '@valeoclique',
      group_id: 'grp_voc',
      group_name: 'Vale o Clique',
      provider: 'postiz',
    },
    {
      id: 'mock_insta_01',
      platform: 'instagram',
      name: 'Vale o Clique Instagram',
      connected: true,
      handle: '@valeoclique',
      group_id: 'grp_voc',
      group_name: 'Vale o Clique',
      provider: 'postiz',
    },
    {
      id: 'mock_youtube_01',
      platform: 'youtube',
      name: 'Vale o Clique YT',
      connected: true,
      handle: '@valeoclique',
      group_id: 'grp_voc',
      group_name: 'Vale o Clique',
      provider: 'postiz',
    },
  ])
}

async function handleBindChannels(id: string, request: Request) {
  const body = (await request.json()) as { channel_ids: string[]; workspace_id?: string }
  const brand = mockBrands.find((b) => b.id === id)
  if (!brand) {
    return new HttpResponse(JSON.stringify({ detail: 'Brand not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const profiles = { ...(brand.publishing_profiles || {}) }
  profiles.postiz = {
    active: true,
    channel_ids: body.channel_ids,
    workspace_id: body.workspace_id,
    customer_id: body.workspace_id,
    linked_at: new Date().toISOString(),
  }
  brand.publishing_profiles = profiles
  brand.updated_at = new Date().toISOString()
  return HttpResponse.json(brand)
}

function handleConnectUrl(id: string) {
  return HttpResponse.json({
    url: `https://postiz.app/connect?brand_id=${id}`,
  })
}

function handleGetBrandVideos(id: string, request: Request) {
  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  let items = mockBrandVideos.filter((i) => i.brand_id === id)
  if (status && status !== 'all') {
    items = items.filter((i) => i.status.toUpperCase() === status.toUpperCase())
  }
  return HttpResponse.json(items)
}

async function handleAutoSchedule(request: Request) {
  const body = (await request.json()) as { item_id: string; channel_ids?: string[] }
  return HttpResponse.json({
    success: true,
    item_id: body.item_id,
    receipts: [
      {
        item_id: body.item_id,
        post_id: `post_mock_${body.item_id}`,
        account_id: body.channel_ids?.[0] || 'mock_tiktok_01',
        status: 'scheduled',
        scheduled_time: new Date(Date.now() + 3600 * 1000 * 4).toISOString(),
        provider: 'postiz',
      },
    ],
  })
}

async function handlePublish(request: Request) {
  const body = (await request.json()) as {
    item_id: string
    channel_ids?: string[]
    scheduled_for?: string
    publish_now?: boolean
  }
  return HttpResponse.json({
    success: true,
    item_id: body.item_id,
    receipts: [
      {
        item_id: body.item_id,
        post_id: `post_mock_${body.item_id}`,
        account_id: body.channel_ids?.[0] || 'mock_tiktok_01',
        status: body.publish_now ? 'published' : 'scheduled',
        scheduled_time: body.scheduled_for,
        provider: 'postiz',
      },
    ],
  })
}

async function handleScheduleSlots(id: string, request: Request) {
  const body = (await request.json()) as { slots: string[]; timezone: string; frequency?: number }
  const brand = mockBrands.find((b) => b.id === id)
  if (!brand) {
    return new HttpResponse(JSON.stringify({ detail: 'Brand not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  brand.posting_schedule = {
    slots: body.slots,
    timezone: body.timezone,
    frequency: body.frequency || body.slots.length,
  }
  brand.updated_at = new Date().toISOString()
  return HttpResponse.json(brand)
}

function handleGetScheduled(id: string) {
  const schedDate = new Date(Date.now() + 3600 * 1000 * 4).toISOString()
  return HttpResponse.json({
    brand_id: id,
    posts: [
      {
        id: 'post_mock_101',
        post_id: 'post_mock_101',
        brand_id: id,
        item_id: 'item-1',
        title: 'Suporte Magnético 360',
        scheduled_for: schedDate,
        scheduled_time: schedDate,
        status: 'scheduled',
        channels: ['tiktok', 'instagram'],
        thumbnail_url: null,
        external_url: null,
        post_url: null,
        metrics: {},
      },
    ],
    total: 1,
  })
}

function handleDeleteScheduled(postId: string) {
  return HttpResponse.json({ success: true, post_id: postId })
}

function handlePublishScheduledNow(_brandId: string, postId: string) {
  return HttpResponse.json({
    success: true,
    job_id: `job_mock_${postId}`,
    item_id: 'item-1',
    message: 'Publicação disparada com sucesso',
  })
}

function handleGetPublishingWorkspaces(request: Request) {
  const url = new URL(request.url)
  const provider = url.searchParams.get('provider') || 'postiz'
  if (provider === 'zernio') {
    return HttpResponse.json([
      { id: 'ws_zernio_01', name: 'Workspace Zernio Padrão', provider: 'zernio' },
    ])
  }
  return HttpResponse.json([
    { id: 'ws_postiz_01', name: 'Workspace Principal Postiz', provider: 'postiz' },
    { id: 'ws_postiz_02', name: 'Clientes e Agências', provider: 'postiz' },
  ])
}

export const brandHandlers = [
  // Sovereign domain /api/brands
  http.get('/api/brands', () => handleGetBrands()),
  http.get('/api/brands/:id', ({ params }) => handleGetBrand(params.id as string)),
  http.post('/api/brands', ({ request }) => handleCreateBrand(request)),
  http.patch('/api/brands/:id', ({ params, request }) =>
    handlePatchBrand(params.id as string, request),
  ),
  http.get('/api/brands/:id/workspace', ({ params }) =>
    handleGetBrandWorkspace(params.id as string),
  ),
  http.get('/api/brands/:id/channels', ({ params }) => handleGetBrandChannels(params.id as string)),
  http.get('/api/brands/:id/channels/available', () => handleGetAvailableChannels()),
  http.post('/api/brands/:id/channels/bind', ({ params, request }) =>
    handleBindChannels(params.id as string, request),
  ),
  http.post('/api/brands/:id/channels/connect-url', ({ params }) =>
    handleConnectUrl(params.id as string),
  ),
  http.get('/api/brands/:id/videos', ({ params, request }) =>
    handleGetBrandVideos(params.id as string, request),
  ),
  http.post('/api/brands/:id/auto-schedule', ({ request }) => handleAutoSchedule(request)),
  http.post('/api/brands/:id/publish', ({ request }) => handlePublish(request)),
  http.post('/api/brands/:id/schedule-slots', ({ params, request }) =>
    handleScheduleSlots(params.id as string, request),
  ),
  http.get('/api/brands/:id/scheduled', ({ params }) => handleGetScheduled(params.id as string)),
  http.delete('/api/brands/:id/scheduled/:postId', ({ params }) =>
    handleDeleteScheduled(params.postId as string),
  ),
  http.post('/api/brands/:id/scheduled/:postId/publish-now', ({ params }) =>
    handlePublishScheduledNow(params.id as string, params.postId as string),
  ),
  http.get('/api/brands/publishing/workspaces', ({ request }) =>
    handleGetPublishingWorkspaces(request),
  ),
  http.get('/api/publishing/workspaces', ({ request }) => handleGetPublishingWorkspaces(request)),
]
