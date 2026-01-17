import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth.store";
import { getDashboardRoute } from "@/lib/utils/auth";

export const Route = createFileRoute("/_authed/dashboard/")({
  component: DashboardIndexPage,
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  ),
  pendingComponent: () => (
    <div className="flex items-center justify-center p-6">
      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-ink-strong" />
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
