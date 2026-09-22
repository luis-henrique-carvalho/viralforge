import type { UseFormReturn } from 'react-hook-form'
import { ExternalLink } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import type { ItemEditorFormData } from '../data/item-editor.schema'
import type { Brand, ViralItem } from '../data/batch.types'

interface DetailsTabProps {
  item: ViralItem
  form: UseFormReturn<ItemEditorFormData>
  brand?: Brand | null
}

export function ViralEditorDetailsTab({ item, form, brand }: DetailsTabProps) {
  return (
    <div className="space-y-4 text-xs">
      {/* Product Code */}
      <div className="space-y-1.5">
        <Label
          htmlFor="product-code"
          className="text-[11px] uppercase font-semibold text-muted-foreground"
        >
          Código do Produto
        </Label>
        <Input
          id="product-code"
          {...form.register('product_code')}
          placeholder="Ex: 2567 ou PROD-01"
          className="h-9 text-xs"
        />
        {form.formState.errors.product_code && (
          <Typography variant="destructive">
            {form.formState.errors.product_code.message}
          </Typography>
        )}
        <Typography variant="muted">
          Identificador informado aos seguidores para encontrar o item na sua bio ou catálogo.
        </Typography>
      </div>

      {/* Affiliate Link */}
      <div className="space-y-1.5">
        <Label
          htmlFor="product-url"
          className="text-[11px] uppercase font-semibold text-muted-foreground"
        >
          Link Individual de Afiliado (Opcional)
        </Label>
        <Input
          id="product-url"
          type="url"
          {...form.register('product_url')}
          placeholder={brand?.default_affiliate_url || 'https://shopee.com.br/...'}
          className="h-9 text-xs"
        />
        {form.formState.errors.product_url && (
          <Typography variant="destructive">{form.formState.errors.product_url.message}</Typography>
        )}
        <Typography variant="muted">
          Se vazio, utiliza o link padrão configurado na marca (
          {brand?.default_affiliate_url || 'link da bio'}).
        </Typography>
      </div>

      {/* Source URL */}
      <div className="space-y-1.5">
        <Label className="text-[11px] uppercase font-semibold text-muted-foreground">
          URL de Origem
        </Label>
        {/* shadcn-ignore: link de origem externa formatado */}
        <div className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-muted/40 p-2.5">
          <span className="truncate text-muted-foreground break-all">{item.source_url}</span>
          <a
            href={item.source_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline shrink-0 text-xs font-medium"
          >
            <span>Abrir</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
    </div>
  )
}
