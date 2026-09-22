import { createFileRoute } from '@tanstack/react-router'
import { DiscoveryView } from '@/features/discovery/views/discovery-view'

export const Route = createFileRoute('/_app/discovery')({
  component: DiscoveryView,
})
