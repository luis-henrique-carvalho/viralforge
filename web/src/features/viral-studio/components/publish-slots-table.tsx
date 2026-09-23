import { Calendar, Loader2, Sparkles } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getViralPosterUrl } from '../services/viral-media.utils'
import type { ViralItem } from '../data/batch.types'
import type { SlotProjection } from '../data/publishing.types'

export interface PublishSlotsTableProps {
  items: ViralItem[]
  projectedSlots?: SlotProjection[]
  isLoading: boolean
}

export function PublishSlotsTable({ items, projectedSlots, isLoading }: PublishSlotsTableProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          Cronograma Projetado
        </Label>
        {isLoading && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 className="size-3 animate-spin" /> Calculando slots...
          </span>
        )}
      </div>

      {projectedSlots && projectedSlots.length > 0 && (
        <Alert className="py-2.5 bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300">
          <Sparkles className="size-4 text-blue-500" />
          <AlertTitle className="text-xs font-semibold">Fila Contínua Ativa</AlertTitle>
          <AlertDescription className="text-xs">
            Continuando cronograma a partir de <strong>{projectedSlots[0].formatted}</strong> sem
            sobreposição com vídeos anteriores.
          </AlertDescription>
        </Alert>
      )}

      <ScrollArea className="border rounded-lg max-h-48">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-12 text-xs">#</TableHead>
              <TableHead className="text-xs">Vídeo</TableHead>
              <TableHead className="text-xs text-right">Horário Calculado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => {
              const slot = projectedSlots?.[idx]
              const posterUrl = getViralPosterUrl(item)
              return (
                <TableRow key={item.id}>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-2">
                      {posterUrl ? (
                        <img
                          src={posterUrl}
                          alt=""
                          className="size-7 rounded object-cover border"
                        />
                      ) : (
                        <div className="size-7 rounded bg-muted flex items-center justify-center text-[10px]">
                          9:16
                        </div>
                      )}
                      <span className="font-medium truncate max-w-[220px]">
                        {item.selected_headline || item.product_code || 'Achadinho'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-right font-medium text-primary">
                    {slot ? slot.formatted : 'Calculando...'}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}
