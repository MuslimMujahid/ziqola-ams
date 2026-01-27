export function TeacherAssessmentsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-40 rounded-md bg-surface-1" />
        <div className="h-4 w-64 rounded-md bg-surface-1" />
      </div>

      <div className="rounded-lg bg-surface-contrast p-5">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded-md bg-surface-1" />
          <div className="h-10 w-full rounded-md bg-surface-1" />
        </div>
      </div>

      <div className="rounded-lg bg-surface-contrast p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 w-40 rounded-md bg-surface-1" />
            <div className="h-4 w-72 rounded-md bg-surface-1" />
          </div>
          <div className="h-6 w-16 rounded-md bg-surface-1" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`weight-skeleton-${index}`}
              className="h-12 rounded-md bg-surface-1"
            />
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-surface-contrast p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-3">
            <div className="h-10 w-40 rounded-md bg-surface-1" />
            <div className="h-10 w-32 rounded-md bg-surface-1" />
          </div>
          <div className="h-10 w-40 rounded-md bg-surface-1" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`table-row-skeleton-${index}`}
              className="h-12 rounded-md bg-surface-1"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
