import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().default('/api'),
  VITE_APP_TITLE: z.string().default('ViralForge'),
  VITE_ENABLE_DEVTOOLS: z
    .string()
    .optional()
    .transform((value) => value === 'true' || value === '1'),
  MODE: z.string().default('development'),
  DEV: z.boolean().default(true),
  PROD: z.boolean().default(false),
})

export const env = envSchema.parse({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_APP_TITLE: import.meta.env.VITE_APP_TITLE,
  VITE_ENABLE_DEVTOOLS: import.meta.env.VITE_ENABLE_DEVTOOLS,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
})
