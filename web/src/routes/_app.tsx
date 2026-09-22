import { createFileRoute, Outlet } from '@tanstack/react-router'
import { TopNav } from '@/components/shared/top-nav'
import { AppSidebar } from '@/components/shared/app-sidebar'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
