import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function PublishingQueueSkeleton() {
  return (
    <div className="flex flex-col gap-3 w-full">
      {[1, 2, 3].map((n) => (
        <Card
          key={n}
          className="p-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Skeleton className="w-14 h-20 rounded-md shrink-0" />
              <div className="flex flex-col gap-2 min-w-0">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="h-3 w-32" />
                <div className="flex items-center gap-1.5 pt-1">
                  <Skeleton className="h-4 w-16 rounded-md" />
                  <Skeleton className="h-4 w-16 rounded-md" />
                </div>
              </div>
            </div>
            <Skeleton className="h-8 w-28 shrink-0 self-end sm:self-center" />
          </div>
        </Card>
      ))}
    </div>
  )
}
