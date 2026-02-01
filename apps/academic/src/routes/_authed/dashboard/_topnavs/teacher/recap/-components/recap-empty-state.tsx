import { InboxIcon } from "lucide-react";

export function RecapEmptyState() {
  return (
    <div className="rounded-lg bg-surface-contrast p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-1 text-ink-muted">
        <InboxIcon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-ink-strong">
        Data rekap belum tersedia
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        Coba ubah filter atau kata kunci pencarian untuk melihat nilai siswa.
      </p>
    </div>
  );
}
