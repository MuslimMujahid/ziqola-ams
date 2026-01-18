import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard/_topnavs/teacher")({
  component: TeacherDashboardPage,
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  ),
  pendingComponent: () => (
    <div className="flex items-center justify-center p-6">
      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-ink-strong" />
    </div>
  ),
});

function TeacherDashboardPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold text-ink-strong">Dashboard Guru</h1>
      <p className="text-sm text-ink-muted">
        Placeholder konten dashboard untuk guru.
      </p>
    </div>
  );
}
