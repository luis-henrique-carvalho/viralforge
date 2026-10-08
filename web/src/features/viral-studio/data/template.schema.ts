import { z } from 'zod'

export const generationTaskSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(100),
  target: z.enum([
    'canvas_headline',
    'canvas_badge',
    'canvas_extra_image',
    'post_caption',
    'post_title',
    'post_hashtags',
    'custom_metadata',
  ]),
  instruction: z.string().min(1),
  output_type: z.enum(['text', 'options_list', 'poll', 'image_prompt']).default('text'),
  is_required: z.boolean().default(true),
})

export const visualTemplateSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(100),
  is_system: z.boolean().default(false),
  width: z.number().min(360).max(3840).default(1080),
  height: z.number().min(640).max(3840).default(1920),
  background_color: z.string().max(9).default('#0D1117'),

  video_fit: z.enum(['contain', 'cover']).default('contain'),
  video_aspect: z.enum(['1:1', '4:5', '16:9', '9:16', 'free']).default('1:1'),
  video_x: z.number().optional().nullable(),
  video_y: z.number().min(0).max(1920).default(360),
  video_width: z.number().optional().nullable(),
  video_height: z.number().min(100).max(1920).default(1000),
  video_scale: z.number().min(10).max(100).default(92),
  video_radius: z.number().min(0).max(100).default(20),
  video_border_width: z.number().min(0).max(50).default(2),
  video_border_color: z.string().max(9).default('#3B82F6'),
  video_shadow: z.enum(['none', 'subtle', 'deep', 'glow-blue', 'glow-pink']).default('deep'),

  brand_alignment: z.enum(['left', 'center']).default('left'),
  avatar_enabled: z.boolean().default(true),
  avatar_x: z.number().min(0).max(3840).default(60),
  avatar_y: z.number().min(0).max(3840).default(80),
  avatar_size: z.number().min(20).max(1000).default(100),
  brand_name_enabled: z.boolean().default(true),
  brand_name_font_size: z.number().min(10).max(200).default(36),
  brand_name_color: z.string().max(9).default('#F0F6FC'),
  handle_font_size: z.number().min(10).max(160).default(26),
  handle_color: z.string().max(9).default('#8B949E'),

  headline_enabled: z.boolean().default(true),
  headline_font: z.string().max(100).default('Montserrat-ExtraBold'),
  headline_font_size: z.number().min(12).max(200).default(48),
  headline_color: z.string().max(9).default('#FFFFFF'),
  headline_alignment: z.enum(['left', 'center']).default('center'),
  headline_y: z.number().min(0).max(1920).default(130),
  headline_max_lines: z.number().min(1).max(8).default(3),
  headline_margin_x: z.number().min(0).max(1000).default(60),
  headline_margin_top: z.number().min(0).max(1000).default(30),

  badge_enabled: z.boolean().default(true),
  custom_badge_text: z.string().max(60).optional().nullable(),
  custom_badge_bg_color: z.string().max(9).default('#E11D48'),
  custom_badge_text_color: z.string().max(9).default('#FFFFFF'),
  badge_y: z.number().min(0).max(1920).default(45),

  extra_image_enabled: z.boolean().default(true),
  extra_image_path: z.string().max(512).optional().nullable(),
  extra_image_url: z.string().max(2048).optional().nullable(),
  extra_image_template_type: z
    .enum(['comment', 'follow', 'deal', 'fact', 'custom_upload'])
    .default('comment'),
  extra_image_title: z.string().max(120).optional().nullable(),
  extra_image_subtitle: z.string().max(240).optional().nullable(),
  extra_image_bg_color: z.string().max(9).default('#18181B'),
  extra_image_text_color: z.string().max(9).default('#FFFFFF'),
  extra_image_border_color: z.string().max(9).default('#3F3F46'),
  extra_image_x: z.number().optional().nullable(),
  extra_image_y: z.number().min(0).max(1920).default(1420),
  extra_image_height: z.number().min(50).max(1200).default(340),
  extra_image_width: z.number().min(10).max(100).default(92),
  extra_image_radius: z.number().min(0).max(100).default(16),

  watermark_enabled: z.boolean().default(true),
  watermark_opacity: z.number().min(0).max(1).default(0.7),
  watermark_position: z
    .enum(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'])
    .default('bottom-right'),

  niche_type: z.string().max(64).default('curiosities'),
  persona_role: z
    .string()
    .max(500)
    .default('Roteirista investigativo focado em fatos curiosos e mistérios'),
  tone_of_voice: z.string().max(200).default('Intrigante, misterioso, dinâmico'),
  conversion_goal: z
    .enum(['engagement', 'affiliate', 'lead_capture', 'keyword_direct'])
    .default('engagement'),
  call_to_action_template: z.string().max(500).optional().nullable(),
  system_prompt_template: z.string().max(4000).optional().nullable(),
  default_hashtags: z.array(z.string()).default([]),
  preferred_model: z.string().max(128).optional().nullable(),

  generation_tasks: z.array(generationTaskSchema).default([]),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
})

