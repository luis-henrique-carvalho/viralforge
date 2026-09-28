import { describe, expect, it } from 'vitest'
import { templateApi } from './template.api'
import { templateKeys } from './template.keys'

describe('templateKeys', () => {
  it('generates structured query keys', () => {
    expect(templateKeys.all).toEqual(['viral-studio', 'templates'])
    expect(templateKeys.lists()).toEqual(['viral-studio', 'templates', 'list'])
    expect(templateKeys.list({ q: 'news' })).toEqual([
      'viral-studio',
      'templates',
      'list',
      { filters: { q: 'news' } },
    ])
    expect(templateKeys.details()).toEqual(['viral-studio', 'templates', 'detail'])
    expect(templateKeys.detail('t1')).toEqual(['viral-studio', 'templates', 'detail', 't1'])
  })
})

describe('templateApi Service', () => {
  it('fetches templates', async () => {
    const data = await templateApi.fetchTemplates()
    expect(data.templates).toBeDefined()
    expect(data.templates.length).toBeGreaterThan(0)
  })

  it('fetches a single template by ID', async () => {
    const data = await templateApi.fetchTemplate('curiosities-viral')
    expect(data.id).toBe('curiosities-viral')
    expect(data.name).toBe('Curiosidades & Fatos Virais')
  })

  it('creates a new template', async () => {
    const created = await templateApi.createTemplate({
      name: 'Template Criado Teste',
      background_color: '#0D1117',
      niche_type: 'curiosities',
      conversion_goal: 'engagement',
    })
    expect(created.id).toBeDefined()
    expect(created.name).toBe('Template Criado Teste')
  })

  it('updates a template partially', async () => {
    const updated = await templateApi.updateTemplate('classic-affiliate', {
      name: 'Achadinhos Atualizado',
    })
    expect(updated.name).toBe('Achadinhos Atualizado')
  })

  it('replaces a template completely (PUT)', async () => {
    const replaced = await templateApi.replaceTemplate('tech-review', {
      id: 'tech-review',
      name: 'Tech Review Replaced',
      background_color: '#000000',
      niche_type: 'tech',
      conversion_goal: 'affiliate',
    })
    expect(replaced.name).toBe('Tech Review Replaced')
    expect(replaced.background_color).toBe('#000000')
  })

  it('duplicates a template', async () => {
    const duplicated = await templateApi.duplicateTemplate('quick-facts-news')
    expect(duplicated.id).toContain('copy')
    expect(duplicated.name).toContain('(Cópia)')
    expect(duplicated.is_system).toBe(false)
  })

  it('resets default templates', async () => {
    const reset = await templateApi.resetDefaultTemplates()
    expect(reset.templates.length).toBeGreaterThan(0)
  })

  it('tests copy generation with AI', async () => {
    const testResult = await templateApi.testTemplateGeneration({
      template_id: 'curiosities-viral',
      sample_transcript: 'Este é um produto incrível que limpa qualquer superfície.',
      sample_title: 'Limpador Mágico',
    })
    expect(testResult.copy).toBeDefined()
    expect(testResult.prompt).toBeDefined()
    expect(testResult.telemetry).toBeDefined()
  })

  it('deletes a custom template', async () => {
    const custom = await templateApi.createTemplate({
      id: 'template-to-delete',
      name: 'Template Para Deletar',
    })
    await expect(templateApi.deleteTemplate(custom.id)).resolves.not.toThrow()
  })
})
