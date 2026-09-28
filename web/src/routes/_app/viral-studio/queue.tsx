import { createFileRoute } from '@tanstack/react-router'
import { PublishingQueueView } from '@/features/viral-studio/views/publishing-queue-view'

export const Route = createFileRoute('/_app/viral-studio/queue')({
  component: PublishingQueueView,
})
