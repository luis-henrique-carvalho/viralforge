import { Check, Copy, HelpCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'

export interface QuizData {
  question?: string
  options?: Array<string | { key?: string; label?: string; text?: string }>
}

interface ItemDetailQuizCardProps {
  quizData: QuizData
  copiedKey: string | null
  onCopy: (text: string, key: string, label: string) => void
}

export function ItemDetailQuizCard({ quizData, copiedKey, onCopy }: ItemDetailQuizCardProps) {
  if (!quizData.question) return null

  const handleCopyFullQuiz = () => {
    const lines = (quizData.options || []).map((opt, i) => {
      if (typeof opt === 'string') return `${String.fromCharCode(65 + i)}) ${opt}`
      return `${opt.key || String.fromCharCode(65 + i)}) ${opt.text || opt.label || ''}`
    })
    const fullText = `${quizData.question}\n${lines.join('\n')}`
    onCopy(fullText, 'quiz', 'Quiz completo')
  }

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="p-3.5 pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <HelpCircle className="size-4 text-amber-500" />
          <CardTitle className="text-xs font-semibold">Enquete / Quiz Interativo</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs gap-1"
          onClick={handleCopyFullQuiz}
        >
          {copiedKey === 'quiz' ? (
            <Check className="size-3 text-emerald-500" />
          ) : (
            <Copy className="size-3" />
          )}
          <span>{copiedKey === 'quiz' ? 'Copiado' : 'Copiar'}</span>
        </Button>
      </CardHeader>
      <CardContent className="p-3.5 pt-0 space-y-2">
        <Typography
          variant="small"
          className="font-semibold text-foreground"
        >
          {quizData.question}
        </Typography>
        {quizData.options && quizData.options.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {quizData.options.map((opt, idx) => {
              const keyLabel =
                typeof opt === 'string'
                  ? String.fromCharCode(65 + idx)
                  : opt.key || String.fromCharCode(65 + idx)
              const textLabel = typeof opt === 'string' ? opt : opt.text || opt.label || ''
              return (
                <div
                  key={`quiz-${keyLabel}-${textLabel}`}
                  className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-2.5 py-1.5 text-xs"
                >
                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] size-5 p-0 flex items-center justify-center shrink-0"
                  >
                    {keyLabel}
                  </Badge>
                  <span className="truncate flex-1">{textLabel}</span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
