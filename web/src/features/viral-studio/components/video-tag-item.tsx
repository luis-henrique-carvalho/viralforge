import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tag, X } from 'lucide-react'
import type { ViralItemInput } from '../data/batch.types'

interface VideoTagItemProps {
  item: ViralItemInput
  index: number
  onRemove: (index: number) => void
}

function getPlatformBadge(url: string) {
  const lower = url.toLowerCase()
  if (lower.includes('instagram.com')) {
    return { label: 'Instagram', className: 'border-pink-500/30 bg-pink-500/10 text-pink-500' }
  }
  if (lower.includes('tiktok.com')) {
    return { label: 'TikTok', className: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-500' }
  }
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return { label: 'YouTube', className: 'border-red-500/30 bg-red-500/10 text-red-500' }
  }
  return { label: 'Vídeo', className: 'border-primary/30 bg-primary/10 text-primary' }
}

export function VideoTagItem({ item, index, onRemove }: VideoTagItemProps) {
  const platform = getPlatformBadge(item.source_url)

  return (
    <div className="group flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-xs transition-all hover:border-primary/40 hover:bg-card/90">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span className="font-mono text-[11px] text-muted-foreground shrink-0 font-medium">
          #{index + 1}
        </span>

        <Badge
          variant="outline"
          className={`font-semibold text-[10px] shrink-0 ${platform.className}`}
        >
          {platform.label}
        </Badge>

        <span
          className="font-mono text-xs text-foreground truncate select-all"
          title={item.source_url}
        >
          {item.source_url}
        </span>

        {item.product_code && (
          <Badge
            variant="secondary"
            className="font-mono text-[10px] shrink-0 gap-1 bg-muted/80"
          >
            <Tag className="size-2.5 text-primary" />#{item.product_code}
          </Badge>
        )}

        {item.manual_headline && (
          <span
            className="text-[11px] text-muted-foreground truncate hidden md:inline italic"
            title={item.manual_headline}
          >
            &quot;{item.manual_headline}&quot;
          </span>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(index)}
        className="size-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
        title="Remover vídeo da lista"
        aria-label={`Remover vídeo ${index + 1}`}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  )
}
