import { Skeleton } from '@/components/ui/skeleton'

export function BatchResultsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="flex gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 flex-1" />
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 items-start">
        {[1, 2, 3, 4].map((n) => (
          <Skeleton
            key={n}
            className="h-96 rounded-xl"
          />
        ))}
      </div>
    </div>
  )
}
