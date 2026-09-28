import { createFileRoute } from '@tanstack/react-router'
import { TemplateStudioView } from '@/features/viral-studio/views/template-studio-view'

export const Route = createFileRoute('/_app/viral-studio/templates/$templateId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { templateId } = Route.useParams()
  return <TemplateStudioView templateId={templateId} />
}
