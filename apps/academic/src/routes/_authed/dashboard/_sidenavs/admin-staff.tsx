import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authed/dashboard/_sidenavs/admin-staff",
)({
  staticData: {
    sidenavId: "adminStaff",
  },
  component: AdminStaffRoute,
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  ),
  pendingComponent: () => (
    <div className="flex items-center justify-center p-6">
      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-ink-strong" />
    </div>
  ),
});

function AdminStaffRoute() {
  return <Outlet />;
}
