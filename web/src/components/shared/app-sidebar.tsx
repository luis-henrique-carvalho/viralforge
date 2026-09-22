import { Link, useRouterState } from '@tanstack/react-router'
import { Compass, Film, Scissors, Settings, Sparkles } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

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
    badge: 'CORE',
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
    <Sidebar
      collapsible="icon"
      className="border-r border-border bg-sidebar/95 backdrop-blur-md"
    >
      {/* Brand Header */}
      <SidebarHeader className="border-b border-border/50 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-base font-bold tracking-tight text-foreground">
              Viral<span className="font-black text-primary">Forge</span>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              AI Video Studio
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
            Estúdio & Criação
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu className="space-y-1.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive =
                  currentPath === item.to || (item.to !== '/' && currentPath.startsWith(item.to))

                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={`h-11 rounded-2xl px-3.5 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30 hover:bg-primary/95 hover:text-primary-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground'
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground'
                      }`}
                    >
                      <Link
                        to={item.to}
                        className="flex items-center gap-3"
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 transition-transform ${
                            isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>

                    {item.badge && (
                      <SidebarMenuBadge
                        className={`right-2.5 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${
                          isActive
                            ? 'border-white/30 bg-white/20 text-white'
                            : 'border-border/80 bg-muted/40 text-muted-foreground'
                        }`}
                      >
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer Info */}
      <SidebarFooter className="p-3 group-data-[collapsible=icon]:hidden">
        <div className="rounded-xl border border-border/60 bg-card/60 p-3 shadow-xs">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium text-foreground">Motor de Renderização</p>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            FFmpeg · Whisper Local · Ollama / Gemini Multi-signal
          </p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
