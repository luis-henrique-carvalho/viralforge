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
import { Card, CardContent } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'

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
      {/* Brand Header — Alinhado com a altura da TopNav (h-16) */}
      <SidebarHeader className="flex h-16 items-center justify-center border-b border-border/50 p-2 group-data-[collapsible=icon]:p-0">
        <SidebarMenu className="w-full">
          <SidebarMenuItem className="flex justify-center">
            <SidebarMenuButton
              size="lg"
              className="h-12 w-full rounded-xl transition-all hover:bg-transparent group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
                <Sparkles className="size-5" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-bold tracking-tight text-foreground">
                  Viral<span className="font-black text-primary">Forge</span>
                </span>
                <span className="truncate font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  AI Video Studio
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent className="px-3 py-4 group-data-[collapsible=icon]:px-2">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-3 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase group-data-[collapsible=icon]:hidden">
            Estúdio & Criação
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2 group-data-[collapsible=icon]:mt-1">
            <SidebarMenu className="space-y-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive =
                  currentPath === item.to || (item.to !== '/' && currentPath.startsWith(item.to))

                return (
                  <SidebarMenuItem
                    key={item.to}
                    className="flex justify-center"
                  >
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={`h-11 rounded-2xl px-3.5 text-sm font-medium transition-all group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!rounded-xl group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/95 hover:text-primary-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground'
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground'
                      }`}
                    >
                      <Link
                        to={item.to}
                        className="flex w-full items-center gap-3 group-data-[collapsible=icon]:justify-center"
                      >
                        <Icon
                          className={`size-5 shrink-0 transition-transform ${
                            isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                          }`}
                        />
                        <span className="truncate group-data-[collapsible=icon]:hidden">
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>

                    {item.badge && (
                      <SidebarMenuBadge
                        className={`right-2.5 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider group-data-[collapsible=icon]:hidden ${
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
        <Card className="rounded-xl border-border/60 bg-card/60 shadow-xs">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4 text-primary" />
              <Typography variant="small">Motor de Renderização</Typography>
            </div>
            <Typography variant="muted">
              FFmpeg · Whisper Local · Ollama / Gemini Multi-signal
            </Typography>
          </CardContent>
        </Card>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
