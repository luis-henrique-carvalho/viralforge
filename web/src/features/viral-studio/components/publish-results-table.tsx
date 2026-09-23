import { CheckCircle2, Clock, ExternalLink, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
import type { ViralPublishResult } from '../data/publishing.types'

export interface PublishResultsTableProps {
  items: ViralItem[]
  results: ViralPublishResult[]
}

export function PublishResultsTable({ items, results }: PublishResultsTableProps) {
  const successCount = results.filter((r) => r.status !== 'failed').length

  return (
    <div className="space-y-4">
      <Card className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border shadow-none">
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle2 className="size-4 text-emerald-500" />
          <span>
            <strong>
              {successCount} de {results.length}
            </strong>{' '}
            vídeos processados com sucesso.
          </span>
        </div>
      </Card>

      <ScrollArea className="border rounded-lg max-h-60">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="text-xs">Vídeo</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs text-right">Ação / Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => {
              const res = results[idx]
              const posterUrl = getViralPosterUrl(item)
              return (
                <TableRow key={item.id}>
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-2">
                      {posterUrl && (
                        <img
                          src={posterUrl}
                          alt=""
                          className="size-7 rounded object-cover border"
                        />
                      )}
                      <span className="font-medium truncate max-w-[200px]">
                        {item.selected_headline || 'Achadinho'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {res?.status === 'scheduled' ? (
                      <Badge
                        variant="outline"
                        className="text-blue-600 border-blue-300 gap-1"
                      >
                        <Clock className="size-3" /> Agendado
                      </Badge>
                    ) : res?.status === 'published' ||
                      res?.status === 'publishing' ||
                      res?.status === 'processing' ? (
                      <Badge
                        variant="outline"
                        className="text-emerald-600 border-emerald-300 gap-1"
                      >
                        <CheckCircle2 className="size-3" /> Publicado
                      </Badge>
                    ) : (
                      <Badge
                        variant="destructive"
                        className="gap-1"
                      >
                        <XCircle className="size-3" /> Falha
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-right">
                    {res?.post_url ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        asChild
                      >
                        <a
                          href={res.post_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver Post <ExternalLink className="size-3" />
                        </a>
                      </Button>
                    ) : res?.error ? (
                      // shadcn-ignore: decorativo
                      <span className="text-[11px] text-destructive truncate max-w-[150px] inline-block">
                        {res.error}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
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
