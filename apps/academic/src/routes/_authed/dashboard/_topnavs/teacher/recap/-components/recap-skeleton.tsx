export function RecapSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-40 rounded-md bg-surface-1 animate-pulse" />
        <div className="h-4 w-72 rounded-md bg-surface-1 animate-pulse" />
      </div>

      <div className="rounded-lg bg-surface-contrast p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`filter-skeleton-${index}`}
              className="h-10 rounded-md bg-surface-1 animate-pulse"
            />
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`summary-skeleton-${index}`}
            className="h-24 rounded-lg bg-surface-contrast animate-pulse"
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg bg-surface-contrast p-4 space-y-3 animate-pulse">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`row-skeleton-${index}`}
              className="h-10 rounded-md bg-surface-1"
            />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-56 rounded-lg bg-surface-contrast animate-pulse" />
          <div className="h-40 rounded-lg bg-surface-contrast animate-pulse" />
        </div>
      </div>
    </div>
  );
}
