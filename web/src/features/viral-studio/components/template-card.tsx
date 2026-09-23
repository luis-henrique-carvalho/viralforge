// shadcn-ignore: layout
import { Copy, Edit3, Lock, MoreVertical, Sparkles, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Typography } from '@/components/ui/typography'
import type { VisualTemplate } from '../data/template.types'

interface TemplateCardProps {
  template: VisualTemplate
  onOpen: (template: VisualTemplate) => void
  onDuplicate: (template: VisualTemplate) => void
  onDelete?: (template: VisualTemplate) => void
}

const NICHE_LABELS: Record<string, string> = {
  curiosities: 'Curiosidades',
  affiliate: 'Achadinhos',
  news: 'Notícias & Fatos',
  tech: 'Tech & Gadgets',
  custom: 'Personalizado',
}

const GOAL_LABELS: Record<string, string> = {
  engagement: 'Engajamento Puro',
  affiliate: 'Monetização Afiliado',
  lead_capture: 'Captura de Leads',
  keyword_direct: 'Comentário Direto',
  infoproduct: 'Infoproduto',
}

export function TemplateCard({ template, onOpen, onDuplicate, onDelete }: TemplateCardProps) {
  const isSystem = template.is_system
  const nicheLabel = NICHE_LABELS[template.niche_type] || template.niche_type
  const goalLabel = GOAL_LABELS[template.conversion_goal] || template.conversion_goal

  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden border-border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-lg">
      <div
        className="flex h-36 w-full items-center justify-center p-4"
        style={{ backgroundColor: template.background_color }}
      >
        <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border/40 bg-background/80 p-2.5 text-center shadow-sm backdrop-blur-sm">
          {template.badge_enabled && template.custom_badge_text && (
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-bold"
              style={{
                backgroundColor: template.custom_badge_bg_color,
                color: template.custom_badge_text_color,
              }}
            >
              {template.custom_badge_text}
            </span>
          )}
          <span
            className="line-clamp-1 max-w-[140px] text-xs font-black tracking-tight"
            style={{ color: template.headline_color }}
          >
            {template.name}
          </span>
          <div className="flex items-center gap-1">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: template.video_border_color }}
            />
            <Typography
              variant="small"
              className="text-[10px] text-muted-foreground"
            >
              {template.video_aspect.toUpperCase()} • {template.video_fit}
            </Typography>
          </div>
        </div>
      </div>

      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {isSystem ? (
                <Badge
                  variant="secondary"
                  className="gap-1 bg-primary/10 text-primary border-primary/20 text-[10px]"
                >
                  <Lock className="h-3 w-3" />
                  FÁBRICA
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-[10px]"
                >
                  CUSTOM
                </Badge>
              )}
              <Badge
                variant="outline"
                className="text-[10px]"
              >
                {nicheLabel}
              </Badge>
            </div>
            <CardTitle className="text-base font-semibold leading-tight line-clamp-1 mt-1">
              {template.name}
            </CardTitle>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Opções do template</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onOpen(template)}>
                <Edit3 className="mr-2 h-4 w-4" />
                Editar no Estúdio
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(template)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar Template
              </DropdownMenuItem>
              {!isSystem && onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(template)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CardDescription className="line-clamp-2 text-xs text-muted-foreground pt-1">
          {template.persona_role}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 pt-1 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <Badge
            variant="secondary"
            className="text-[10px] font-normal"
          >
            <Sparkles className="mr-1 h-3 w-3 text-amber-500" />
            {goalLabel}
          </Badge>
          <Badge
            variant="secondary"
            className="text-[10px] font-normal"
          >
            {template.generation_tasks?.length || 0} Tarefas IA
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border/50 p-3 bg-muted/20">
        <Typography
          variant="small"
          className="text-[11px] text-muted-foreground"
        >
          {template.width}×{template.height} (9:16)
        </Typography>
        <Button
          size="sm"
          onClick={() => onOpen(template)}
          className="h-8 text-xs font-medium"
        >
          <Edit3 className="mr-1.5 h-3.5 w-3.5" />
          Estúdio 9:16
        </Button>
      </CardFooter>
    </Card>
  )
}
