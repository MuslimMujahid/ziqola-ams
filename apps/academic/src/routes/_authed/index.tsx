import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/")({
  component: DashboardPage,
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  ),
  pendingComponent: () => (
    <div className="flex items-center justify-center p-6">
      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-ink-strong" />
    </div>
  ),
});

function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-ink-strong">Dashboard</h1>
      <p className="text-sm text-ink-muted">
        Selamat datang di Ziqola. Mulai kelola aktivitas akademik Anda di sini.
      </p>
    </div>
  );
}
