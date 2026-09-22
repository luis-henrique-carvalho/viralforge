import { Edit, LayoutTemplate, MessageSquareQuote } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Brand } from '../data/batch.types'

interface BrandCardProps {
  brand: Brand
  onEdit: (brand: Brand) => void
}

export function BrandCard({ brand, onEdit }: BrandCardProps) {
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
            <p className="font-mono text-xs text-primary font-medium">{brand.handle}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3 text-xs">
        <div className="space-y-1">
          <span className="text-muted-foreground flex items-center gap-1 font-medium">
            <MessageSquareQuote className="size-3.5 text-muted-foreground" />
            CTA Padrão:
          </span>
          <p className="line-clamp-2 rounded-md bg-muted/40 p-2 text-foreground font-normal">
            {brand.default_cta || 'Nenhum CTA padrão configurado.'}
          </p>
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
