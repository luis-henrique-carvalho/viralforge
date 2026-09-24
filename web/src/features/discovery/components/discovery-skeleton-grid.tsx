import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const SKELETON_KEYS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10']

export function DiscoverySkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {SKELETON_KEYS.map((skId) => (
        <Card
          key={skId}
          className="rounded-[18px] p-2 space-y-3"
        >
          <Skeleton className="aspect-[9/16] w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </Card>
      ))}
    </div>
  )
}
