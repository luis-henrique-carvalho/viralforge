import { useQuery } from '@tanstack/react-query'
import { viralStudioApi } from '../services/viral-studio.api'
import { viralStudioKeys } from '../services/viral-studio.keys'
import type { BatchKpis, BatchResponse } from '../data/batch.types'

export function computeBatchKpis(batches: BatchResponse[] = []): BatchKpis {
  let totalVideos = 0
  let readyVideos = 0
  let processingVideos = 0
  let failedVideos = 0
  let activeBatches = 0

  for (const batch of batches) {
    const items = batch.items || []
    totalVideos += items.length

    let hasActive = false
    for (const item of items) {
      if (['PENDING', 'DOWNLOADING', 'ANALYZING', 'RENDERING'].includes(item.status)) {
        processingVideos++
        hasActive = true
      } else if (['READY_FOR_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED'].includes(item.status)) {
        readyVideos++
      } else if (item.status === 'FAILED') {
        failedVideos++
      }
    }

    const isActive =
      items.length > 0 ? hasActive : batch.status === 'PENDING' || batch.status === 'PROCESSING'

    if (isActive) {
      activeBatches++
    }
  }

  const finishedOrReady = readyVideos
  const totalEvaluated = readyVideos + failedVideos
  const successRate =
    totalEvaluated > 0 ? Math.round((finishedOrReady / totalEvaluated) * 100) : 100

  return {
    totalBatches: batches.length,
    activeBatches,
    totalVideos,
    readyVideos,
    processingVideos,
    failedVideos,
    successRate,
  }
}

export function useBatches(options?: {
  refetchInterval?: number | false | ((query: any) => number | false)
}) {
  return useQuery({
    queryKey: viralStudioKeys.batches(),
    queryFn: () => viralStudioApi.fetchBatches(),
    refetchInterval: (query) => {
      if (options?.refetchInterval !== undefined) {
        return typeof options.refetchInterval === 'function'
          ? options.refetchInterval(query)
          : options.refetchInterval
      }
      // Auto-poll every 5 seconds if any batch has active processing
      const batches = query.state.data?.batches || []
      const kpis = computeBatchKpis(batches)
      return kpis.processingVideos > 0 || kpis.activeBatches > 0 ? 5000 : false
    },
  })
}
