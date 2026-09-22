import { useState, useMemo } from 'react'
import { AlertCircle, CheckCircle2, Film, Link2, Plus, Trash2, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { VideoTagItem } from './video-tag-item'
import { BulkPasteCard } from './bulk-paste-card'
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

export function serializeItems(items: ViralItemInput[]): string {
  return items
    .map((item) => {
      let line = item.source_url
      if (item.product_code) line += ` #${item.product_code}`
      if (item.manual_headline) line += ` "${item.manual_headline}"`
      return line
    })
    .join('\n')
}

export function UrlParserInput({ value, onChange, error }: UrlParserInputProps) {
  const { items, invalidLines } = useMemo(() => parseUrls(value), [value])
  const [singleInput, setSingleInput] = useState('')
  const [showBulkPaste, setShowBulkPaste] = useState(false)
  const [bulkText, setBulkText] = useState('')

  const handleAddSingle = (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = singleInput.trim()
    if (!trimmed) return

    const { items: newParsed } = parseUrls(trimmed)
    if (newParsed.length > 0) {
      const combined = [...items, ...newParsed]
      onChange(serializeItems(combined), combined)
      setSingleInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddSingle()
    }
  }

  const handleRemoveItem = (indexToRemove: number) => {
    const updated = items.filter((_, idx) => idx !== indexToRemove)
    onChange(serializeItems(updated), updated)
  }

  const handleApplyBulk = () => {
    if (!bulkText.trim()) return
    const { items: newParsed } = parseUrls(bulkText)
    if (newParsed.length > 0) {
      const combined = [...items, ...newParsed]
      onChange(serializeItems(combined), combined)
      setBulkText('')
      setShowBulkPaste(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={singleInput}
              onChange={(e) => setSingleInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Cole a URL do vídeo (ex: https://instagram.com/reels/... #PROD01) e dê Enter"
              className="pl-9 text-xs sm:text-sm font-mono h-10 bg-card/60"
            />
          </div>
          <Button
            type="button"
            onClick={() => handleAddSingle()}
            disabled={!singleInput.trim()}
            className="gap-1.5 shrink-0 h-10 px-4 font-semibold"
          >
            <Plus className="size-4" />
            <span>Adicionar</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowBulkPaste((prev) => !prev)}
            className="gap-1.5 shrink-0 h-10 px-3 text-xs"
            title="Colar múltiplas URLs em lote"
          >
            <FileText className="size-4" />
            <span className="hidden sm:inline">Colar em Massa</span>
          </Button>
        </div>

        {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      </div>

      {showBulkPaste && (
        <BulkPasteCard
          value={bulkText}
          onChange={setBulkText}
          onApply={handleApplyBulk}
          onCancel={() => setShowBulkPaste(false)}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="gap-1.5 font-medium"
          >
            <Film className="size-3" />
            {items.length} {items.length === 1 ? 'vídeo na lista' : 'vídeos na lista'}
          </Badge>
          {items.length > 0 && (
            <Badge
              variant="outline"
              className="hidden sm:inline-flex gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
            >
              <CheckCircle2 className="size-3" />
              Pronto para envio
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {invalidLines.length > 0 && (
            <Badge
              variant="destructive"
              className="gap-1"
            >
              <AlertCircle className="size-3 shrink-0" />
              {invalidLines.length}{' '}
              {invalidLines.length === 1 ? 'linha inválida' : 'linhas inválidas'}
            </Badge>
          )}

          {items.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange('', [])}
              className="h-6 px-2 text-[11px] text-muted-foreground hover:text-destructive gap-1"
            >
              <Trash2 className="size-3" />
              Limpar lista
            </Button>
          )}
        </div>
      </div>

      {items.length > 0 ? (
        <ScrollArea className="max-h-72 rounded-xl border border-border/80 bg-card/40 p-2 sm:p-3">
          <div className="space-y-2">
            {items.map((item, idx) => {
              const itemKey = `${item.source_url}::${item.product_code ?? ''}::${item.manual_headline ?? ''}::item-${idx}`
              return (
                <VideoTagItem
                  key={itemKey}
                  item={item}
                  index={idx}
                  onRemove={handleRemoveItem}
                />
              )
            })}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/20 p-8 text-center space-y-2">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <Film className="size-5" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-foreground">
            Nenhum vídeo adicionado ao lote
          </p>
          <p className="text-[11px] sm:text-xs text-muted-foreground max-w-sm">
            Cole uma URL de Reels, TikTok ou Shorts no campo acima e dê Enter, ou clique em
            &quot;Colar em Massa&quot; para adicionar várias URLs de uma vez.
          </p>
        </div>
      )}
    </div>
  )
}
