import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  ChevronDown,
  Compass,
  LayoutTemplate,
  Plus,
  Radio,
  Sparkles,
  Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Typography } from '@/components/ui/typography'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BrandManualBatchDialog } from './brand-manual-batch-dialog'
import type { Brand } from '../data/brand.types'

interface BrandWorkspaceHeaderProps {
  brand: Brand
  activeProvider: string
  onSwitchToTab?: (tab: string) => void
}

export function BrandWorkspaceHeader({ brand, activeProvider }: BrandWorkspaceHeaderProps) {
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false)

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
    <>
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card/60 p-5 backdrop-blur-xs shadow-sm">
        {/* Breadcrumb / Back Action */}
        <div className="flex items-center justify-between">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-2 text-xs text-muted-foreground hover:text-foreground -ml-2"
          >
            <Link to="/brands">
              <ArrowLeft className="size-4" />
              Voltar para Perfis de Marca
            </Link>
          </Button>

          <Badge
            variant="outline"
            className="gap-1.5 font-mono text-xs capitalize py-1 px-2.5 bg-muted/40"
          >
            <Radio className="size-3 text-emerald-500 animate-pulse" />
            Motor Ativo: {activeProvider}
          </Badge>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative">
              <Avatar className="size-16 sm:size-20 border-2 border-border shadow-inner">
                {brand.avatar_url && (
                  <AvatarImage
                    src={brand.avatar_url}
                    alt={brand.name}
                  />
                )}
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg sm:text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-1 right-1 size-3 rounded-full bg-emerald-500 ring-2 ring-background" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Typography
                  variant="h2"
                  as="h1"
                  className="text-xl sm:text-2xl font-bold tracking-tight"
                >
                  {brand.name}
                </Typography>
                <Badge
                  variant="secondary"
                  className="font-mono text-xs text-primary bg-primary/10 border border-primary/20"
                >
                  {brand.handle}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-0.5">
                {brand.niche && (
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Sparkles className="size-3.5 text-amber-500" />
                    {brand.niche}
                  </span>
                )}
                <span className="flex items-center gap-1 font-mono">
                  <LayoutTemplate className="size-3.5 text-muted-foreground" />
                  Template: {brand.template_id}
                </span>
                {brand.default_affiliate_url && (
                  <span className="truncate max-w-[200px] text-muted-foreground hidden md:inline">
                    Afiliado: {brand.default_affiliate_url}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Button: Novo Lote */}
          <div className="flex items-center gap-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2 shadow-sm font-medium">
                  <Plus className="size-4" />
                  Novo Lote de Vídeos
                  <ChevronDown className="size-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56"
              >
                <DropdownMenuItem asChild>
                  <Link
                    to="/discovery"
                    search={{ brand_id: brand.id }}
                    className="gap-2 cursor-pointer"
                  >
                    <Compass className="size-4 text-primary" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs">Minerar no Discovery</span>
                      <span className="text-[10px] text-muted-foreground">
                        Pesquisar vídeos virais por nicho
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsManualDialogOpen(true)}
                  className="gap-2 cursor-pointer"
                >
                  <Video className="size-4 text-emerald-500" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs">Inserir Links Manuais</span>
                    <span className="text-[10px] text-muted-foreground">
                      Colar URLs do TikTok/Reels/Shorts
                    </span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <BrandManualBatchDialog
        isOpen={isManualDialogOpen}
        onClose={() => setIsManualDialogOpen(false)}
        brand={brand}
      />
    </>
  )
}
