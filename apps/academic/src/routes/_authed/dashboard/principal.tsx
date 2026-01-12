import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard/principal")({
  component: PrincipalDashboardPage,
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-red-600">Terjadi kesalahan: {error.message}</div>
  ),
  pendingComponent: () => (
    <div className="flex items-center justify-center p-6">
      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-slate-900" />
    </div>
  ),
});

function PrincipalDashboardPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold text-slate-900">
        Dashboard Kepala Sekolah
      </h1>
      <p className="text-sm text-slate-600">
        Placeholder konten dashboard untuk kepala sekolah.
      </p>
    </div>
  );
}
