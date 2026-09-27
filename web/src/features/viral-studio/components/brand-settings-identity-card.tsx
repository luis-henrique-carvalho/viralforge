import { useEffect, useState } from 'react'
import { Save, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Typography } from '@/components/ui/typography'
import type { Brand, BrandUpdate, VisualTemplate } from '../data/batch.types'

interface BrandSettingsIdentityCardProps {
  brand: Brand
  templates: VisualTemplate[]
  onSave: (data: BrandUpdate) => Promise<void>
  isPending: boolean
}

export function BrandSettingsIdentityCard({
  brand,
  templates,
  onSave,
  isPending,
}: BrandSettingsIdentityCardProps) {
  const [name, setName] = useState(brand.name || '')
  const [handle, setHandle] = useState(brand.handle || '')
  const [niche, setNiche] = useState(brand.niche || '')
  const [keywordsText, setKeywordsText] = useState((brand.discovery_keywords || []).join(', '))
  const [templateId, setTemplateId] = useState(brand.template_id || 'classic-affiliate')
  const [defaultCta, setDefaultCta] = useState(brand.default_cta || '')
  const [defaultAffiliateUrl, setDefaultAffiliateUrl] = useState(brand.default_affiliate_url || '')

  useEffect(() => {
    setName(brand.name || '')
    setHandle(brand.handle || '')
    setNiche(brand.niche || '')
    setKeywordsText((brand.discovery_keywords || []).join(', '))
    setTemplateId(brand.template_id || 'classic-affiliate')
    setDefaultCta(brand.default_cta || '')
    setDefaultAffiliateUrl(brand.default_affiliate_url || '')
  }, [brand])

  const handleSave = async () => {
    const keywords = keywordsText
      .split(',')
      .map((k) => k.trim().replace(/^#/, ''))
      .filter((k) => k.length > 0)

    await onSave({
      name,
      handle: handle.startsWith('@') ? handle : `@${handle}`,
      niche: niche || null,
      discovery_keywords: keywords,
      template_id: templateId,
      default_cta: defaultCta,
      default_affiliate_url: defaultAffiliateUrl || null,
    })
  }

  return (
    <Card className="border-border bg-card/60 backdrop-blur-xs">
      <CardHeader className="pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="size-4 text-amber-500" />
            Identidade & Diretrizes Editoriais
          </CardTitle>
          <CardDescription className="text-xs">
            Configure os metadados da marca, template visual padrão e textos de conversão.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="brand-name"
              className="text-xs"
            >
              Nome da Marca:
            </Label>
            <Input
              id="brand-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Achadinhos da Ju"
              className="text-xs h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="brand-handle"
              className="text-xs"
            >
              Handle Oficial:
            </Label>
            <Input
              id="brand-handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="Ex: @achadinhosdaju"
              className="text-xs h-9 font-mono"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="brand-niche"
              className="text-xs"
            >
              Nicho Editorial:
            </Label>
            <Input
              id="brand-niche"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="Ex: Achadinhos & Utilidades Domésticas"
              className="text-xs h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="brand-template"
              className="text-xs"
            >
              Template Visual Padrão:
            </Label>
            <Select
              value={templateId}
              onValueChange={setTemplateId}
            >
              <SelectTrigger
                id="brand-template"
                className="text-xs h-9"
              >
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem
                    key={t.id}
                    value={t.id}
                  >
                    {t.name} ({t.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="brand-keywords"
            className="text-xs"
          >
            Palavras-Chave de Descoberta (separadas por vírgula):
          </Label>
          <Input
            id="brand-keywords"
            value={keywordsText}
            onChange={(e) => setKeywordsText(e.target.value)}
            placeholder="achadinhos shopee, produtos úteis tiktok, unboxing utilidades"
            className="text-xs h-9"
          />
          <Typography
            variant="muted"
            className="text-[11px]"
          >
            Essas palavras serão exibidas como chips de busca rápida no Discovery.
          </Typography>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="brand-cta"
            className="text-xs"
          >
            CTA de Conversão Padrão:
          </Label>
          <Textarea
            id="brand-cta"
            value={defaultCta}
            onChange={(e) => setDefaultCta(e.target.value)}
            placeholder="Confira os achadinhos no link da bio! 🛍️"
            className="text-xs min-h-[70px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="brand-affiliate-url"
            className="text-xs"
          >
            Link de Afiliado Padrão:
          </Label>
          <Input
            id="brand-affiliate-url"
            value={defaultAffiliateUrl}
            onChange={(e) => setDefaultAffiliateUrl(e.target.value)}
            placeholder="https://amzn.to/seulink"
            className="text-xs h-9 font-mono"
          />
        </div>

        <div className="flex justify-end pt-2 border-t border-border/40">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="gap-1.5 text-xs shadow-sm"
          >
            <Save className="size-3.5" />
            Salvar Diretrizes da Marca
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
