import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Plus, X } from 'lucide-react'

interface BulkPasteCardProps {
  value: string
  onChange: (val: string) => void
  onApply: () => void
  onCancel: () => void
}

export function BulkPasteCard({ value, onChange, onApply, onCancel }: BulkPasteCardProps) {
  return (
    <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <FileText className="size-3.5 text-primary" />
          Colagem em Massa (uma URL por linha)
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6 text-muted-foreground"
          onClick={onCancel}
        >
          <X className="size-3.5" />
        </Button>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`https://www.tiktok.com/@user/video/123 #PROD01\nhttps://instagram.com/reels/456 #PROD02 "Título Especial"`}
        className="min-h-[100px] font-mono text-xs resize-y bg-background"
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-xs"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onApply}
          disabled={!value.trim()}
          className="gap-1 text-xs"
        >
          <Plus className="size-3.5" />
          Adicionar URLs em Lote
        </Button>
      </div>
    </div>
  )
}
