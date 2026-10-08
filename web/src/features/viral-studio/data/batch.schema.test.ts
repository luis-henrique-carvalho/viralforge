import { describe, expect, it } from 'vitest'
import {
  batchCreateSchema,
  batchResponseSchema,
  viralItemInputSchema,
  viralItemSchema,
  viralItemStatusSchema,
} from './batch.schema'
import {
  brandCreateSchema,
  brandSchema,
  templateCreateSchema,
  templateSchema,
} from './brand.schema'

describe('Viral Studio Zod Schemas', () => {
  describe('viralItemStatusSchema', () => {
    it('accepts valid statuses', () => {
      const valid = [
        'PENDING',
        'DOWNLOADING',
        'ANALYZING',
        'RENDERING',
        'READY_FOR_REVIEW',
        'APPROVED',
        'FAILED',
      ]
      valid.forEach((status) => {
        expect(viralItemStatusSchema.parse(status)).toBe(status)
      })
    })

    it('rejects invalid statuses', () => {
      expect(() => viralItemStatusSchema.parse('UNKNOWN_STATUS')).toThrow()
    })
  })

  describe('viralItemInputSchema', () => {
    it('validates a correct input', () => {
      const input = {
        source_url: 'https://tiktok.com/@user/video/12345',
        product_code: 'COD123',
      }
      const parsed = viralItemInputSchema.parse(input)
      expect(parsed.source_url).toBe(input.source_url)
      expect(parsed.product_code).toBe('COD123')
    })

    it('fails when source_url is empty', () => {
      expect(() => viralItemInputSchema.parse({ source_url: '' })).toThrow()
    })
  })

  describe('batchCreateSchema', () => {
    it('validates a complete batch create payload', () => {
      const payload = {
        brand_id: 'vale-o-clique',
        template_id: 'classic-affiliate',
        model: 'gemini-2.5-flash',
        items: [
          { source_url: 'https://tiktok.com/@user/video/1' },
          { source_url: 'https://youtube.com/shorts/2', product_code: 'PROD2' },
        ],
      }
      const parsed = batchCreateSchema.parse(payload)
      expect(parsed.brand_id).toBe('vale-o-clique')
      expect(parsed.items).toHaveLength(2)
    })

    it('rejects batch with 0 items', () => {
      expect(() =>
        batchCreateSchema.parse({
          brand_id: 'vale-o-clique',
          items: [],
        }),
      ).toThrow()
    })
  })

  describe('viralItemSchema & batchResponseSchema', () => {
    it('parses full viral item with defaults', () => {
      const itemData = {
        id: 'item-1',
        source_url: 'https://tiktok.com/@user/video/1',
      }
      const parsed = viralItemSchema.parse(itemData)
      expect(parsed.id).toBe('item-1')
      expect(parsed.status).toBe('PENDING')
      expect(parsed.keyframe_urls).toEqual([])
      expect(parsed.logs).toEqual([])
    })

    it('parses viral item with dynamic fields and custom outputs', () => {
      const itemData = {
        id: 'item-tasks',
        source_url: 'https://tiktok.com/@user/video/2',
        badge_text: 'SUPER ACHADO 🔥',
        footer_text: 'Deixe um comentário!',
        social_title: 'Dica de Cozinha',
        ai_copy: {
          product: 'Panela',
          headlines: ['H1'],
          selected_headline: 'H1',
          caption: 'Cap',
          hashtags: ['#tag'],
          social_title: 'Dica de Cozinha',
          custom_outputs: {
            badge_text: 'SUPER ACHADO 🔥',
            footer_text: 'Deixe um comentário!',
          },
        },
      }
      const parsed = viralItemSchema.parse(itemData)
      expect(parsed.badge_text).toBe('SUPER ACHADO 🔥')
      expect(parsed.footer_text).toBe('Deixe um comentário!')
      expect(parsed.social_title).toBe('Dica de Cozinha')
      expect(parsed.ai_copy?.custom_outputs).toEqual({
        badge_text: 'SUPER ACHADO 🔥',
        footer_text: 'Deixe um comentário!',
      })
    })

    it('parses batch response', () => {
      const batchData = {
        id: 'batch-1',
        batch_id: 'batch-1',
        brand_id: 'vale-o-clique',
        items: [{ id: 'item-1', source_url: 'https://tiktok.com/@user/video/1' }],
      }
      const parsed = batchResponseSchema.parse(batchData)
      expect(parsed.id).toBe('batch-1')
      expect(parsed.items).toHaveLength(1)
    })
  })

  describe('brandSchema & templateSchema', () => {
    it('validates brand schema with defaults', () => {
      const brandData = {
        id: 'test-brand',
        name: 'Test Brand',
        handle: '@testbrand',
      }
      const parsed = brandSchema.parse(brandData)
      expect(parsed.name).toBe('Test Brand')
      expect(parsed.default_cta).toBe('Confira os achadinhos no link da bio!')
      expect(parsed.template_id).toBe('classic-affiliate')
    })

    it('validates brand create schema', () => {
      const createData = {
        name: 'Nova Marca',
        handle: '@novamarca',
      }
      const parsed = brandCreateSchema.parse(createData)
      expect(parsed.name).toBe('Nova Marca')
    })

    it('validates template schema defaults', () => {
      const templateData = {
        id: 'classic-affiliate',
        name: 'Classic Affiliate',
      }
      const parsed = templateSchema.parse(templateData)
      expect(parsed.width).toBe(1080)
      expect(parsed.height).toBe(1920)
      expect(parsed.video_fit).toBe('contain')
    })

    it('validates template create schema', () => {
      const createData = {
        name: 'Custom Template',
        width: 1080,
        height: 1920,
      }
      const parsed = templateCreateSchema.parse(createData)
      expect(parsed.name).toBe('Custom Template')
    })
  })
})
