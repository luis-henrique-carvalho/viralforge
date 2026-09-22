import { useState } from 'react'
import { Check, Copy, Eye, Heart, MessageSquare, Repeat } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export interface PostMetadata {
  title?: string
  uploader?: string
  caption?: string
  tags?: string[]
  viewCount?: number | null
  likeCount?: number | null
  commentCount?: number | null
  repostCount?: number | null
}

interface SignalsMetadataSectionProps {
  metadata: PostMetadata
}

function formatCompactNumber(num?: number | null): string | null {
  if (num == null || isNaN(num)) return null
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return num.toLocaleString('pt-BR')
}

export function SignalsMetadataSection({ metadata }: SignalsMetadataSectionProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyCaption = () => {
    if (!metadata.caption) return
    navigator.clipboard.writeText(metadata.caption)
    setCopied(true)
    toast.success('Legenda original copiada!')
    setTimeout(() => setCopied(false), 2000)
  }

  const viewsFormatted = formatCompactNumber(metadata.viewCount)
  const likesFormatted = formatCompactNumber(metadata.likeCount)
  const commentsFormatted = formatCompactNumber(metadata.commentCount)
  const repostsFormatted = formatCompactNumber(metadata.repostCount)

  const hasMetrics = Boolean(
    viewsFormatted || likesFormatted || commentsFormatted || repostsFormatted,
  )

  return (
    <Card className="bg-card/60 border-border/80">
      <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-semibold text-foreground">
          Metadados do Post Original
        </CardTitle>
        {metadata.caption && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-[11px] gap-1"
            onClick={handleCopyCaption}
            title="Copiar Legenda Original"
          >
            {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
            <span>{copied ? 'Copiado' : 'Copiar Legenda'}</span>
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-3 pt-1 space-y-2 text-xs">
        {metadata.title && (
          <div>
            <span className="font-semibold text-muted-foreground mr-1">Título:</span>
            <span className="text-foreground">{metadata.title}</span>
          </div>
        )}

        {metadata.uploader && (
          <div>
            <span className="font-semibold text-muted-foreground mr-1">Autor / Canal:</span>
            <span className="text-primary font-medium">{metadata.uploader}</span>
          </div>
        )}

        {hasMetrics && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {viewsFormatted && (
              <Badge
                variant="secondary"
                className="gap-1 text-[10px] font-normal"
              >
                <Eye className="size-3 text-primary" />
                {viewsFormatted} visualizações
              </Badge>
            )}
            {likesFormatted && (
              <Badge
                variant="secondary"
                className="gap-1 text-[10px] font-normal"
              >
                <Heart className="size-3 text-rose-500" />
                {likesFormatted} curtidas
              </Badge>
            )}
            {commentsFormatted && (
              <Badge
                variant="secondary"
                className="gap-1 text-[10px] font-normal"
              >
                <MessageSquare className="size-3 text-sky-500" />
                {commentsFormatted} comentários
              </Badge>
            )}
            {repostsFormatted && (
              <Badge
                variant="secondary"
                className="gap-1 text-[10px] font-normal"
              >
                <Repeat className="size-3 text-emerald-500" />
                {repostsFormatted} compartilhamentos
              </Badge>
            )}
          </div>
        )}

        {metadata.caption && (
          <div className="space-y-1 pt-1">
            <span className="font-semibold text-muted-foreground block text-[11px]">
              Descrição Original:
            </span>
            <div className="max-h-20 overflow-y-auto rounded-md border border-border/60 bg-muted/30 p-2 text-xs text-foreground/85 leading-relaxed">
              {metadata.caption}
            </div>
          </div>
        )}

        {metadata.tags && metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {metadata.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-[10px] text-primary/80 border-primary/20 bg-primary/5 px-1.5 py-0"
              >
                {tag.startsWith('#') ? tag : `#${tag}`}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
