import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Typography } from '@/components/ui/typography'
import type { SocialChannel } from '../data/batch.types'

const PLATFORM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  tiktok: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  instagram: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
  youtube: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  threads: { bg: 'bg-zinc-500/10', text: 'text-zinc-300', border: 'border-zinc-500/20' },
  facebook: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
}

interface BrandChannelRowProps {
  channel: SocialChannel
  isSelected: boolean
  onToggle: (id: string) => void
  currentBrandId?: string
}

export function BrandChannelRow({
  channel,
  isSelected,
  onToggle,
  currentBrandId,
}: BrandChannelRowProps) {
  const platformLower = (channel.platform || 'other').toLowerCase()
  const colors = PLATFORM_COLORS[platformLower] || {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
  }

  const isBoundToOtherBrand =
    Boolean(channel.bound_to_brand_id) &&
    Boolean(currentBrandId) &&
    channel.bound_to_brand_id !== currentBrandId

  return (
    <div
      onClick={() => onToggle(channel.id)}
      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'border-primary/60 bg-primary/5 shadow-xs'
          : 'border-border/70 hover:border-border hover:bg-card/50'
      }`}
    >
      <div className="flex items-center gap-3 truncate">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggle(channel.id)}
          className="data-[state=checked]:bg-primary"
          onClick={(e) => e.stopPropagation()}
        />

        <Avatar className="size-9 border border-border shrink-0">
          {channel.avatar_url && (
            <AvatarImage
              src={channel.avatar_url}
              alt={channel.name}
            />
          )}
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
            {channel.name?.slice(0, 2).toUpperCase() || 'CH'}
          </AvatarFallback>
        </Avatar>

        <div className="truncate space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Typography
              variant="p"
              className="font-medium text-xs truncate text-foreground"
            >
              {channel.name}
            </Typography>
            <Badge
              variant="outline"
              className={`text-[9px] px-1.5 py-0 capitalize ${colors.bg} ${colors.text} ${colors.border}`}
            >
              {channel.platform}
            </Badge>

            {channel.group_name && (
              <Badge
                variant="secondary"
                className="text-[9px] px-1.5 py-0 font-normal text-muted-foreground border-border/60 bg-secondary/50"
              >
                📁 {channel.group_name}
              </Badge>
            )}

            {isBoundToOtherBrand && (
              <Badge
                variant="outline"
                className="text-[9px] px-1.5 py-0 font-normal text-amber-500 border-amber-500/30 bg-amber-500/10"
              >
                Em: {channel.bound_to_brand_name || 'Outra Marca'}
              </Badge>
            )}
          </div>
          {channel.handle && (
            <Typography
              variant="muted"
              className="font-mono text-[10px] truncate block"
            >
              {channel.handle.startsWith('@') ? channel.handle : `@${channel.handle}`}
            </Typography>
          )}
        </div>
      </div>

      <span className="text-[10px] font-mono text-muted-foreground shrink-0 pl-2">
        {channel.id.slice(0, 10)}...
      </span>
    </div>
  )
}
