import { useQuery } from '@tanstack/react-query'
import { viralStudioApi } from '../services/viral-studio.api'
import { viralStudioKeys } from '../services/viral-studio.keys'

export function useBatchDetail(batchId: string) {
  return useQuery({
    queryKey: viralStudioKeys.batch(batchId),
    queryFn: () => viralStudioApi.fetchBatch(batchId),
    enabled: Boolean(batchId),
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return 2000
      const items = data.items || []
      const hasActive = items.some((item) =>
        ['PENDING', 'DOWNLOADING', 'ANALYZING', 'RENDERING'].includes(item.status),
      )
      return hasActive ? 2000 : false
    },
  })
}
