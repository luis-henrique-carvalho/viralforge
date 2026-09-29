import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Calendar,
  Compass,
  Layers,
  LayoutTemplate,
  MessageSquareQuote,
  Radio,
  Share2,
} from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Typography } from '@/components/ui/typography'
import { getBrandActiveProvider } from './brand-settings-motor-card'
import type { Brand, PublishingProfileRecord } from '../data/brand.types'

interface BrandCardProps {
  brand: Brand
  videoCount?: number
}

export function BrandCard({ brand, videoCount = 0 }: BrandCardProps) {
  const profiles = (brand.publishing_profiles || {}) as PublishingProfileRecord
  const channelCount = Object.keys(profiles).length
  const activeProvider = getBrandActiveProvider(brand)
  const schedule = brand.posting_schedule || { frequency: 3, slots: ['10:00', '15:00', '20:00'] }
  const keywords = brand.discovery_keywords || []

  const initials =
    (brand.name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'BR'

  return (
    <Card className="flex flex-col justify-between border-border bg-card/60 backdrop-blur-xs transition-all hover:border-primary/40 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <Avatar className="size-11 border border-border">
                {brand.avatar_url && (
                  <AvatarImage
                    src={brand.avatar_url}
                    alt={brand.name}
                  />
                )}
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            </div>
            <div className="space-y-0.5 truncate">
              <CardTitle className="text-base font-semibold truncate text-foreground">
                {brand.name}
              </CardTitle>
              <Typography
                variant="small"
                className="font-mono text-primary font-medium text-xs truncate"
              >
                {brand.handle}
              </Typography>
            </div>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 text-[10px] font-mono capitalize py-0.5 px-1.5 bg-muted/40 gap-1"
          >
            <Radio className="size-2.5 text-emerald-500 animate-pulse" />
            {activeProvider}
          </Badge>
        </div>

        {brand.niche && (
          <div className="pt-2">
            <Badge
              variant="secondary"
              className="text-[11px] font-medium bg-primary/10 text-primary border border-primary/20 line-clamp-1"
            >
              {brand.niche}
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pb-3 text-xs">
        {/* Resumo Operacional em Pílulas */}
        <Card className="bg-muted/30 border-border/40 p-2">
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                <Share2 className="size-2.5" /> Canais
              </span>
              <span className="text-xs font-semibold text-foreground">
                {channelCount > 0 ? `${channelCount} ativos` : '0'}
              </span>
            </div>
            <div className="space-y-0.5 border-x border-border/40">
              <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                <Layers className="size-2.5" /> Vídeos
              </span>
              <span className="text-xs font-semibold text-foreground">{videoCount}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                <Calendar className="size-2.5" /> Grade
              </span>
              <span className="text-xs font-semibold text-foreground">
                {schedule.frequency || schedule.slots?.length || 3}x/dia
              </span>
            </div>
          </div>
        </Card>

        {/* CTA Padrão */}
        <div className="space-y-1">
          <span className="text-muted-foreground flex items-center gap-1 font-medium text-[11px]">
            <MessageSquareQuote className="size-3 text-muted-foreground" />
            CTA Padrão:
          </span>
          <Typography
            variant="muted"
            className="line-clamp-1 rounded-md bg-muted/20 px-2 py-1 text-foreground text-[11px] font-normal"
          >
            {brand.default_cta || 'Nenhum CTA padrão configurado.'}
          </Typography>
        </div>

        {/* Discovery Keywords */}
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {keywords.slice(0, 3).map((kw) => (
              <span
                key={kw}
                className="text-[10px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded"
              >
                #{kw.replace(/^#/, '')}
              </span>
            ))}
            {keywords.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{keywords.length - 3}</span>
            )}
          </div>
        )}

        {/* Template info */}
        <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[11px]">
          <span className="inline-flex items-center gap-1 text-muted-foreground font-mono">
            <LayoutTemplate className="size-3" />
            {brand.template_id}
          </span>
          <span className="font-mono text-muted-foreground">ID: {brand.id}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-2 border-t border-border/40 gap-2">
        <Button
          asChild
          className="flex-1 gap-1.5 text-xs shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
          size="sm"
        >
          <Link
            to="/brands/$brandId"
            params={{ brandId: brand.id }}
          >
            Acessar Workspace
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          title="Abrir no Discovery"
        >
          <Link
            to="/discovery"
            search={{ brand_id: brand.id }}
          >
            <Compass className="size-3.5" />
            Discovery
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
