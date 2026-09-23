import { http, HttpResponse } from 'msw'
import type {
  BatchCreateRequest,
  BatchListResponse,
  BatchResponse,
  Brand,
  BrandCreate,
  BrandListResponse,
  BrandUpdate,
  ViralItem,
  ViralItemUpdate,
} from '../data/batch.types'
import type {
  TemplateCreate,
  TemplateListResponse,
  TemplateUpdate,
  TestGenerationRequest,
  TestGenerationResponse,
  VisualTemplate,
} from '../data/template.types'

export const mockTemplates: VisualTemplate[] = [
  {
    id: 'curiosities-viral',
    name: 'Curiosidades & Fatos Virais',
    is_system: true,
    width: 1080,
    height: 1920,
    background_color: '#0D1117',
    video_fit: 'contain',
    video_aspect: '1:1',
    video_x: null,
    video_y: 360,
    video_width: null,
    video_height: 1000,
    video_scale: 92,
    video_radius: 20,
    video_border_width: 2,
    video_border_color: '#3B82F6',
    video_shadow: 'deep',
    avatar_enabled: true,
    avatar_x: 60,
    avatar_y: 80,
    avatar_size: 100,
    brand_name_enabled: true,
    brand_name_font_size: 36,
    brand_name_color: '#F0F6FC',
    handle_font_size: 26,
    handle_color: '#8B949E',
    headline_enabled: true,
    headline_font: 'Montserrat-ExtraBold',
    headline_font_size: 48,
    headline_color: '#FFFFFF',
    headline_y: 130,
    headline_max_lines: 3,
    headline_margin_x: 60,
    headline_margin_top: 30,
    badge_enabled: true,
    custom_badge_text: 'VOCÊ SABIA?',
    custom_badge_bg_color: '#E11D48',
    custom_badge_text_color: '#FFFFFF',
    badge_y: 45,
    extra_image_enabled: true,
    extra_image_path: null,
    extra_image_url: null,
    extra_image_template_type: 'comment',
    extra_image_x: null,
    extra_image_y: 1420,
    extra_image_height: 340,
    extra_image_width: 92,
    extra_image_radius: 16,
    watermark_enabled: true,
    watermark_opacity: 0.7,
    watermark_position: 'bottom-right',
    niche_type: 'curiosities',
    persona_role: 'Roteirista investigativo focado em fatos curiosos e mistérios',
    tone_of_voice: 'Intrigante, misterioso, dinâmico',
    conversion_goal: 'engagement',
    call_to_action_template: 'Siga para mais conteúdos!',
    system_prompt_template: null,
    default_hashtags: ['#curiosidades', '#fatosdesconhecidos', '#vocesabia'],
    preferred_model: null,
    generation_tasks: [
      {
        id: 'hook_headline',
        label: 'Gancho Visual de Impacto',
        target: 'canvas_headline',
        instruction: 'Gere uma pergunta intrigante de no máximo 8 palavras.',
        output_type: 'text',
        is_required: true,
      },
      {
        id: 'curiosity_badge',
        label: 'Selo de Curiosidade',
        target: 'canvas_badge',
        instruction: 'Selo provocador de 2 a 3 palavras.',
        output_type: 'text',
        is_required: false,
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'classic-affiliate',
    name: 'Achadinhos & Afiliados',
    is_system: true,
    width: 1080,
    height: 1920,
    background_color: '#FFFFFF',
    video_fit: 'contain',
    video_aspect: '1:1',
    video_x: null,
    video_y: 360,
    video_width: null,
    video_height: 1000,
    video_scale: 92,
    video_radius: 20,
    video_border_width: 2,
    video_border_color: '#E5E7EB',
    video_shadow: 'subtle',
    avatar_enabled: true,
    avatar_x: 60,
    avatar_y: 80,
    avatar_size: 100,
    brand_name_enabled: true,
    brand_name_font_size: 36,
    brand_name_color: '#111827',
    handle_font_size: 26,
    handle_color: '#6B7280',
    headline_enabled: true,
    headline_font: 'Montserrat-ExtraBold',
    headline_font_size: 48,
    headline_color: '#111827',
    headline_y: 130,
    headline_max_lines: 3,
    headline_margin_x: 60,
    headline_margin_top: 30,
    badge_enabled: false,
    custom_badge_text: null,
    custom_badge_bg_color: '#E11D48',
    custom_badge_text_color: '#FFFFFF',
    badge_y: 45,
    extra_image_enabled: false,
    extra_image_path: null,
    extra_image_url: null,
    extra_image_template_type: 'deal',
    extra_image_x: null,
    extra_image_y: 1420,
    extra_image_height: 340,
    extra_image_width: 92,
    extra_image_radius: 16,
    watermark_enabled: true,
    watermark_opacity: 0.7,
    watermark_position: 'bottom-right',
    niche_type: 'affiliate_products',
    persona_role: 'Curador de achadinhos úteis com alto apelo de compra por impulso',
    tone_of_voice: 'Empolgado, prático, direto',
    conversion_goal: 'affiliate',
    call_to_action_template: 'Confira os achadinhos no link da bio!',
    system_prompt_template: null,
    default_hashtags: ['#achadinhos', '#comprinhas', '#shopee', '#mercadolivre'],
    preferred_model: null,
    generation_tasks: [
      {
        id: 'affiliate_headline',
        label: 'Headline Comercial de Impacto',
        target: 'canvas_headline',
        instruction: 'Gere um gancho direto focando no benefício principal.',
        output_type: 'text',
        is_required: true,
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'quick-facts-news',
    name: 'Notícias Rápidas & Fatos',
    is_system: true,
    width: 1080,
    height: 1920,
    background_color: '#0F172A',
    video_fit: 'contain',
    video_aspect: '1:1',
    video_x: null,
    video_y: 360,
    video_width: null,
    video_height: 1000,
    video_scale: 92,
    video_radius: 12,
    video_border_width: 3,
    video_border_color: '#DC2626',
    video_shadow: 'deep',
    avatar_enabled: true,
    avatar_x: 60,
    avatar_y: 80,
    avatar_size: 100,
    brand_name_enabled: true,
    brand_name_font_size: 36,
    brand_name_color: '#F8FAFC',
    handle_font_size: 26,
    handle_color: '#94A3B8',
    headline_enabled: true,
    headline_font: 'Montserrat-ExtraBold',
    headline_font_size: 48,
    headline_color: '#FFFFFF',
    headline_y: 130,
    headline_max_lines: 3,
    headline_margin_x: 60,
    headline_margin_top: 30,
    badge_enabled: true,
    custom_badge_text: 'URGENTE',
    custom_badge_bg_color: '#DC2626',
    custom_badge_text_color: '#FFFFFF',
    badge_y: 45,
    extra_image_enabled: true,
    extra_image_path: null,
    extra_image_url: null,
    extra_image_template_type: 'fact',
    extra_image_x: null,
    extra_image_y: 1420,
    extra_image_height: 340,
    extra_image_width: 92,
    extra_image_radius: 12,
    watermark_enabled: true,
    watermark_opacity: 0.7,
    watermark_position: 'bottom-right',
    niche_type: 'news_and_trends',
    persona_role: 'Jornalista ágil e dinâmico trazendo notícias de última hora',
    tone_of_voice: 'Urgente, direto, factual',
    conversion_goal: 'engagement',
    call_to_action_template: 'Comente sua opinião e compartilhe!',
    system_prompt_template: null,
    default_hashtags: ['#noticias', '#urgente', '#aconteceu', '#fatos'],
    preferred_model: null,
    generation_tasks: [
      {
        id: 'news_headline',
        label: 'Manchete Urgente',
        target: 'canvas_headline',
        instruction: 'Gere uma manchete de impacto factual.',
        output_type: 'text',
        is_required: true,
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tech-review',
    name: 'Review Tech & Gadgets',
    is_system: true,
    width: 1080,
    height: 1920,
    background_color: '#090D16',
    video_fit: 'contain',
    video_aspect: '1:1',
    video_x: null,
    video_y: 360,
    video_width: null,
    video_height: 1000,
    video_scale: 92,
    video_radius: 24,
    video_border_width: 2,
    video_border_color: '#06B6D4',
    video_shadow: 'glow-blue',
    avatar_enabled: true,
    avatar_x: 60,
    avatar_y: 80,
    avatar_size: 100,
    brand_name_enabled: true,
    brand_name_font_size: 36,
    brand_name_color: '#E0F2FE',
    handle_font_size: 26,
    handle_color: '#7DD3FC',
    headline_enabled: true,
    headline_font: 'Montserrat-ExtraBold',
    headline_font_size: 48,
    headline_color: '#FFFFFF',
    headline_y: 130,
    headline_max_lines: 3,
    headline_margin_x: 60,
    headline_margin_top: 30,
    badge_enabled: true,
    custom_badge_text: 'TECH REVIEW',
    custom_badge_bg_color: '#0891B2',
    custom_badge_text_color: '#FFFFFF',
    badge_y: 45,
    extra_image_enabled: true,
    extra_image_path: null,
    extra_image_url: null,
    extra_image_template_type: 'deal',
    extra_image_x: null,
    extra_image_y: 1420,
    extra_image_height: 340,
    extra_image_width: 92,
    extra_image_radius: 16,
    watermark_enabled: true,
    watermark_opacity: 0.7,
    watermark_position: 'bottom-right',
    niche_type: 'technology',
    persona_role: 'Especialista em reviews de tecnologia e hardware',
    tone_of_voice: 'Analítico, técnico porém acessível',
    conversion_goal: 'affiliate',
    call_to_action_template: 'Link com o melhor preço na bio!',
    system_prompt_template: null,
    default_hashtags: ['#tecnologia', '#tech', '#gadgets', '#setup'],
    preferred_model: null,
    generation_tasks: [
      {
        id: 'tech_headline',
        label: 'Veredito Rápido',
        target: 'canvas_headline',
        instruction: 'Gere um veredito direto e chamativo sobre o produto.',
        output_type: 'text',
        is_required: true,
      },
    ],
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

export function resetMockViralStudioData() {
  mockItems[0] = {
    ...mockItems[0],
    status: 'READY_FOR_REVIEW',
    selected_headline: 'Este suporte magnético vai mudar sua mesa de trabalho!',
    caption: 'Suporte ultra resistente em liga de alumínio com rotação 360. #achadinhos #setup',
    error_message: null,
  }
  mockItems[1] = {
    ...mockItems[1],
    status: 'ANALYZING',
    error_message: null,
  }
  mockItems[2] = {
    ...mockItems[2],
    status: 'FAILED',
    error_message: 'Erro ao baixar vídeo: URL inacessível ou privada.',
  }
  mockBatches[0].status = 'PROCESSING'
  mockBatches[0].items = mockItems
}

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

  http.post('/api/viral-studio/items/:id/render', async ({ params, request }) => {
    const { id } = params
    const body = (await request.json()) as {
      headline?: string
      template_id?: string
      watermark?: boolean
    }
    const item = mockItems.find((i) => i.id === id)
    if (!item) {
      return new HttpResponse(JSON.stringify({ detail: 'Item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (body.headline) {
      item.selected_headline = body.headline
    }
    item.status = 'RENDERING'
    item.updated_at = new Date().toISOString()
    return HttpResponse.json(item, { status: 202 })
  }),

  http.post('/api/viral-studio/items/:id/regenerate-copy', async ({ params, request }) => {
    const { id } = params
    const body = (await request.json()) as { model?: string; manual_instructions?: string }
    const item = mockItems.find((i) => i.id === id)
    if (!item) {
      return new HttpResponse(JSON.stringify({ detail: 'Item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const newHeadline = `[IA: ${body.model || 'Gemini'}] Gancho Regerado ${Date.now().toString().slice(-4)}`
    item.selected_headline = newHeadline
    item.caption = `Nova legenda comercial regerada. ${body.manual_instructions || ''}`
    item.ai_copy = {
      product: item.ai_copy?.product || 'Produto em Destaque',
      product_description: item.ai_copy?.product_description || '',
      headlines: [
        newHeadline,
        'Outra opção magnética regerada pela IA!',
        'Terceira headline altamente persuasiva!',
      ],
      selected_headline: newHeadline,
      caption: item.caption,
      hashtags: ['#achadinhos', '#viral'],
    }
    item.updated_at = new Date().toISOString()
    return HttpResponse.json(item)
  }),

  // Local AI Models Discovery
  http.get('/api/config/local-models', () => {
    return HttpResponse.json({
      lm_studio: {
        online: true,
        base_url: 'http://localhost:1234',
        models: [{ id: 'qwen2.5-coder-7b-instruct', name: 'Qwen 2.5 Coder 7B Instruct' }],
      },
      ollama: {
        online: true,
        base_url: 'http://localhost:11434',
        models: [
          { id: 'llama3.2:3b', name: 'llama3.2:3b' },
          { id: 'qwen2.5:7b', name: 'qwen2.5:7b' },
        ],
      },
      models: [
        {
          id: 'lmstudio:qwen2.5-coder-7b-instruct',
          name: 'Qwen 2.5 Coder 7B Instruct',
          provider: 'lm_studio',
          group: 'LM Studio',
        },
        {
          id: 'ollama:llama3.2:3b',
          name: 'llama3.2:3b',
          provider: 'ollama',
          group: 'Ollama',
        },
      ],
    })
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

  http.post('/api/viral-studio/templates', async ({ request }) => {
    const body = (await request.json()) as TemplateCreate
    const newId = body.id || `custom-${Date.now()}`
    const newTemplate: VisualTemplate = {
      id: newId,
      name: body.name || 'Novo Template',
      is_system: false,
      width: body.width ?? 1080,
      height: body.height ?? 1920,
      background_color: body.background_color ?? '#0D1117',
      video_fit: body.video_fit ?? 'contain',
      video_aspect: body.video_aspect ?? '1:1',
      video_x: body.video_x ?? null,
      video_y: body.video_y ?? 360,
      video_width: body.video_width ?? null,
      video_height: body.video_height ?? 1000,
      video_scale: body.video_scale ?? 92,
      video_radius: body.video_radius ?? 20,
      video_border_width: body.video_border_width ?? 2,
      video_border_color: body.video_border_color ?? '#3B82F6',
      video_shadow: body.video_shadow ?? 'deep',
      avatar_enabled: body.avatar_enabled ?? true,
      avatar_x: body.avatar_x ?? 60,
      avatar_y: body.avatar_y ?? 80,
      avatar_size: body.avatar_size ?? 100,
      brand_name_enabled: body.brand_name_enabled ?? true,
      brand_name_font_size: body.brand_name_font_size ?? 36,
      brand_name_color: body.brand_name_color ?? '#F0F6FC',
      handle_font_size: body.handle_font_size ?? 26,
      handle_color: body.handle_color ?? '#8B949E',
      headline_enabled: body.headline_enabled ?? true,
      headline_font: body.headline_font ?? 'Montserrat-ExtraBold',
      headline_font_size: body.headline_font_size ?? 48,
      headline_color: body.headline_color ?? '#FFFFFF',
      headline_y: body.headline_y ?? 130,
      headline_max_lines: body.headline_max_lines ?? 3,
      headline_margin_x: body.headline_margin_x ?? 60,
      headline_margin_top: body.headline_margin_top ?? 30,
      badge_enabled: body.badge_enabled ?? false,
      custom_badge_text: body.custom_badge_text ?? null,
      custom_badge_bg_color: body.custom_badge_bg_color ?? '#E11D48',
      custom_badge_text_color: body.custom_badge_text_color ?? '#FFFFFF',
      badge_y: body.badge_y ?? 45,
      extra_image_enabled: body.extra_image_enabled ?? false,
      extra_image_path: body.extra_image_path ?? null,
      extra_image_url: body.extra_image_url ?? null,
      extra_image_template_type: body.extra_image_template_type ?? 'comment',
      extra_image_x: body.extra_image_x ?? null,
      extra_image_y: body.extra_image_y ?? 1420,
      extra_image_height: body.extra_image_height ?? 340,
      extra_image_width: body.extra_image_width ?? 92,
      extra_image_radius: body.extra_image_radius ?? 16,
      watermark_enabled: body.watermark_enabled ?? true,
      watermark_opacity: body.watermark_opacity ?? 0.7,
      watermark_position: body.watermark_position ?? 'bottom-right',
      niche_type: body.niche_type ?? 'curiosities',
      persona_role: body.persona_role ?? 'Criador de Conteúdo',
      tone_of_voice: body.tone_of_voice ?? 'Dinâmico',
      conversion_goal: body.conversion_goal ?? 'engagement',
      call_to_action_template: body.call_to_action_template ?? null,
      system_prompt_template: body.system_prompt_template ?? null,
      default_hashtags: body.default_hashtags ?? [],
      preferred_model: body.preferred_model ?? null,
      generation_tasks:
        body.generation_tasks?.map((t) => ({
          ...t,
          output_type: t.output_type ?? 'text',
          is_required: t.is_required ?? true,
        })) ?? [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockTemplates.push(newTemplate)
    return HttpResponse.json(newTemplate, { status: 201 })
  }),

  http.patch('/api/viral-studio/templates/:id', async ({ params, request }) => {
    const { id } = params
    const body = (await request.json()) as TemplateUpdate
    const template = mockTemplates.find((t) => t.id === id)
    if (!template) {
      return new HttpResponse(JSON.stringify({ detail: 'Template not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    Object.assign(template, body, { updated_at: new Date().toISOString() })
    return HttpResponse.json(template)
  }),

  http.put('/api/viral-studio/templates/:id', async ({ params, request }) => {
    const { id } = params
    const body = (await request.json()) as TemplateCreate
    const index = mockTemplates.findIndex((t) => t.id === id)
    if (index === -1) {
      return new HttpResponse(JSON.stringify({ detail: 'Template not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const updated: VisualTemplate = {
      ...mockTemplates[index],
      ...body,
      generation_tasks: body.generation_tasks
        ? body.generation_tasks.map((t) => ({
            ...t,
            output_type: t.output_type ?? 'text',
            is_required: t.is_required ?? true,
          }))
        : mockTemplates[index].generation_tasks,
      id: id as string,
      updated_at: new Date().toISOString(),
    }
    mockTemplates[index] = updated
    return HttpResponse.json(updated)
  }),

  http.delete('/api/viral-studio/templates/:id', ({ params }) => {
    const { id } = params
    const index = mockTemplates.findIndex((t) => t.id === id)
    if (index === -1) {
      return new HttpResponse(JSON.stringify({ detail: 'Template not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (mockTemplates[index].is_system) {
      return new HttpResponse(JSON.stringify({ detail: 'Cannot delete system template' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    mockTemplates.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/api/viral-studio/templates/:id/duplicate', ({ params }) => {
    const { id } = params
    const source = mockTemplates.find((t) => t.id === id)
    if (!source) {
      return new HttpResponse(JSON.stringify({ detail: 'Template not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const duplicated: VisualTemplate = {
      ...source,
      id: `${source.id}-copy-${Date.now().toString().slice(-4)}`,
      name: `${source.name} (Cópia)`,
      is_system: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockTemplates.push(duplicated)
    return HttpResponse.json(duplicated, { status: 201 })
  }),

  http.post('/api/viral-studio/templates/reset-defaults', () => {
    return HttpResponse.json({
      templates: mockTemplates.filter((t) => t.is_system),
      total: mockTemplates.filter((t) => t.is_system).length,
    })
  }),

  http.post('/api/viral-studio/templates/test-generation', async ({ request }) => {
    const body = (await request.json()) as TestGenerationRequest
    const sampleCopy = {
      product: 'Produto Teste IA',
      product_description: 'Descrição de teste gerada pela IA.',
      headlines: [
        'Você não vai acreditar no que este produto faz!',
        'A inovação definitiva que você precisava!',
        'Descubra como isso pode transformar seu dia!',
      ],
      selected_headline: 'Você não vai acreditar no que este produto faz!',
      caption: 'Veja todos os detalhes e garanta o seu hoje mesmo.',
      hashtags: ['#teste', '#viral', '#tech'],
      custom_outputs: {
        canvas_badge: 'TESTE VIP',
      },
    }
    const response: TestGenerationResponse = {
      copy: sampleCopy,
      prompt: 'Prompt de teste gerado para o modelo...',
      raw_response: JSON.stringify(sampleCopy),
      telemetry: {
        latency_ms: 320,
        model: body.model || 'gemini-2.5-flash',
        prompt_tokens: 150,
      },
    }
    return HttpResponse.json(response)
  }),

  http.post('/api/viral-studio/templates/:id/extra-image', ({ params }) => {
    const { id } = params
    const template = mockTemplates.find((t) => t.id === id)
    if (!template) {
      return new HttpResponse(JSON.stringify({ detail: 'Template not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    template.extra_image_enabled = true
    template.extra_image_path = `/data/templates/${id}_extra.png`
    template.extra_image_url = `/data/templates/${id}_extra.png`
    template.updated_at = new Date().toISOString()
    return HttpResponse.json(template)
  }),

  // Publishing
  http.get('/api/viral-studio/publishing/accounts', () => {
    return HttpResponse.json([
      {
        id: 'mock_tiktok_01',
        platform: 'tiktok',
        name: '@achadinhos_virais',
        connected: true,
      },
      {
        id: 'mock_instagram_01',
        platform: 'instagram',
        name: '@valeoclique.promos',
        connected: true,
      },
      {
        id: 'mock_youtube_01',
        platform: 'youtube',
        name: 'Achados em 1 Minuto',
        connected: true,
      },
    ])
  }),

  http.get('/api/viral-studio/publishing/preview-slots', ({ request }) => {
    const url = new URL(request.url)
    const count = parseInt(url.searchParams.get('count') || '1', 10)
    const accountId = url.searchParams.get('account_id') || 'default'

    const slots = Array.from({ length: count }, (_, idx) => {
      const d = new Date()
      d.setDate(d.getDate() + idx + 1)
      d.setHours(18, 0, 0, 0)
      return {
        index: idx + 1,
        datetime: d.toISOString(),
        formatted: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} às 18:00`,
      }
    })

    return HttpResponse.json({
      account_id: accountId,
      count: slots.length,
      last_scheduled_slot: slots[slots.length - 1]?.datetime,
      projected_slots: slots,
    })
  }),

  http.post('/api/viral-studio/publish', async ({ request }) => {
    const body = (await request.json()) as { item_ids: string[]; schedule_mode: string }
    const results = (body.item_ids || []).map((id, idx) => ({
      item_id: id,
      status: body.schedule_mode === 'now' ? 'published' : 'scheduled',
      post_id: `post_${idx + 1}`,
      platform_post_id: `ext_post_${idx + 1}`,
      published_at: body.schedule_mode === 'now' ? new Date().toISOString() : null,
      scheduled_for: body.schedule_mode !== 'now' ? new Date().toISOString() : null,
      post_url: 'https://tiktok.com/@achadinhos/video/123456',
    }))

    return HttpResponse.json({
      results,
      total: results.length,
      successful: results.length,
      failed: 0,
    })
  }),

  http.post('/api/viral-studio/publishing/:id/cancel', ({ params }) => {
    const { id } = params
    const item = mockItems.find((i) => i.id === id)
    if (item) {
      item.status = 'APPROVED'
      item.scheduled_for = null
    }
    return HttpResponse.json(item || { id, status: 'APPROVED' })
  }),
]
