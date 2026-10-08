import { useState } from 'react'
import { Check, Copy, MessageSquare, Sparkles, Tag, Type } from 'lucide-react'
import { TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { toast } from 'sonner'
import { ItemDetailQuizCard, type QuizData } from './item-detail-quiz-card'
import { ItemDetailGenericTaskCard } from './item-detail-generic-task-card'
import type { ViralItem } from '../data/batch.types'

export interface ItemDetailAiTasksTabProps {
  item: ViralItem
}

function resolveTaskFields(item: ViralItem) {
  const customOutputs = (item.ai_copy?.custom_outputs || {}) as Record<string, unknown>
  const badgeText =
    item.badge_text ||
    (customOutputs.badge_text as string | undefined) ||
    (customOutputs.canvas_badge as string | undefined)
  const footerText =
    item.footer_text ||
    (customOutputs.footer_text as string | undefined) ||
    (customOutputs.canvas_extra_image as string | undefined)
  const socialTitle =
    item.social_title ||
    item.ai_copy?.social_title ||
    (customOutputs.social_title as string | undefined) ||
    (customOutputs.post_title as string | undefined)
  const quizData = (customOutputs.quiz || customOutputs.poll || customOutputs.enquete) as
    QuizData | undefined

  const standardKeys = new Set([
    'badge_text',
    'canvas_badge',
    'footer_text',
    'canvas_extra_image',
    'social_title',
    'post_title',
    'quiz',
    'poll',
    'enquete',
  ])
  const otherTaskEntries = Object.entries(customOutputs).filter(
    ([k, v]) => !standardKeys.has(k) && v !== null && v !== undefined && v !== '',
  )

  return { badgeText, footerText, socialTitle, quizData, otherTaskEntries }
}

export function ItemDetailAiTasksTab({ item }: ItemDetailAiTasksTabProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const copyToClipboard = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success(`${label} copiado!`)
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr))
    }, 2000)
  }

  const { badgeText, footerText, socialTitle, quizData, otherTaskEntries } = resolveTaskFields(item)
  const hasAnyTasks =
    Boolean(badgeText) ||
    Boolean(footerText) ||
    Boolean(socialTitle) ||
    Boolean(quizData?.question) ||
    otherTaskEntries.length > 0

  return (
    <TabsContent
      value="tasks"
      className="m-0 space-y-4 focus:outline-none"
    >
      {!hasAnyTasks && (
        <Card className="border-dashed border-border/80 bg-muted/20">
          <CardContent className="p-8 text-center space-y-2">
            <Sparkles className="size-8 mx-auto text-muted-foreground/50" />
            <Typography
              variant="small"
              className="font-medium text-foreground"
            >
              Nenhuma tarefa de IA gerada
            </Typography>
            <Typography variant="muted">
              Configure tarefas adicionais no seu template de vídeo para gerar ganchos visuais,
              enquetes e títulos dinâmicos.
            </Typography>
          </CardContent>
        </Card>
      )}

      {badgeText && (
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-3.5 pb-2 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Tag className="size-4 text-rose-500" />
              <CardTitle className="text-xs font-semibold">Badge Dinâmico do Canvas</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs gap-1"
              onClick={() => copyToClipboard(badgeText, 'badge', 'Badge')}
            >
              {copiedKey === 'badge' ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-3" />
              )}
              <span>{copiedKey === 'badge' ? 'Copiado' : 'Copiar'}</span>
            </Button>
          </CardHeader>
          <CardContent className="p-3.5 pt-0 flex items-center gap-2">
            <Badge
              variant="secondary"
              className="font-bold text-xs px-2.5 py-0.5 tracking-wide"
            >
              {badgeText}
            </Badge>
          </CardContent>
        </Card>
      )}

      {footerText && (
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-3.5 pb-2 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-emerald-500" />
              <CardTitle className="text-xs font-semibold">Texto de Rodapé / Comentário</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs gap-1"
              onClick={() => copyToClipboard(footerText, 'footer', 'Texto de rodapé')}
            >
              {copiedKey === 'footer' ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-3" />
              )}
              <span>{copiedKey === 'footer' ? 'Copiado' : 'Copiar'}</span>
            </Button>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            {/* shadcn-ignore: layout container */}
            <div className="rounded-md border border-border/70 bg-muted/30 p-2.5 text-xs text-foreground font-medium">
              {footerText}
            </div>
          </CardContent>
        </Card>
      )}

      {socialTitle && (
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-3.5 pb-2 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Type className="size-4 text-primary" />
              <CardTitle className="text-xs font-semibold">
                Título Social (YouTube Shorts / TikTok)
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs gap-1"
              onClick={() => copyToClipboard(socialTitle, 'social_title', 'Título social')}
            >
              {copiedKey === 'social_title' ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-3" />
              )}
              <span>{copiedKey === 'social_title' ? 'Copiado' : 'Copiar'}</span>
            </Button>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <Typography
              variant="small"
              className="font-medium text-foreground"
            >
              {socialTitle}
            </Typography>
          </CardContent>
        </Card>
      )}

      {quizData && (
        <ItemDetailQuizCard
          quizData={quizData}
          copiedKey={copiedKey}
          onCopy={copyToClipboard}
        />
      )}

      {otherTaskEntries.map(([key, val]) => (
        <ItemDetailGenericTaskCard
          key={key}
          taskKey={key}
          val={val}
          copiedKey={copiedKey}
          onCopy={copyToClipboard}
        />
      ))}
    </TabsContent>
  )
}
