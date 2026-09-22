import { createFileRoute } from '@tanstack/react-router'
import { ClipsView } from '@/features/pipeline-clips/views/clips-view'

export const Route = createFileRoute('/_app/clips')({
  component: ClipsView,
})
