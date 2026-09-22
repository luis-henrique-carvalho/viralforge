import { useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { Check, Copy } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { ItemEditorFormData } from '../data/item-editor.schema'
import type { Brand } from '../data/batch.types'

interface CaptionTabProps {
  form: UseFormReturn<ItemEditorFormData>
  brand?: Brand | null
}

export function ViralEditorCaptionTab({ form, brand }: CaptionTabProps) {
  const [copied, setCopied] = useState(false)
  const currentCaption = form.watch('caption') || ''

  const handleCopyCaption = () => {
    if (!currentCaption) return
    navigator.clipboard.writeText(currentCaption)
    setCopied(true)
    toast.success('Legenda copiada para a área de transferência!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Legenda comercial completa sugerida pela IA para engajar e converter em vendas:
        </p>
        {currentCaption && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-[11px] gap-1 shrink-0"
            onClick={handleCopyCaption}
          >
            {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </Button>
        )}
      </div>

      <Textarea
        {...form.register('caption')}
        rows={8}
        placeholder="Escreva a legenda com gancho, código e hashtags..."
        className="text-xs leading-relaxed resize-y min-h-[160px]"
      />
      {form.formState.errors.caption && (
        <p className="text-[11px] text-destructive">{form.formState.errors.caption.message}</p>
      )}

      {brand?.default_cta && (
        /* shadcn-ignore: banner informativo de CTA padrão da marca */
        <div className="rounded-md border border-border/60 bg-muted/30 p-2 text-xs text-muted-foreground">
          <strong className="text-foreground">CTA padrão da marca:</strong> {brand.default_cta}
        </div>
      )}
    </div>
  )
}
