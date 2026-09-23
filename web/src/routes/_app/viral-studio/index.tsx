import { createFileRoute } from '@tanstack/react-router'
import { ViralStudioView } from '@/features/viral-studio/views/viral-studio-view'

export const Route = createFileRoute('/_app/viral-studio/')({
  component: ViralStudioView,
})
