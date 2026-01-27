import React from "react";

export function TeacherAssessmentScoresSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-surface-1" />
          <div className="space-y-2">
            <div className="h-6 w-32 rounded-md bg-surface-1" />
            <div className="h-4 w-56 rounded-md bg-surface-1" />
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-surface-contrast p-5 max-w-md">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={`summary-skeleton-${index}`} className="space-y-2">
              <div className="h-3 w-16 rounded-md bg-surface-1" />
              <div className="h-4 w-24 rounded-md bg-surface-1" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-surface-contrast p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-9 w-48 rounded-md bg-surface-1" />
          <div className="ml-auto h-9 w-32 rounded-md bg-surface-1" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`row-skeleton-${index}`}
              className="h-12 rounded-md bg-surface-1"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
