import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/")({
  component: DashboardPage,
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-red-600">Terjadi kesalahan: {error.message}</div>
  ),
  pendingComponent: () => (
    <div className="flex items-center justify-center p-6">
      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-slate-900" />
    </div>
  ),
});

function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <p className="text-sm text-slate-600">
        Selamat datang di Ziqola. Mulai kelola aktivitas akademik Anda di sini.
      </p>
    </div>
  );
}
