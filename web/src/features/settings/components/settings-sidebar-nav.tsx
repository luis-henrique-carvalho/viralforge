import { Share2, Bot, Mic, Cookie, Cpu, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SettingsTab } from '../data/settings.types'

interface SettingsSidebarNavProps {
  activeTab: SettingsTab
  onSelectTab: (tab: SettingsTab) => void
}

const navItems: Array<{
  id: SettingsTab
  title: string
  description: string
  icon: typeof Share2
}> = [
  {
    id: 'publishing',
    title: 'Publicação Social',
    description: 'Zernio API e canais sociais',
    icon: Share2,
  },
  {
    id: 'ai-models',
    title: 'Modelos & IA',
    description: 'Gemini, LM Studio e Ollama',
    icon: Bot,
  },
  {
    id: 'transcription',
    title: 'Transcrição & Áudio',
    description: 'Deepgram, ElevenLabs e Whisper',
    icon: Mic,
  },
  {
    id: 'cookies',
    title: 'Cookies de Sessão',
    description: 'Autenticação YouTube e redes',
    icon: Cookie,
  },
  {
    id: 'hardware',
    title: 'Aceleração & Hardware',
    description: 'GPU, VRAM e diagnóstico',
    icon: Cpu,
  },
  {
    id: 'branding',
    title: 'Marca & Tipografia',
    description: 'Logotipo d’água e fontes TTF',
    icon: Palette,
  },
]

export function SettingsSidebarNav({ activeTab, onSelectTab }: SettingsSidebarNavProps) {
  return (
    <nav
      className="flex flex-col space-y-1"
      aria-label="Abas de Configurações"
    >
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.id

        return (
          <Button
            key={item.id}
            variant="ghost"
            type="button"
            onClick={() => onSelectTab(item.id)}
            className={cn(
              'w-full justify-start text-left h-auto py-3 px-3.5 transition-colors',
              isActive
                ? 'bg-secondary text-primary font-semibold shadow-xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            <div className="flex items-start gap-3 w-full">
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 mt-0.5',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              />
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-sm tracking-tight truncate">{item.title}</span>
                <span className="text-xs text-muted-foreground font-normal truncate">
                  {item.description}
                </span>
              </div>
            </div>
          </Button>
        )
      })}
    </nav>
  )
}
