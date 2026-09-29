import { createFileRoute } from '@tanstack/react-router'
import { BrandWorkspaceView } from '@/features/brands'

export const Route = createFileRoute('/_app/brands/$brandId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { brandId } = Route.useParams()
  return <BrandWorkspaceView brandId={brandId} />
}