export const templateCreateSchema = visualTemplateSchema
  .omit({ created_at: true, updated_at: true })
  .partial({ id: true })

export const templateUpdateSchema = templateCreateSchema.partial()

export const templateListResponseSchema = z.object({
  templates: z.array(visualTemplateSchema).default([]),
  total: z.number().default(0),
})

export const testGenerationRequestSchema = z.object({
  template: visualTemplateSchema.optional(),
  template_id: z.string().optional(),
  brand_id: z.string().optional(),
  sample_transcript: z.string().max(10000).optional(),
  sample_title: z.string().max(500).optional(),
  model: z.string().max(128).optional(),
})

export const testGenerationResponseSchema = z.object({
  copy: z.record(z.string(), z.unknown()),
  prompt: z.string(),
  raw_response: z.string(),
  telemetry: z.record(z.string(), z.unknown()).default({}),
})

export const DEFAULT_TASK_CATALOG = [
  {
    id: 'headline',
    label: 'Headline no Vídeo',
    target: 'canvas_headline' as const,
    instruction:
      'Crie 5 opções de headlines curtas e magnéticas focando no benefício ou curiosidade em {transcript}.',
    output_type: 'options_list' as const,
    description: 'Gera 5 ganchos de alto impacto para sobreposição no topo do vídeo 9:16.',
  },
  {
    id: 'caption',
    label: 'Legenda Completa',
    target: 'post_caption' as const,
    instruction:
      'Escreva uma legenda completa com gancho inicial, narrativa envolvente, CTA: {cta} e hashtags estratégicas.',
    output_type: 'text' as const,
    description: 'Estrutura gancho, corpo, chamada para ação e tags de SEO.',
  },
  {
    id: 'social_title',
    label: 'Título do Post',
    target: 'post_title' as const,
    instruction:
      'Crie um título curto de até 60 caracteres com alto CTR para Reels, TikTok e Shorts.',
    output_type: 'text' as const,
    description: 'Título conciso otimizado para feeds de redes sociais.',
  },
  {
    id: 'footer_comment',
    label: 'Texto de Rodapé',
    target: 'canvas_extra_image' as const,
    instruction: 'Gere uma pergunta provocativa curta para incentivar comentários.',
    output_type: 'text' as const,
    description: 'Preenche a camada inferior com uma pergunta ou chamada para engajar.',
  },
  {
    id: 'poll_quiz',
    label: 'Enquete / Quiz',
    target: 'custom_metadata' as const,
    instruction:
      'Gere uma pergunta com 2 a 4 opções de resposta para prender a audiência até o final.',
    output_type: 'poll' as const,
    description: 'Pergunta interativa para estimular respostas nos comentários.',
  },
  {
    id: 'hashtags_seo',
    label: 'Hashtags de SEO',
    target: 'post_hashtags' as const,
    instruction: 'Gere 5 a 8 hashtags de alta relevância no nicho {niche}.',
    output_type: 'text' as const,
    description: 'Tags estratégicas de ranqueamento para o algoritmo.',
  },
  {
    id: 'image_prompt',
    label: 'Prompt de Imagem IA',
    target: 'canvas_extra_image' as const,
    instruction:
      'Crie uma descrição visual detalhada em inglês para gerar uma ilustração conceitual no estilo cinematográfico sobre {transcript}.',
    output_type: 'image_prompt' as const,
    description: 'Prompt para sintetizar asset visual de rodapé via gerador de imagem.',
  },
]
