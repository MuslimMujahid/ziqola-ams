"use client";

import { createFileRoute } from "@tanstack/react-router";
import { AcademicSetupWizard } from "@/components/onboarding/academic-setup-wizard";

export const Route = createFileRoute("/_authed/onboarding/academic-setup")({
  component: AcademicSetupPage,
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  ),
  pendingComponent: () => (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-ink-strong" />
    </div>
  ),
});

function AcademicSetupPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 sm:px-6 pt-24">
      <AcademicSetupWizard />
    </div>
  );
}
