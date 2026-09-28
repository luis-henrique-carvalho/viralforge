import { createFileRoute } from '@tanstack/react-router'
import { BrandWorkspaceView } from '@/features/viral-studio/views/brand-workspace-view'

export const Route = createFileRoute('/_app/viral-studio/brands/$brandId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { brandId } = Route.useParams()
  return <BrandWorkspaceView brandId={brandId} />
}
