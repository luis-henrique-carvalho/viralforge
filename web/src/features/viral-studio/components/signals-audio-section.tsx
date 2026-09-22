import { useState } from 'react'
import { Check, Copy, Mic, Music } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

interface SignalsAudioSectionProps {
  transcript: string
  transcriptWords?: number
}

export function SignalsAudioSection({ transcript, transcriptWords }: SignalsAudioSectionProps) {
  const [copied, setCopied] = useState(false)
  const hasSpeech = Boolean(transcript && transcript.trim().length > 0)
  const wordCount =
    transcriptWords || (hasSpeech ? transcript.trim().split(/\s+/).filter(Boolean).length : 0)

  const handleCopy = () => {
    if (!transcript) return
    navigator.clipboard.writeText(transcript)
    setCopied(true)
    toast.success('Transcrição de áudio copiada!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="bg-card/60 border-border/80">
      <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2 flex-wrap">
          <CardTitle className="text-xs font-semibold text-foreground">
            Transcrição de Áudio
          </CardTitle>
          {hasSpeech ? (
            <Badge
              variant="outline"
              className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] py-0"
            >
              <Mic className="size-3" />
              Fala detectada ({wordCount} palavras)
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] py-0"
            >
              <Music className="size-3" />
              Instrumental / Sem fala
            </Badge>
          )}
        </div>

        {hasSpeech && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-[11px] gap-1"
            onClick={handleCopy}
            title="Copiar Transcrição"
          >
            {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-3 pt-1">
        {hasSpeech ? (
          <ScrollArea className="max-h-28 rounded-md border border-border/60 bg-muted/30 p-2.5 text-xs text-foreground/90 leading-relaxed">
            {transcript}
          </ScrollArea>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Nenhuma faixa de voz identificada no áudio (conteúdo com trilha sonora ou ruído
            ambiente).
          </p>
        )}
      </CardContent>
    </Card>
  )
}
