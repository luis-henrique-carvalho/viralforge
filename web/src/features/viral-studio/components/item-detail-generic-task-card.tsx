import { Check, Copy, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ItemDetailGenericTaskCardProps {
  taskKey: string
  val: unknown
  copiedKey: string | null
  onCopy: (text: string, key: string, label: string) => void
}

export function ItemDetailGenericTaskCard({
  taskKey,
  val,
  copiedKey,
  onCopy,
}: ItemDetailGenericTaskCardProps) {
  const textVal =
    typeof val === 'string'
      ? val
      : typeof val === 'object'
        ? JSON.stringify(val, null, 2)
        : String(val)

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="p-3.5 pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-indigo-500" />
          <CardTitle className="text-xs font-semibold capitalize">
            {taskKey.replace(/_/g, ' ')}
          </CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs gap-1"
          onClick={() => onCopy(textVal, taskKey, taskKey)}
        >
          {copiedKey === taskKey ? (
            <Check className="size-3 text-emerald-500" />
          ) : (
            <Copy className="size-3" />
          )}
          <span>{copiedKey === taskKey ? 'Copiado' : 'Copiar'}</span>
        </Button>
      </CardHeader>
      <CardContent className="p-3.5 pt-0">
        {/* shadcn-ignore: layout container */}
        <div className="rounded-md border border-border/70 bg-muted/30 p-2.5 text-xs whitespace-pre-wrap font-mono">
          {textVal}
        </div>
      </CardContent>
    </Card>
  )
}
