import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { ExternalLink, Eye, Flame, Heart, MessageSquare, Share2 } from 'lucide-react'
import type { DiscoveryItem } from '../data/discovery.types'

export interface DiscoveryVideoCardProps {
  item: DiscoveryItem
  isSelected: boolean
  onToggleSelect: (item: DiscoveryItem) => void
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`
  return String(num)
}

function formatDuration(seconds?: number | null): string | null {
  if (!seconds) return null
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins > 0 ? `${mins}m ` : ''}${secs}s`
}

export function DiscoveryVideoCard({ item, isSelected, onToggleSelect }: DiscoveryVideoCardProps) {
  const duration = formatDuration(item.duration_seconds)

  return (
    <Card
      className={`group relative flex flex-col rounded-[18px] border border-border/70 bg-card/85 backdrop-blur-xs py-0 gap-0 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-xl hover:shadow-black/25 hover:-translate-y-0.5 w-full overflow-hidden cursor-pointer ${
        isSelected ? 'ring-2 ring-primary border-primary' : ''
      }`}
      onClick={() => onToggleSelect(item)}
    >
      <div className="p-2 pb-0">
        <div className="relative aspect-[9/16] w-full rounded-xl overflow-hidden bg-zinc-950 flex items-center justify-center border border-border/50">
          {item.thumbnail_url ? (
            <img
              src={item.thumbnail_url}
              alt={item.title || 'Miniatura'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="text-muted-foreground text-xs flex flex-col items-center gap-1">
              <Flame className="size-8 text-primary/40" />
              <Typography variant="muted">Vídeo 9:16</Typography>
            </div>
          )}

          <div
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none"
            aria-hidden="true"
          />

          {/* Top badges bar */}
          <div
            className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1.5 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1.5">
              <div className="bg-black/60 backdrop-blur-md rounded-md p-1 border border-white/20 flex items-center justify-center shadow-xs">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect(item)}
                  aria-label={`Selecionar vídeo ${item.id}`}
                  className="size-4 border-white/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </div>

              {item.already_imported && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-5 bg-emerald-500/80 text-white font-semibold backdrop-blur-md border border-white/20 shadow-xs"
                >
                  {item.imported_batch_id ? `Já no Lote #${item.imported_batch_id}` : 'Já no Lote'}
                </Badge>
              )}
            </div>

            <Badge
              variant="default"
              className="gap-1 font-bold text-[11px] py-0.5 px-2 h-6 bg-gradient-to-r from-amber-500 to-rose-600 text-white border-0 shadow-md"
            >
              <Flame className="size-3 fill-current" />
              <span>{Math.round(item.virality_score)} Score</span>
            </Badge>
          </div>

          {/* Bottom stats inside video overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[11px] pointer-events-none">
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 font-mono">
              <Eye className="size-3 text-cyan-400" />
              <span>{formatNumber(item.view_count)}</span>
            </div>

            {duration && (
              <span className="bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-white/10 font-mono text-[10px] text-zinc-300">
                {duration}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-3 flex flex-col gap-2 mt-auto">
        <Typography
          variant="small"
          className="line-clamp-2 text-foreground font-semibold leading-snug"
          title={item.title}
        >
          {item.title || 'Sem legenda'}
        </Typography>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
          <span className="truncate max-w-[140px] font-medium text-foreground/80">
            {item.author_handle || item.author_name || 'Criador'}
          </span>

          <div
            className="flex items-center gap-2 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1 text-muted-foreground">
              <Heart className="size-3 text-rose-500" />
              <span>{formatNumber(item.like_count)}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageSquare className="size-3 text-blue-400" />
              <span>{formatNumber(item.comment_count)}</span>
            </div>
            {item.share_count > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Share2 className="size-3 text-emerald-400" />
                <span>{formatNumber(item.share_count)}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon-xs"
              className="size-6 p-0 text-muted-foreground hover:text-foreground"
              asChild
            >
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                title="Abrir vídeo original"
              >
                <ExternalLink className="size-3" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
