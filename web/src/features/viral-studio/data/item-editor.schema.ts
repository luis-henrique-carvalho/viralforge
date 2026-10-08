import { z } from 'zod'

export const itemEditorSchema = z.object({
  selected_headline: z
    .string()
    .min(1, 'A headline do vídeo é obrigatória')
    .max(300, 'Máximo de 300 caracteres'),
  caption: z.string().max(2200, 'Máximo de 2200 caracteres'),
  product_code: z.string().max(64, 'Máximo de 64 caracteres'),
  product_url: z
    .string()
    .max(2048, 'Máximo de 2048 caracteres')
    .refine((val) => !val || val === '' || /^https?:\/\/.+/i.test(val), {
      message: 'Insira uma URL válida iniciando com http:// ou https://',
    }),
  badge_text: z.string().max(60, 'Máximo de 60 caracteres').optional(),
  footer_text: z.string().max(240, 'Máximo de 240 caracteres').optional(),
  social_title: z.string().max(120, 'Máximo de 120 caracteres').optional(),
})

export type ItemEditorFormData = z.infer<typeof itemEditorSchema>
