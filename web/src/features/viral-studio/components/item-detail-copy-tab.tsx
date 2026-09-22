import { Copy } from 'lucide-react'
import { TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { AICopyData, ViralItem } from '../data/batch.types'

export interface ItemDetailCopyTabProps {
  item: ViralItem
  aiCopy?: AICopyData | null
}

function handleCopy(text: string, label: string) {
  navigator.clipboard.writeText(text)
  toast.success(`${label} copiado para a área de transferência!`)
}

export function ItemDetailCopyTab({ item, aiCopy }: ItemDetailCopyTabProps) {
  return (
    <TabsContent
      value="copy"
      className="m-0 space-y-4"
    >
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Gancho Principal Selecionado
          </label>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() =>
              handleCopy(item.selected_headline || aiCopy?.selected_headline || '', 'Gancho')
            }
          >
            <Copy className="size-3 mr-1" /> Copiar
          </Button>
        </div>
        <Card className="border-border bg-muted/40 shadow-none">
          <CardContent className="p-3 text-sm font-medium">
            {item.selected_headline || aiCopy?.selected_headline || 'Nenhum gancho gerado ainda.'}
          </CardContent>
        </Card>
      </div>

      {aiCopy?.headlines && aiCopy.headlines.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Variações de Headlines ({aiCopy.headlines.length})
          </label>
          <div className="space-y-1.5">
            {aiCopy.headlines.map((hl) => (
              <div
                key={hl}
                className="flex items-center justify-between rounded-md border border-border/70 bg-card p-2 text-xs"
              >
                <span className="truncate pr-2">{hl}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={() => handleCopy(hl, 'Headline')}
                >
                  <Copy className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Legenda Comercial & Hashtags
          </label>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => handleCopy(item.caption || aiCopy?.caption || '', 'Legenda')}
          >
            <Copy className="size-3 mr-1" /> Copiar Legenda
          </Button>
        </div>
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed whitespace-pre-wrap">
          {item.caption || aiCopy?.caption || 'Legenda comercial não gerada.'}
        </div>
      </div>
    </TabsContent>
  )
}
