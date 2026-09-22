import { http, HttpResponse } from 'msw'
import type {
  BatchCreateRequest,
  BatchListResponse,
  BatchResponse,
  Brand,
  BrandCreate,
  BrandListResponse,
  BrandUpdate,
  TemplateListResponse,
  ViralItem,
  ViralItemUpdate,
  VisualTemplate,
} from '../data/batch.types'

export const mockTemplates: VisualTemplate[] = [
  {
    id: 'classic-affiliate',
    name: 'Classic Affiliate',
    width: 1080,
    height: 1920,
    background_color: '#FFFFFF',
    avatar_enabled: true,
    brand_name_enabled: true,
    headline_enabled: true,
    watermark_enabled: true,
    video_fit: 'contain',
    avatar_x: 60,
    avatar_y: 80,
    avatar_size: 100,
    brand_name_font_size: 36,
    brand_name_color: '#111111',
    handle_font_size: 26,
    handle_color: '#666666',
    headline_font_size: 48,
    headline_color: '#111111',
    headline_max_lines: 3,
    headline_margin_x: 60,
    headline_margin_top: 30,
    watermark_opacity: 0.7,
    watermark_position: 'bottom-right',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const mockBrands: Brand[] = [
  {
    id: 'vale-o-clique',
    name: 'Vale o Clique?',
    handle: '@valeoclique',
    avatar_path: null,
    logo_path: null,
    default_cta: 'Confira os achadinhos no link da bio!',
    default_affiliate_url: 'https://amzn.to/valeoclique',
    template_id: 'classic-affiliate',
    publishing_profiles: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tech-review',
    name: 'Tech Review BR',
    handle: '@techreviewbr',
    avatar_path: null,
    logo_path: null,
    default_cta: 'Link com desconto no perfil!',
    default_affiliate_url: 'https://mercadolivre.com/sec/tech',
    template_id: 'classic-affiliate',
    publishing_profiles: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const mockItems: ViralItem[] = [
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
    ai_copy: {
      product: 'Suporte Magnético 360',
      product_description: 'Suporte ajustável para smartphone com imã forte.',
      headlines: [
        'Este suporte magnético vai mudar sua mesa de trabalho!',
        'Nunca mais derrube seu celular na mesa!',
        'O acessório de mesa mais útil que já comprei!',
      ],
      selected_headline: 'Este suporte magnético vai mudar sua mesa de trabalho!',
      caption: 'Suporte ultra resistente em liga de alumínio com rotação 360. #achadinhos #setup',
      hashtags: ['#achadinhos', '#setup', '#tecnologia'],
    },
    status: 'READY_FOR_REVIEW',
    source_path: '/data/sources/item-1.mp4',
    rendered_path: '/data/rendered/item-1-916.mp4',
    error_message: null,
    job_id: 'job-1',
    source_metadata: { duration: 15.4, width: 1080, height: 1920 },
    ai_context_summary: { detected_product: 'Suporte de mesa', confidence: 0.95 },
    ai_telemetry: { model: 'gemini-2.5-flash', latency_ms: 1240, prompt_tokens: 350 },
    keyframe_urls: ['/data/keyframes/item-1-0.jpg'],
    logs: [
      { timestamp: '2026-09-21T22:00:00Z', message: 'Download concluído com sucesso' },
      {
        timestamp: '2026-09-21T22:00:02Z',
        message: 'Análise multimodal Gemini 2.5 Flash concluída',
      },
      { timestamp: '2026-09-21T22:00:05Z', message: 'Renderização 9:16 concluída' },
    ],
    publication_records: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item-2',
    batch_id: 'batch-101',
    brand_id: 'vale-o-clique',
    model: 'gemini-2.5-flash',
    source_url: 'https://youtube.com/shorts/222222',
    product_code: 'PROD-02',
    product_url: null,
    manual_headline: null,
    additional_instructions: null,
    selected_headline: null,
    caption: null,
    ai_copy: null,
    status: 'ANALYZING',
    source_path: '/data/sources/item-2.mp4',
    rendered_path: null,
    error_message: null,
    job_id: 'job-2',
    source_metadata: null,
    ai_context_summary: null,
    ai_telemetry: null,
    keyframe_urls: [],
    logs: [{ timestamp: '2026-09-21T22:01:00Z', message: 'Iniciando extração de frames...' }],
    publication_records: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item-3',
    batch_id: 'batch-101',
    brand_id: 'vale-o-clique',
    model: 'gemini-2.5-flash',
    source_url: 'https://tiktok.com/@user/video/333333',
    product_code: 'PROD-03',
    product_url: null,
    manual_headline: null,
    additional_instructions: null,
    selected_headline: null,
    caption: null,
    ai_copy: null,
    status: 'FAILED',
    source_path: null,
    rendered_path: null,
    error_message: 'Erro ao baixar vídeo: URL inacessível ou privada.',
    job_id: 'job-3',
    source_metadata: null,
    ai_context_summary: null,
    ai_telemetry: null,
    keyframe_urls: [],
    logs: [{ timestamp: '2026-09-21T22:02:00Z', message: 'Falha no download da URL de origem' }],
    publication_records: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const mockBatches: BatchResponse[] = [
  {
    id: 'batch-101',
    batch_id: 'batch-101',
    brand_id: 'vale-o-clique',
    template_id: 'classic-affiliate',
    model: 'gemini-2.5-flash',
    status: 'PROCESSING',
    total_items: 3,
    items: mockItems,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const viralStudioHandlers = [
  // Batches
  http.get('/api/viral-studio/batches', () => {
    const response: BatchListResponse = {
      batches: mockBatches,
      total: mockBatches.length,
    }
    return HttpResponse.json(response)
  }),

  http.get('/api/viral-studio/batches/:id', ({ params }) => {
    const { id } = params
    const batch = mockBatches.find((b) => b.id === id || b.batch_id === id)
    if (!batch) {
      return new HttpResponse(JSON.stringify({ detail: 'Batch not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return HttpResponse.json(batch)
  }),

  http.post('/api/viral-studio/batches', async ({ request }) => {
    const body = (await request.json()) as BatchCreateRequest
    const newBatchId = `batch-${Date.now()}`
    const newItems: ViralItem[] = body.items.map((item, index) => ({
      id: `item-${Date.now()}-${index}`,
      batch_id: newBatchId,
      brand_id: body.brand_id,
      model: body.model || 'gemini-2.5-flash',
      source_url: item.source_url,
      product_code: item.product_code || null,
      product_url: item.product_url || null,
      manual_headline: item.manual_headline || null,
      additional_instructions: item.additional_instructions || null,
      selected_headline: item.manual_headline || null,
      caption: null,
      ai_copy: null,
      status: 'PENDING',
      source_path: null,
      rendered_path: null,
      error_message: null,
      job_id: `job-${index}`,
      source_metadata: null,
      ai_context_summary: null,
      ai_telemetry: null,
      keyframe_urls: [],
      logs: [],
      publication_records: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const newBatch: BatchResponse = {
      id: newBatchId,
      batch_id: newBatchId,
      brand_id: body.brand_id,
      template_id: body.template_id || 'classic-affiliate',
      model: body.model || 'gemini-2.5-flash',
      status: 'PENDING',
      total_items: newItems.length,
      items: newItems,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    mockBatches.unshift(newBatch)
    return HttpResponse.json(newBatch, { status: 201 })
  }),

  // Items
  http.get('/api/viral-studio/items/:id', ({ params }) => {
    const { id } = params
    const item = mockItems.find((i) => i.id === id)
    if (!item) {
      return new HttpResponse(JSON.stringify({ detail: 'Item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return HttpResponse.json(item)
  }),

  http.patch('/api/viral-studio/items/:id', async ({ params, request }) => {
    const { id } = params
    const body = (await request.json()) as ViralItemUpdate
    const item = mockItems.find((i) => i.id === id)
    if (!item) {
      return new HttpResponse(JSON.stringify({ detail: 'Item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    Object.assign(item, body, { updated_at: new Date().toISOString() })
    return HttpResponse.json(item)
  }),

  http.post('/api/viral-studio/items/:id/approve', ({ params }) => {
    const { id } = params
    const item = mockItems.find((i) => i.id === id)
    if (!item) {
      return new HttpResponse(JSON.stringify({ detail: 'Item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    item.status = 'APPROVED'
    item.updated_at = new Date().toISOString()
    return HttpResponse.json(item)
  }),

  http.post('/api/viral-studio/items/:id/retry', ({ params }) => {
    const { id } = params
    const item = mockItems.find((i) => i.id === id)
    if (!item) {
      return new HttpResponse(JSON.stringify({ detail: 'Item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    item.status = 'PENDING'
    item.error_message = null
    item.updated_at = new Date().toISOString()
    return HttpResponse.json(item)
  }),

  // Brands
  http.get('/api/viral-studio/brands', () => {
    const response: BrandListResponse = {
      brands: mockBrands,
      total: mockBrands.length,
    }
    return HttpResponse.json(response)
  }),

  http.get('/api/viral-studio/brands/:id', ({ params }) => {
    const { id } = params
    const brand = mockBrands.find((b) => b.id === id)
    if (!brand) {
      return new HttpResponse(JSON.stringify({ detail: 'Brand not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return HttpResponse.json(brand)
  }),

  http.post('/api/viral-studio/brands', async ({ request }) => {
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
  }),

  http.patch('/api/viral-studio/brands/:id', async ({ params, request }) => {
    const { id } = params
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
  }),

  // Templates
  http.get('/api/viral-studio/templates', () => {
    const response: TemplateListResponse = {
      templates: mockTemplates,
      total: mockTemplates.length,
    }
    return HttpResponse.json(response)
  }),

  http.get('/api/viral-studio/templates/:id', ({ params }) => {
    const { id } = params
    const template = mockTemplates.find((t) => t.id === id)
    if (!template) {
      return new HttpResponse(JSON.stringify({ detail: 'Template not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return HttpResponse.json(template)
  }),
]
