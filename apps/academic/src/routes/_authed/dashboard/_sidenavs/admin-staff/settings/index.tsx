import { createFileRoute, Link } from "@tanstack/react-router";
import { SlidersHorizontalIcon } from "lucide-react";

import { Button } from "@repo/ui/button";

export const Route = createFileRoute(
  "/_authed/dashboard/_sidenavs/admin-staff/settings/",
)({
  component: AdminStaffSettingsPage,
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  ),
  pendingComponent: () => (
    <div className="flex items-center justify-center p-6">
      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-ink-strong" />
    </div>
  ),
});

function AdminStaffSettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-strong">Pengaturan</h1>
        <p className="text-sm text-ink-muted">Kelola konfigurasi sekolah</p>
      </div>

      <section className="rounded-xl bg-surface-contrast p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-ink-strong">
              <SlidersHorizontalIcon className="h-5 w-5" aria-hidden="true" />
              <h2 className="text-base font-semibold">Kustomisasi</h2>
            </div>
            <p className="text-sm text-ink-muted">
              Atur sistem manajemen akademik sesuai kebutuhan sekolah Anda.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link to="/dashboard/admin-staff/settings/customization">
              Kelola
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
