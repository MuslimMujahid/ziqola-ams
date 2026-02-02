import React from "react";

export function HomeroomRecapSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="rounded-lg bg-surface-contrast p-4"
        >
          <div className="space-y-3 animate-pulse">
            <div className="h-4 w-1/3 rounded bg-surface-2" />
            <div className="h-3 w-2/3 rounded bg-surface-2" />
            <div className="h-3 w-1/2 rounded bg-surface-2" />
            <div className="h-8 w-48 rounded bg-surface-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
