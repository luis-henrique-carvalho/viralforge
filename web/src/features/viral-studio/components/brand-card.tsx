import { Edit, LayoutTemplate, MessageSquareQuote, Share2 } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Typography } from '@/components/ui/typography'
import type { Brand, SocialChannelBinding } from '../data/batch.types'

interface BrandCardProps {
  brand: Brand
  onEdit: (brand: Brand) => void
}

export function BrandCard({ brand, onEdit }: BrandCardProps) {
  const profiles = (brand.publishing_profiles || {}) as Record<string, SocialChannelBinding>
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
    <Card className="flex flex-col justify-between border-border bg-card/60 backdrop-blur-xs transition-all hover:border-primary/40">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-10 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5 truncate">
            <CardTitle className="text-base font-semibold truncate text-foreground">
              {brand.name}
            </CardTitle>
            <Typography
              variant="small"
              className="font-mono text-primary font-medium"
            >
              {brand.handle}
            </Typography>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3 text-xs">
        <div className="space-y-1">
          <span className="text-muted-foreground flex items-center gap-1 font-medium">
            <MessageSquareQuote className="size-3.5 text-muted-foreground" />
            CTA Padrão:
          </span>
          <Typography
            variant="muted"
            className="line-clamp-2 rounded-md bg-muted/40 p-2 text-foreground font-normal"
          >
            {brand.default_cta || 'Nenhum CTA padrão configurado.'}
          </Typography>
        </div>

        <div className="space-y-1.5 pt-1">
          <span className="text-muted-foreground flex items-center gap-1 font-medium">
            <Share2 className="size-3.5 text-muted-foreground" />
            Canais Vinculados:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(profiles).length > 0 ? (
              Object.entries(profiles).map(([platform, channel]: [string, any]) => (
                <Badge
                  key={platform}
                  variant="secondary"
                  className="gap-1 text-[10px] font-mono capitalize py-0.5 px-2 bg-primary/10 text-primary border border-primary/20"
                >
                  <span className="font-bold">{platform}:</span>
                  <span className="truncate max-w-[120px]">
                    {channel?.name || channel?.account_id}
                  </span>
                </Badge>
              ))
            ) : (
              <span className="text-[11px] text-muted-foreground italic">
                Nenhum canal vinculado
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <Badge
            variant="outline"
            className="gap-1 font-mono text-[11px]"
          >
            <LayoutTemplate className="size-3" />
            {brand.template_id}
          </Badge>
          <span className="font-mono text-[11px] text-muted-foreground">ID: {brand.id}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-2 border-t border-border/40">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 text-xs"
          onClick={() => onEdit(brand)}
        >
          <Edit className="size-3.5" />
          Editar Perfil
        </Button>
      </CardFooter>
    </Card>
  )
}
