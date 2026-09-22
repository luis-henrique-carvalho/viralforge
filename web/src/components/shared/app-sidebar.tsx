import { Link, useRouterState } from '@tanstack/react-router'
import { Compass, Film, Scissors, Settings, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/viral-studio',
    label: 'Viral Studio',
    icon: Sparkles,
    badge: 'Core',
  },
  {
    to: '/discovery',
    label: 'Descoberta',
    icon: Compass,
  },
  {
    to: '/clips',
    label: 'Cortes 9:16',
    icon: Scissors,
  },
  {
    to: '/settings',
    label: 'Configurações',
    icon: Settings,
  },
]

export function AppSidebar() {
  const router = useRouterState()
  const currentPath = router.location.pathname

  return (
    <aside className="flex h-[calc(100vh-4rem)] w-64 flex-col justify-between border-r border-border bg-sidebar/50 p-4 backdrop-blur-sm">
      <div className="space-y-6">
        {/* Navigation Category */}
        <div>
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
            Estúdio & Criação
          </p>
          <nav className="mt-2 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive =
                currentPath === item.to || (item.to !== '/' && currentPath.startsWith(item.to))

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <Badge
                      variant={isActive ? 'secondary' : 'outline'}
                      className={`text-[10px] px-1.5 py-0 h-4 uppercase tracking-wider ${
                        isActive
                          ? 'bg-white/20 text-white border-transparent'
                          : 'border-border/80 text-muted-foreground'
                      }`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Footer Info */}
      <div className="rounded-xl border border-border/60 bg-card/60 p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-primary" />
          <p className="text-xs font-medium text-foreground">Motor de Renderização</p>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
          FFmpeg · Whisper Local · Ollama / Gemini Multi-signal
        </p>
      </div>
    </aside>
  )
}
