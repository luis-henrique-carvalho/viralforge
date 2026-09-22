import { useMemo } from 'react'
import { AlertCircle, CheckCircle2, Film, Link2, Tag } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import type { ViralItemInput } from '../data/batch.types'

interface UrlParserInputProps {
  value: string
  onChange: (rawText: string, parsedItems: ViralItemInput[]) => void
  error?: string
}

export function parseUrls(text: string): { items: ViralItemInput[]; invalidLines: string[] } {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const items: ViralItemInput[] = []
  const invalidLines: string[] = []

  for (const line of lines) {
    // Check if line contains a URL
    const parts = line.split(/\s+/)
    const url = parts[0]

    if (!url || !url.match(/^https?:\/\/.+/i)) {
      invalidLines.push(line)
      continue
    }

    let productCode: string | null = null
    let manualHeadline: string | null = null

    if (parts.length > 1) {
      const second = parts[1]
      if (second.startsWith('#')) {
        productCode = second.replace(/^#/, '') || null
        if (parts.length > 2) {
          manualHeadline =
            parts
              .slice(2)
              .join(' ')
              .replace(/^["']|["']$/g, '') || null
        }
      } else if (second.startsWith('"') || second.startsWith("'")) {
        // Direct headline in quotes without product code
        manualHeadline =
          parts
            .slice(1)
            .join(' ')
            .replace(/^["']|["']$/g, '') || null
      } else {
        productCode = second
        if (parts.length > 2) {
          manualHeadline =
            parts
              .slice(2)
              .join(' ')
              .replace(/^["']|["']$/g, '') || null
        }
      }
    }

    items.push({
      source_url: url,
      product_code: productCode,
      manual_headline: manualHeadline,
      product_url: null,
      additional_instructions: null,
      model: null,
    })
  }

  return { items, invalidLines }
}

export function UrlParserInput({ value, onChange, error }: UrlParserInputProps) {
  const { items, invalidLines } = useMemo(() => parseUrls(value), [value])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    const { items: newItems } = parseUrls(text)
    onChange(text, newItems)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Textarea
          value={value}
          onChange={handleTextChange}
          placeholder={`Cole uma URL por linha. Exemplos:\nhttps://www.tiktok.com/@user/video/12345 #PROD01 "Título Opcional"\nhttps://youtube.com/shorts/abcdef123 #PROD02`}
          className="min-h-[160px] font-mono text-xs leading-relaxed resize-y"
        />
        {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      </div>

      {/* Parser Summary & Live Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 p-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <Film className="size-4 text-primary" />
            {items.length} {items.length === 1 ? 'vídeo detectado' : 'vídeos detectados'}
          </span>

          {invalidLines.length > 0 && (
            <span className="flex items-center gap-1 text-destructive font-medium">
              <AlertCircle className="size-3.5" />
              {invalidLines.length}{' '}
              {invalidLines.length === 1 ? 'linha inválida' : 'linhas inválidas'}
            </span>
          )}
        </div>

        {items.length > 0 && (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="size-3.5" />
            Pronto para submissão
          </span>
        )}
      </div>

      {/* List Preview */}
      {items.length > 0 && (
        <div className="max-h-40 overflow-y-auto space-y-1.5 rounded-lg border border-border/60 bg-card/50 p-2">
          {items.map((item, idx) => (
            <div
              key={`${item.source_url}-${item.product_code || idx}`}
              className="flex items-center justify-between gap-2 rounded-md bg-muted/30 px-2.5 py-1.5 text-[11px]"
            >
              <div className="flex items-center gap-2 truncate">
                <Link2 className="size-3 text-muted-foreground shrink-0" />
                <span className="truncate font-mono">{item.source_url}</span>
              </div>
              {item.product_code && (
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] shrink-0 gap-1"
                >
                  <Tag className="size-2.5 text-primary" />#{item.product_code}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
