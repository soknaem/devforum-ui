/** Grey placeholder blocks shown while content loads (feels faster than a spinner). */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} aria-hidden="true" />;
}

/** Looks like a feed card, so the page does not jump when the real posts arrive. */
export function FeedCardSkeleton() {
  return (
    <div className="feed-card p-4 sm:p-5" aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 !rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="mt-4 h-5 w-3/4" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-11/12" />
      </div>
      <Skeleton className="mt-4 h-40 w-full !rounded-2xl" />
    </div>
  );
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 sm:space-y-4" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <FeedCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Rows for the notifications list. */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card divide-y divide-slate-100 overflow-hidden" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-4 p-5" aria-hidden="true">
          <Skeleton className="h-10 w-10 shrink-0 !rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
