import { useQuery } from '@tanstack/react-query'
import { useRouterState } from '@tanstack/react-router'
import { Activity } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { apiClient } from '@/api/client'

const ROUTE_TITLES: Record<string, string> = {
  '/viral-studio': 'Viral Content Studio',
  '/discovery': 'Descoberta Multiplataforma',
  '/clips': 'Cortes 9:16 (Pipeline Tradicional)',
  '/settings': 'Configurações do Sistema',
}

export function TopNav() {
  const router = useRouterState()
  const currentPath = router.location.pathname
  const pageTitle = ROUTE_TITLES[currentPath] || 'Viral Content Studio'

  const { data: health, isError } = useQuery({
    queryKey: ['backend-health'],
    queryFn: async () => {
      const res = await apiClient.get<{ status: string }>('/health')
      return res.data
    },
    refetchInterval: 15000,
    retry: false,
  })

  const isOnline = !isError && health?.status === 'ok'

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full shrink-0 items-center justify-between border-b border-border bg-card/75 px-4 backdrop-blur-md md:px-6">
      {/* Left section: Sidebar trigger + Breadcrumb */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
        <Separator
          orientation="vertical"
          className="mr-2 h-4 bg-border/80"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold text-foreground">{pageTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Backend Connectivity Status */}
        <div className="flex items-center gap-2 rounded-full border border-border bg-background/50 px-3 py-1">
          <span className="relative flex h-2 w-2">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                isOnline ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                isOnline ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {isOnline ? 'API Conectada' : 'API Desconectada'}
          </span>
        </div>

        <Badge
          variant="outline"
          className="border-border/60 bg-muted/30 font-mono text-xs text-muted-foreground"
        >
          v0.1.0 Beta
        </Badge>

        {/* User / Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-border bg-secondary/80 font-bold text-xs text-foreground shadow-sm hover:bg-secondary"
            >
              VF
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 border-border bg-card"
          >
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold text-foreground">ViralForge Local</p>
                <p className="text-xs text-muted-foreground">Workspace Autônomo</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/60" />
            <DropdownMenuItem className="cursor-pointer">
              <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Telemetria do Sistema</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
