import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  CheckCircle2Icon,
  Loader2Icon,
  PlusIcon,
  RefreshCwIcon,
  ArchiveIcon,
} from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/lib/utils/use-confirm";
import { useFeedbackDialog } from "@/lib/utils/use-feedback-dialog";
import {
  type AcademicPeriod,
  useAcademicContext,
  useAcademicYears,
  useAcademicPeriods,
  useCreateAcademicPeriod,
} from "@/lib/services/api/academic";
import { useActivateAcademicPeriod } from "@/lib/services/api/academic/use-activate-academic-period";
import { useUpdateAcademicPeriod } from "@/lib/services/api/academic/use-update-academic-period";
import { CreateAcademicPeriodModal } from "@/components/academic-periods/create-academic-period-modal";
import { formatDateLocal, renderDateRange } from "@/lib/utils/date";
import { useWorkspaceStore } from "@/stores/workspace.store";

export const Route = createFileRoute(
  "/_authed/dashboard/_sidenavs/admin-staff/academic-periods",
)({
  component: AcademicPeriodsPage,
  pendingComponent: () => (
    <div className="flex items-center justify-center py-10 text-ink-muted">
      <Loader2Icon className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span className="ml-2 text-sm">Memuat data periode akademik...</span>
    </div>
  ),
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  ),
});

