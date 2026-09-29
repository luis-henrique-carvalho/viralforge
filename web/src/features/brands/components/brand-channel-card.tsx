import { ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export function BrandChannelCard({ channel }: { channel: SocialChannel }) {
  const platformLower = (channel.platform || 'other').toLowerCase()
  const colors = PLATFORM_COLORS[platformLower] || {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
  }

  return (
    <Card className="border-border bg-card/60 backdrop-blur-xs transition-all hover:border-primary/30">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={`text-[10px] font-mono capitalize px-2 py-0.5 ${colors.bg} ${colors.text} ${colors.border}`}
          >
            {channel.platform}
          </Badge>
          <Badge
            variant={channel.connected !== false ? 'secondary' : 'destructive'}
            className="text-[10px] gap-1 px-1.5 py-0.5"
          >
            <ShieldCheck className="size-3 text-emerald-500" />
            {channel.connected !== false ? 'Conectado' : 'Desconectado'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-11 border border-border">
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
          <div className="space-y-0.5 truncate">
            <CardTitle className="text-sm font-semibold truncate text-foreground">
              {channel.name}
            </CardTitle>
            {channel.handle && (
              <Typography
                variant="muted"
                className="font-mono text-[11px] truncate"
              >
                {channel.handle.startsWith('@') ? channel.handle : `@${channel.handle}`}
              </Typography>
            )}
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/40 flex items-center justify-between font-mono">
          <span className="truncate max-w-[180px]">ID: {channel.id}</span>
          <span className="capitalize">{channel.provider || 'postiz'}</span>
        </div>
      </CardContent>
    </Card>
  )
}
