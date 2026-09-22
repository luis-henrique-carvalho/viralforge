import { createFileRoute } from '@tanstack/react-router'
import { BrandsView } from '@/features/viral-studio/views/brands-view'

export const Route = createFileRoute('/_app/viral-studio/brands')({
  component: BrandsView,
})
