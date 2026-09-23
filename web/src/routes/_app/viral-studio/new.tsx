import { createFileRoute } from '@tanstack/react-router'
import { CreateBatchView } from '@/features/viral-studio/views/create-batch-view'

export const Route = createFileRoute('/_app/viral-studio/new')({
  component: CreateBatchView,
})
