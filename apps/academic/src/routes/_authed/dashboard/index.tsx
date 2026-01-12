import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth.store";
import { getDashboardRoute } from "@/lib/utils/auth";

export const Route = createFileRoute("/_authed/dashboard/")({
  component: DashboardIndexPage,
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-red-600">Terjadi kesalahan: {error.message}</div>
  ),
  pendingComponent: () => (
    <div className="flex items-center justify-center p-6">
      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-slate-900" />
    </div>
  ),
});

function DashboardIndexPage() {
  const role = useAuthStore((state) => state.user?.role);

  if (role) {
    return <Navigate to={getDashboardRoute(role)} replace />;
  }

  return null;
}
