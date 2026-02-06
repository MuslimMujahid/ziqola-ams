import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";

import { Button } from "@repo/ui/button";
import { useFeedbackDialog } from "@/lib/utils/use-feedback-dialog";
import { useAuthStore } from "@/stores/auth.store";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { useClasses } from "@/lib/services/api/classes";
import { useTenantProfileFields } from "@/lib/services/api/profile-custom-fields";
import { StudentsImport } from "./-components/-students-import";

export const Route = createFileRoute(
  "/_authed/dashboard/_sidenavs/admin-staff/students/import",
)({
  component: StudentsImportPage,
  pendingComponent: () => (
    <div className="flex items-center justify-center py-10 text-ink-muted">
      <Loader2Icon className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span className="ml-2 text-sm">Memuat halaman impor siswa...</span>
    </div>
  ),
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  ),
});

function StudentsImportPage() {
  const { showFeedback, FeedbackDialog } = useFeedbackDialog();
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId ?? "";

  const workspace = useWorkspaceStore();
  const academicYearId = workspace.academicYearId ?? undefined;
  const academicPeriodId = workspace.academicPeriodId ?? undefined;

  const classOptionsQuery = useClasses(
    { offset: 0, limit: 200, academicYearId },
    { enabled: Boolean(academicYearId) },
  );

  const tenantFieldsQuery = useTenantProfileFields(tenantId, "student", {
    enabled: Boolean(tenantId),
  });

  const enabledCustomFields = React.useMemo(
    () =>
      (tenantFieldsQuery.data?.data ?? []).filter((field) => field.isEnabled),
    [tenantFieldsQuery.data?.data],
  );

  const isWorkspaceReady = academicYearId && academicPeriodId;

  const handleImportSuccess = React.useCallback(
    (createdCount: number) => {
      showFeedback({
        tone: "success",
        title: "Impor siswa berhasil",
        description: `${createdCount} siswa berhasil diimpor.`,
      });
    },
    [showFeedback],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Button
              asChild
              type="button"
              variant="ghost"
              className="gap-2 rounded-full"
            >
              <Link to="/dashboard/admin-staff/students">
                <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold text-ink-strong">
              Impor siswa
            </h1>
          </div>
          <p className="mt-2 text-sm text-ink-muted">
            Unggah template CSV dan periksa data sebelum mengimpor siswa.
          </p>
        </div>
      </div>

      {!isWorkspaceReady ? (
        <div className="rounded-xl bg-surface-contrast p-6 text-sm text-ink-muted">
          Pilih tahun ajaran dan periode akademik di workspace sebelum mengimpor
          siswa.
        </div>
      ) : (
        <div className="rounded-xl bg-surface-contrast p-6">
          <StudentsImport
            classes={classOptionsQuery.data?.data ?? []}
            customFields={enabledCustomFields}
            academicYearId={academicYearId}
            academicPeriodId={academicPeriodId}
            onImportSuccess={handleImportSuccess}
          />
        </div>
      )}

      <FeedbackDialog />
    </div>
  );
}
