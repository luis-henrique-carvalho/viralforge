import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Typography } from '@/components/ui/typography'

export interface BrandSettingsConversionFieldsProps {
  keywordsText: string
  setKeywordsText: (val: string) => void
  defaultCta: string
  setDefaultCta: (val: string) => void
  defaultAffiliateUrl: string
  setDefaultAffiliateUrl: (val: string) => void
}

export function BrandSettingsConversionFields({
  keywordsText,
  setKeywordsText,
  defaultCta,
  setDefaultCta,
  defaultAffiliateUrl,
  setDefaultAffiliateUrl,
}: BrandSettingsConversionFieldsProps) {
  return (
    <>
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
    </>
  )
}
