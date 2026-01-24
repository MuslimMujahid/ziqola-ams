import React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { ProfileCustomizationPage } from "./-components/profile-customization-page";

function ProfileCustomizationSkeleton() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-40 rounded-md bg-surface-1" />
        <div className="h-4 w-72 rounded-md bg-surface-1" />
      </div>

      <section className="rounded-xl bg-surface-contrast p-6 space-y-4">
        <div className="space-y-2">
          <div className="h-5 w-24 rounded-md bg-surface-1" />
          <div className="h-4 w-64 rounded-md bg-surface-1" />
        </div>
        <div className="grid gap-3 md:grid-cols-[1.4fr_auto]">
          <div className="h-10 rounded-md bg-surface-1" />
          <div className="h-10 w-24 rounded-md bg-surface-1" />
        </div>
      </section>

      <section className="rounded-xl bg-surface-contrast p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 w-32 rounded-md bg-surface-1" />
            <div className="h-4 w-72 rounded-md bg-surface-1" />
          </div>
          <div className="h-10 w-28 rounded-md bg-surface-1" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`student-skeleton-${index}`}
              className="h-16 rounded-lg bg-surface-1"
            />
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-surface-contrast p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 w-32 rounded-md bg-surface-1" />
            <div className="h-4 w-72 rounded-md bg-surface-1" />
          </div>
          <div className="h-10 w-28 rounded-md bg-surface-1" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`teacher-skeleton-${index}`}
              className="h-16 rounded-lg bg-surface-1"
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export const Route = createFileRoute(
  "/_authed/dashboard/_sidenavs/admin-staff/settings/customization/",
)({
  component: function ProfileCustomizationRoute() {
    return (
      <React.Suspense fallback={<ProfileCustomizationSkeleton />}>
        <ProfileCustomizationPage />
      </React.Suspense>
    );
  },
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  ),
  pendingComponent: () => <ProfileCustomizationSkeleton />,
});