function AcademicPeriodsPage() {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const { confirm, ConfirmDialog } = useConfirm();
  const { showFeedback, FeedbackDialog } = useFeedbackDialog();

  const debouncedSearchRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    window.clearTimeout(debouncedSearchRef.current);
    debouncedSearchRef.current = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 300);

    return () => {
      window.clearTimeout(debouncedSearchRef.current);
    };
  }, [searchInput]);

  const academicContext = useAcademicContext();
  const workspace = useWorkspaceStore();
  const academicYearId = workspace.academicYearId ?? undefined;
  const academicYearsQuery = useAcademicYears({ offset: 0, limit: 50 });
  const activePeriodId = academicContext.data?.year?.activePeriodId;

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [academicYearId]);

  const queryParams = React.useMemo(
    () => ({
      offset: pagination.pageIndex * pagination.pageSize,
      limit: pagination.pageSize,
      search: search || undefined,
      academicYearId,
    }),
    [pagination.pageIndex, pagination.pageSize, search, academicYearId],
  );

  const academicPeriodsQuery = useAcademicPeriods(queryParams, {
    enabled: Boolean(academicYearId),
  });
  const createPeriod = useCreateAcademicPeriod();
  const activatePeriod = useActivateAcademicPeriod();
  const updatePeriod = useUpdateAcademicPeriod();

  const total = academicPeriodsQuery.data?.meta.total ?? 0;
  const pageCount = pagination.pageSize
    ? Math.max(Math.ceil(total / pagination.pageSize), 1)
    : 1;

  const handleActivate = React.useCallback(
    async (id: string) => {
      const confirmed = await confirm({
        title: "Aktifkan periode ini?",
        description: "Periode aktif sebelumnya akan diarsipkan.",
        confirmText: "Aktifkan",
        cancelText: "Batal",
      });
      if (!confirmed) {
        return;
      }
      await activatePeriod.mutateAsync({ id });
      showFeedback({
        tone: "success",
        title: "Periode diaktifkan",
        description: "Periode akademik berhasil diaktifkan.",
      });
    },
    [activatePeriod, confirm, showFeedback],
  );

  const handleArchive = React.useCallback(
    async (id: string) => {
      const confirmed = await confirm({
        title: "Arsipkan periode ini?",
        description:
          "Periode tidak akan dapat diedit dan tidak dapat lagi menjadi aktif.",
        confirmText: "Arsipkan",
        cancelText: "Batal",
      });
      if (!confirmed) {
        return;
      }
      await updatePeriod.mutateAsync({ id, status: "ARCHIVED" });
      showFeedback({
        tone: "success",
        title: "Periode diarsipkan",
        description: "Status periode berhasil diperbarui.",
      });
    },
    [confirm, showFeedback, updatePeriod],
  );

  const columns = React.useMemo<ColumnDef<AcademicPeriod>[]>(
    () => [
      {
        header: "Periode",
        accessorKey: "name",
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-medium text-ink-strong">
              {row.original.name}
            </div>
            <p className="text-xs text-ink-muted">
              Dibuat pada {formatDateLocal(row.original.createdAt)}
            </p>
          </div>
        ),
      },
      {
        header: "Rentang",
        cell: ({ row }) => (
          <div className="text-sm text-ink">
            {renderDateRange(row.original.startDate, row.original.endDate)}
          </div>
        ),
      },
      {
        header: "Status",
        cell: ({ row }) =>
          renderStatusBadge(
            row.original.status,
            row.original.id === activePeriodId,
          ),
      },
      {
        header: "Aksi",
        cell: ({ row }) => {
          const isActive = row.original.id === activePeriodId;

          return (
            <div className="flex flex-wrap gap-2">
              {!isActive && !activatePeriod.isPending ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleActivate(row.original.id)}
                >
                  <CheckCircle2Icon className="h-4 w-4" aria-hidden="true" />
                  Aktifkan
                </Button>
              ) : null}
              {!isActive &&
              row.original.status !== "ARCHIVED" &&
              !updatePeriod.isPending ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-ink hover:text-ink"
                  onClick={() => handleArchive(row.original.id)}
                >
                  <ArchiveIcon className="h-4 w-4" aria-hidden="true" />
                  Arsipkan
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [
      activePeriodId,
      activatePeriod.isPending,
      handleActivate,
      handleArchive,
      updatePeriod.isPending,
    ],
  );

  const selectedYearLabel = academicYearsQuery.data?.data.find(
    (year) => year.id === academicYearId,
  )?.label;

  const isYearMissing = !academicYearId && !academicYearsQuery.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-strong">
            Periode akademik
          </h1>
          <p className="text-sm text-ink-muted">
            Kelola periode akademik dan tentukan yang aktif.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => academicPeriodsQuery.refetch()}
            className="gap-2"
            disabled={!academicYearId}
          >
            <RefreshCwIcon className="h-4 w-4" aria-hidden="true" />
            Muat ulang
          </Button>
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="gap-2"
            disabled={!academicYearId}
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Tambah periode
          </Button>
        </div>
      </div>

      {isYearMissing ? (
        <div className="rounded-xl bg-surface-contrast p-6 text-sm text-ink-muted">
          Belum ada tahun ajaran aktif. Mulai tahun ajaran untuk menambahkan
          periode akademik.
        </div>
      ) : null}

      {!isYearMissing ? (
        <div className="rounded-xl bg-surface-contrast p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-xs">
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Cari periode akademik"
                  className="w-full"
                />
              </div>
              {selectedYearLabel ? (
                <div className="text-sm text-ink-muted">
                  Tahun ajaran: {selectedYearLabel}
                </div>
              ) : null}
            </div>

            <div className="text-xs text-ink-muted">Total: {total} periode</div>
          </div>

          <div className="mt-4">
            <DataTable
              data={academicPeriodsQuery.data?.data ?? []}
              columns={columns}
              showToolbar={false}
              enableColumnFilters={false}
              enableGlobalFilter={false}
              enableRowSelection={false}
              showPagination
              state={{ pagination }}
              onPaginationChange={(updater) =>
                setPagination((prev) =>
                  typeof updater === "function" ? updater(prev) : updater,
                )
              }
              tableOptions={{
                manualPagination: true,
                pageCount,
              }}
              emptyMessage={
                academicPeriodsQuery.isLoading
                  ? "Memuat data..."
                  : "Belum ada periode akademik"
              }
            />
          </div>
        </div>
      ) : null}

      {isCreateOpen ? (
        <CreateAcademicPeriodModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          isSubmitting={createPeriod.isPending}
          existingPeriods={academicPeriodsQuery.data?.data ?? []}
          onSubmit={async (values) => {
            if (!academicYearId) {
              return;
            }

            await createPeriod.mutateAsync({
              academicYearId,
              name: values.name,
              startDate: values.startDate,
              endDate: values.endDate,
              makeActive: values.makeActive,
            });

            setIsCreateOpen(false);
            showFeedback({
              tone: "success",
              title: "Periode akademik berhasil dibuat",
              description: `${values.name} berhasil ditambahkan.`,
            });
          }}
        />
      ) : null}
      <FeedbackDialog />
      <ConfirmDialog />
    </div>
  );
}

function renderStatusBadge(
  status: AcademicPeriod["status"],
  isActive: boolean,
) {
  let label = "Arsip";
  let className = "bg-surface-2 text-ink-muted";
  if (isActive) {
    label = "Aktif";
    className = "bg-primary/10 text-primary";
  } else if (status === "DRAFT") {
    label = "Draft";
    className = "bg-info/10 text-info";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
        className,
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          isActive
            ? "bg-primary"
            : status === "DRAFT"
              ? "bg-info"
              : "bg-ink-muted/60",
        )}
      />
      {label}
    </span>
  );
}
