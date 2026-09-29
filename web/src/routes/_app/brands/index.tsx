import { createFileRoute } from '@tanstack/react-router'
import { BrandsView } from '@/features/brands'

export const Route = createFileRoute('/_app/brands/')({
  component: BrandsView,
})
