import { createFileRoute } from '@tanstack/react-router'
import { ViralEditorView } from '@/features/viral-studio/views/viral-editor-view'

export const Route = createFileRoute('/_app/viral-studio/$id_/items/$itemId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id, itemId } = Route.useParams()
  return (
    <ViralEditorView
      batchId={id}
      itemId={itemId}
    />
  )
}
