import { describe, expect, it } from 'vitest'
import { itemEditorSchema } from './item-editor.schema'

describe('itemEditorSchema', () => {
  it('validates a valid form data payload', () => {
    const validData = {
      selected_headline: 'Headline Magnética para Teste',
      caption: 'Legenda completa com hashtags e chamada.',
      product_code: 'PROD-123',
      product_url: 'https://shopee.com.br/product/123',
    }

    const result = itemEditorSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.selected_headline).toBe('Headline Magnética para Teste')
      expect(result.data.product_code).toBe('PROD-123')
    }
  })

  it('fails when selected_headline is empty', () => {
    const invalidData = {
      selected_headline: '',
      caption: 'Legenda',
      product_code: '',
      product_url: '',
    }

    const result = itemEditorSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('fails when product_url is not a valid http/https url', () => {
    const invalidData = {
      selected_headline: 'Headline Válida',
      caption: '',
      product_code: '',
      product_url: 'ftp://invalid-protocol.com',
    }

    const result = itemEditorSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('allows empty product_url or empty strings', () => {
    const validData = {
      selected_headline: 'Headline Válida',
      caption: '',
      product_code: '',
      product_url: '',
    }

    const result = itemEditorSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('validates badge_text, footer_text, and social_title successfully', () => {
    const validData = {
      selected_headline: 'Headline Válida',
      caption: 'Legenda',
      product_code: 'P-1',
      product_url: '',
      badge_text: 'ACHADINHO 🔥',
      footer_text: 'Comente para receber!',
      social_title: 'Dica Imperdível',
    }

    const result = itemEditorSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.badge_text).toBe('ACHADINHO 🔥')
      expect(result.data.footer_text).toBe('Comente para receber!')
      expect(result.data.social_title).toBe('Dica Imperdível')
    }
  })

  it('fails when badge_text exceeds 60 characters', () => {
    const invalidData = {
      selected_headline: 'Headline Válida',
      caption: '',
      product_code: '',
      product_url: '',
      badge_text: 'A'.repeat(61),
    }

    const result = itemEditorSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('fails when footer_text exceeds 240 characters', () => {
    const invalidData = {
      selected_headline: 'Headline Válida',
      caption: '',
      product_code: '',
      product_url: '',
      footer_text: 'F'.repeat(241),
    }

    const result = itemEditorSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('fails when social_title exceeds 120 characters', () => {
    const invalidData = {
      selected_headline: 'Headline Válida',
      caption: '',
      product_code: '',
      product_url: '',
      social_title: 'S'.repeat(121),
    }

    const result = itemEditorSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })
})
