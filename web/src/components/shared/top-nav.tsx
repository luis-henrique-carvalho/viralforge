import { useQuery } from '@tanstack/react-query'
import { Activity, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { apiClient } from '@/api/client'

export function TopNav() {
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
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-card/75 px-6 backdrop-blur-md">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-foreground">
            Viral<span className="text-primary font-black">Forge</span>
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
            AI Video Studio
          </span>
        </div>
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

        <Badge variant="outline" className="border-border/60 bg-muted/30 text-xs font-mono">
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
          <DropdownMenuContent align="end" className="w-56 border-border bg-card">
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
