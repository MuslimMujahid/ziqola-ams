import { getCurrentUserFn } from "@/lib/services/api/auth/api.server";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AuthCard } from "@/components/auth/auth-card";
import { getDashboardRoute } from "@/lib/utils/auth";

export const Route = createFileRoute("/auth/_layout")({
  component: AuthLayout,
  beforeLoad: async () => {
    const user = await getCurrentUserFn();
    const role = user?.role;

    if (role) {
      const dashboardRoute = getDashboardRoute(role);
      throw redirect({
        to: dashboardRoute,
      });
    }
  },
  errorComponent: ({ error }: { error: Error }) => (
    <div className="min-h-screen p-6 text-error">
      Terjadi kesalahan: {error.message}
    </div>
  ),
  pendingComponent: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-ink-strong" />
    </div>
  ),
});

function AuthLayout() {
  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6">
        <div className="text-center">
          <div className="text-3xl font-semibold text-ink-strong">Ziqola</div>
          <p className="mt-2 text-sm text-ink-muted">
            Solusi Cerdas untuk Sekolah Modern
          </p>
        </div>

        <AuthCard>
          <Outlet />
        </AuthCard>

        <p className="text-xs text-ink-muted">
          Butuh bantuan? Hubungi admin sekolah Anda.
        </p>
      </div>
    </div>
  );
}
