import { Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'

export function DiscoveryInitialState() {
  return (
    <Card className="border-dashed border-border/80 bg-card/30 p-12 text-center space-y-4">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
        <Sparkles className="size-7" />
      </div>
      <div className="space-y-1">
        <Typography variant="h3">Mineração Inteligente de Conteúdo</Typography>
        <Typography
          variant="muted"
          className="max-w-md mx-auto"
        >
          Pesquise qualquer palavra-chave para extrair os vídeos mais virais do TikTok, Instagram
          Reels e YouTube Shorts.
        </Typography>
      </div>
    </Card>
  )
}
