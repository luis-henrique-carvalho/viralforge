import { Server, CheckCircle2, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { LocalModelsResponse } from '../data/settings.types'

export interface LocalModelsSectionProps {
  localModels?: LocalModelsResponse
  lmStudioUrl: string
  setLmStudioUrl: (val: string) => void
  ollamaUrl: string
  setOllamaUrl: (val: string) => void
  defaultAiModel: string
  setDefaultAiModel: (val: string) => void
}

export function LocalModelsSection({
  localModels,
  lmStudioUrl,
  setLmStudioUrl,
  ollamaUrl,
  setOllamaUrl,
  defaultAiModel,
  setDefaultAiModel,
}: LocalModelsSectionProps) {
  return (
    <Card className="space-y-4 border-border/60 bg-card/40 p-4 shadow-none">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Server className="h-4 w-4 text-primary" />
          LLMs Locais (Inference Endpoints)
        </h3>
        <Badge
          variant="outline"
          className="text-xs"
        >
          Local Inference
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="lm-studio-url"
              className="text-xs font-medium"
            >
              LM Studio Base URL
            </Label>
            {localModels?.lm_studio?.online ? (
              <Badge
                variant="outline"
                className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1"
              >
                <CheckCircle2 className="h-2.5 w-2.5" />
                Online ({localModels.lm_studio.models.length} modelos)
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[10px] text-muted-foreground flex items-center gap-1"
              >
                <XCircle className="h-2.5 w-2.5" />
                Offline
              </Badge>
            )}
          </div>
          <Input
            id="lm-studio-url"
            placeholder="http://localhost:1234"
            value={lmStudioUrl}
            onChange={(e) => setLmStudioUrl(e.target.value)}
            className="font-mono text-xs"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="ollama-url"
              className="text-xs font-medium"
            >
              Ollama Base URL
            </Label>
            {localModels?.ollama?.online ? (
              <Badge
                variant="outline"
                className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1"
              >
                <CheckCircle2 className="h-2.5 w-2.5" />
                Online ({localModels.ollama.models.length} modelos)
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[10px] text-muted-foreground flex items-center gap-1"
              >
                <XCircle className="h-2.5 w-2.5" />
                Offline
              </Badge>
            )}
          </div>
          <Input
            id="ollama-url"
            placeholder="http://localhost:11434"
            value={ollamaUrl}
            onChange={(e) => setOllamaUrl(e.target.value)}
            className="font-mono text-xs"
          />
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-border/40">
        <Label
          htmlFor="default-ai-model-select"
          className="text-xs font-medium"
        >
          Modelo Padrão Global do Sistema
        </Label>
        <Select
          value={defaultAiModel}
          onValueChange={setDefaultAiModel}
        >
          <SelectTrigger
            id="default-ai-model-select"
            className="w-full sm:w-96"
          >
            <SelectValue placeholder="Selecione o modelo padrão global" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Cloud)</SelectItem>
            <SelectItem value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite (Cloud)</SelectItem>
            <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Cloud)</SelectItem>
            {localModels?.models && localModels.models.length > 0 && (
              <>
                {localModels.models.map((m) => (
                  <SelectItem
                    key={m.id}
                    value={m.id}
                  >
                    {m.name} ({m.group})
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">
          Utilizado automaticamente na criação de novos lotes e pipelines quando não sobrescrito por
          template.
        </p>
      </div>
    </Card>
  )
}
