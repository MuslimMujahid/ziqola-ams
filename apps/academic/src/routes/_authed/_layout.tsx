import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Button } from "@repo/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { useMe } from "@/lib/services/api/auth/use-me";
import { useLogout } from "@/lib/services/api/auth/use-logout";

export const Route = createFileRoute("/_authed/_layout")({
  component: AppLayout,
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

function AppLayout() {
  const hydrated = useAuthStore((state) => state.hydrated);
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();

  const meQuery = useMe({ enabled: !user });

  if (!hydrated || meQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-ink-strong" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/80 bg-surface-contrast shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-lg font-semibold text-ink-strong">Ziqola</div>
            <div className="text-xs text-ink-muted">Dashboard Akademik</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-ink-muted">
              {user?.name ?? user?.email}
            </div>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? "Keluar..." : "Keluar"}
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
