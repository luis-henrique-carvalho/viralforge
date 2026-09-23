import { createFileRoute } from '@tanstack/react-router'
import { TemplatesGalleryView } from '@/features/viral-studio/views/templates-gallery-view'

export const Route = createFileRoute('/_app/viral-studio/templates/')({
  component: TemplatesGalleryView,
})
