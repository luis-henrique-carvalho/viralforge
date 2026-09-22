import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLocalAIModels } from '../hooks/use-local-ai-models'
import { useRegenerateCopy } from '../hooks/use-regenerate-copy'
import type { ViralItem } from '../data/batch.types'

interface CopyRegenerationCardProps {
  item: ViralItem
  batchId?: string
  onCopyRegenerated?: (updated: ViralItem) => void
}

export function CopyRegenerationCard({
  item,
  batchId,
  onCopyRegenerated,
}: CopyRegenerationCardProps) {
  const { modelOptions } = useLocalAIModels()
  const regenerateMutation = useRegenerateCopy(batchId)

  const [selectedModel, setSelectedModel] = useState<string>('default')
  const [instructions, setInstructions] = useState('')

  const groupedOptions = modelOptions.reduce<Record<string, typeof modelOptions>>((acc, opt) => {
    const group = opt.group || 'Geral'
    if (!acc[group]) acc[group] = []
    acc[group].push(opt)
    return acc
  }, {})

  const handleRegenerate = async () => {
    try {
      const updated = await regenerateMutation.mutateAsync({
        itemId: item.id,
        model: selectedModel === 'default' ? undefined : selectedModel || undefined,
        manual_instructions: instructions.trim() || undefined,
      })
      if (onCopyRegenerated) {
        onCopyRegenerated(updated)
      }
    } catch {
      // Handled by mutation toast
    }
  }

  return (
    <Card className="border-border/80 bg-card/60 shadow-xs">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
          <Sparkles className="size-3.5 text-primary" />
          Regerar Copy Comercial com IA
        </CardTitle>
      </CardHeader>

      <CardContent className="p-3 pt-1 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <Label
              htmlFor="regen-model"
              className="text-[10px] uppercase font-semibold text-muted-foreground"
            >
              Modelo de IA
            </Label>
            <Select
              value={selectedModel}
              onValueChange={setSelectedModel}
            >
              <SelectTrigger
                id="regen-model"
                className="h-8 text-xs bg-background"
              >
                <SelectValue placeholder="Padrão (Configurações)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Padrão (Configurações)</SelectItem>
                {Object.entries(groupedOptions).map(([group, options]) => (
                  <SelectGroup key={group}>
                    <SelectLabel className="text-[10px] uppercase">{group}</SelectLabel>
                    {options.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="text-xs"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="regen-instructions"
              className="text-[10px] uppercase font-semibold text-muted-foreground"
            >
              Instruções Opcionais
            </Label>
            <Input
              id="regen-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ex: Focar no desconto, tom divertido..."
              className="h-8 text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5 border-primary/40 bg-background hover:bg-primary/10"
            onClick={handleRegenerate}
            disabled={regenerateMutation.isPending}
          >
            {regenerateMutation.isPending ? (
              <>
                <Loader2 className="size-3 animate-spin text-primary" />
                <span>Regerando copy…</span>
              </>
            ) : (
              <>
                <Sparkles className="size-3 text-emerald-500" />
                <span>Regerar Copy</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
