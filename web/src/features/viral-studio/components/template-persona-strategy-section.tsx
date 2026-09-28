import { useState } from 'react'
import { Bot, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Typography } from '@/components/ui/typography'
import type { VisualTemplate } from '../data/template.types'

interface TemplatePersonaStrategySectionProps {
  template: VisualTemplate
  onChange: (field: keyof VisualTemplate, value: unknown) => void
}

export function TemplatePersonaStrategySection({
  template,
  onChange,
}: TemplatePersonaStrategySectionProps) {
  const [quickProposal, setQuickProposal] = useState('')

  const handleEnhanceWithAI = () => {
    if (!quickProposal.trim()) return
    const text = quickProposal.trim()
    const persona = `Especialista e criador de conteúdo focado em: ${text}`
    const tone = 'Dinâmico, envolvente, autêntico e focado em alta retenção'
    const cta = 'O que você achou dessa dica? Comente sua opinião e siga o perfil!'
    onChange('persona_role', persona)
    onChange('tone_of_voice', tone)
    onChange('call_to_action_template', cta)
  }

  return (
    // shadcn-ignore: layout
    <div className="space-y-3 rounded-lg border border-border/60 bg-card/50 p-4">
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-primary" />
        <Typography
          variant="small"
          className="font-semibold text-foreground"
        >
          Estratégia Editorial & Nicho
        </Typography>
      </div>

      {/* Assistente One-Click */}
      <div className="space-y-1.5 rounded-md border border-primary/20 bg-primary/5 p-3">
        <Label className="text-xs font-semibold flex items-center gap-1.5 text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Assistente One-Click de Persona
        </Label>
        <div className="flex gap-2">
          <Input
            value={quickProposal}
            onChange={(e) => setQuickProposal(e.target.value)}
            placeholder="Descreva a proposta do canal em 1 frase (ex: Curiosidades sobre o espaço)"
            className="h-8 text-xs bg-background/80"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleEnhanceWithAI}
            disabled={!quickProposal.trim()}
            className="h-8 text-xs gap-1 shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Aprimorar com IA
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="space-y-1.5">
          <Label className="text-xs">Nicho do Canal</Label>
          <Select
            value={template.niche_type}
            onValueChange={(v) => onChange('niche_type', v)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="curiosities">🌟 Curiosidades & Mistérios</SelectItem>
              <SelectItem value="affiliate">🛍️ Achadinhos & Ofertas</SelectItem>
              <SelectItem value="news">📰 Notícias & Fatos Rápidos</SelectItem>
              <SelectItem value="tech">⚡ Tech & Gadgets</SelectItem>
              <SelectItem value="custom">🎯 Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Objetivo de Conversão</Label>
          <Select
            value={template.conversion_goal}
            onValueChange={(v) => onChange('conversion_goal', v)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="engagement">🔥 Engajamento Puro (Sem Links)</SelectItem>
              <SelectItem value="affiliate">🛒 Afiliado / Vendas</SelectItem>
              <SelectItem value="keyword_direct">💬 Comentário / DM</SelectItem>
              <SelectItem value="lead_capture">🎯 Captura de Leads</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5 pt-1">
        <Label className="text-xs">Papel / Persona da IA</Label>
        <Input
          value={template.persona_role}
          onChange={(e) => onChange('persona_role', e.target.value)}
          placeholder="Ex: Roteirista investigativo especialista em ciência e mistérios..."
          className="h-8 text-xs"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Tom de Voz</Label>
        <Input
          value={template.tone_of_voice}
          onChange={(e) => onChange('tone_of_voice', e.target.value)}
          placeholder="Ex: Intrigante, misterioso, dinâmico..."
          className="h-8 text-xs"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Chamada para Ação Padrão (CTA)</Label>
        <Input
          value={template.call_to_action_template || ''}
          onChange={(e) => onChange('call_to_action_template', e.target.value)}
          placeholder="Ex: Qual desses fatos você já sabia? Comente e siga!"
          className="h-8 text-xs"
        />
      </div>
    </div>
  )
}
