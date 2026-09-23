import { createFileRoute } from '@tanstack/react-router'
import { BatchResultsView } from '@/features/viral-studio/views/batch-results-view'

export const Route = createFileRoute('/_app/viral-studio/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <BatchResultsView batchId={id} />
}
