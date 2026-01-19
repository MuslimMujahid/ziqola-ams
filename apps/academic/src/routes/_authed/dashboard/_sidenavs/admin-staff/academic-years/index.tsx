import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  CheckCircle2Icon,
  Loader2Icon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/lib/utils/use-confirm";
import { useFeedbackDialog } from "@/lib/utils/use-feedback-dialog";
import {
  type AcademicYear,
  useAcademicYears,
  useCreateAcademicYear,
  useActivateAcademicYear,
  useDeleteAcademicYear,
} from "@/lib/services/api/academic";
import { CreateNewYearModal } from "@/components/academic-years/create-new-year-modal";
import { formatDateLocal, renderDateRange } from "@/lib/utils/date";

export const Route = createFileRoute(
  "/_authed/dashboard/_sidenavs/admin-staff/academic-years/",
)({
  component: AcademicYearsPage,
  pendingComponent: () => (
    <div className="flex items-center justify-center py-10 text-ink-muted">
      <Loader2Icon className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span className="ml-2 text-sm">Memuat data tahun ajaran...</span>
    </div>
  ),
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  ),
});

function AcademicYearsPage() {
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

  const queryParams = React.useMemo(
    () => ({
      offset: pagination.pageIndex * pagination.pageSize,
      limit: pagination.pageSize,
      search: search || undefined,
    }),
    [pagination.pageIndex, pagination.pageSize, search],
  );

  const academicYearsQuery = useAcademicYears(queryParams);
  const createYear = useCreateAcademicYear();
  const activateYear = useActivateAcademicYear();
  const deleteYear = useDeleteAcademicYear();

  const total = academicYearsQuery.data?.meta.total ?? 0;
  const pageCount = pagination.pageSize
    ? Math.max(Math.ceil(total / pagination.pageSize), 1)
    : 1;

  const handleActivate = React.useCallback(
    async (id: string) => {
      const confirmed = await confirm({
        title: "Aktifkan tahun ajaran ini?",
        description: "Tahun aktif sebelumnya akan diarsipkan.",
        confirmText: "Aktifkan",
        cancelText: "Batal",
      });
      if (!confirmed) {
        return;
      }
      await activateYear.mutateAsync({ id });
    },
    [activateYear, confirm],
  );

  const handleDelete = React.useCallback(
    async (id: string) => {
      const confirmed = await confirm({
        title: "Hapus tahun ajaran ini?",
        description: "Data tahun ajaran ini tidak akan tampil lagi.",
        confirmText: "Hapus",
        cancelText: "Batal",
        confirmVariant: "destructive",
      });
      if (!confirmed) {
        return;
      }
      await deleteYear.mutateAsync({ id });
    },
    [confirm, deleteYear],
  );

  const columns = React.useMemo<ColumnDef<AcademicYear>[]>(
    () => [
      {
        header: "Tahun ajaran",
        accessorKey: "label",
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-medium text-ink-strong">
              {row.original.label}
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
        cell: ({ row }) => renderStatusBadge(row.original.status),
      },
      {
        header: "Aksi",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            {row.original.status !== "ACTIVE" && !activateYear.isPending ? (
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
            {row.original.status === "ARCHIVED" &&
            !deleteYear.isPending &&
            !academicYearsQuery.isFetching ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-error hover:text-error"
                onClick={() => handleDelete(row.original.id)}
              >
                <Trash2Icon className="h-4 w-4" aria-hidden="true" />
                Hapus
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [
      activateYear.isPending,
      deleteYear.isPending,
      academicYearsQuery.isFetching,
      handleActivate,
      handleDelete,
    ],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-strong">
            Tahun ajaran
          </h1>
          <p className="text-sm text-ink-muted">
            Kelola daftar tahun ajaran dan tentukan yang aktif.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => academicYearsQuery.refetch()}
            className="gap-2"
          >
            <RefreshCwIcon className="h-4 w-4" aria-hidden="true" />
            Muat ulang
          </Button>
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="gap-2"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Buat tahun ajaran baru
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-surface-contrast p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-xs">
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cari tahun ajaran"
                className="w-full"
              />
            </div>
          </div>

          <div className="text-xs text-ink-muted">
            Total: {total} tahun ajaran
          </div>
        </div>

        <div className="mt-4">
          <DataTable
            data={academicYearsQuery.data?.data ?? []}
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
              academicYearsQuery.isLoading
                ? "Memuat data..."
                : "Belum ada tahun ajaran"
            }
          />
        </div>
      </div>

      {isCreateOpen ? (
        <CreateNewYearModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          existingYears={academicYearsQuery.data?.data ?? []}
          onSubmit={async (values) => {
            await createYear.mutateAsync({
              label: values.label,
              startDate: values.startDate || undefined,
              endDate: values.endDate || undefined,
              makeActive: values.makeActive,
            });
            setIsCreateOpen(false);
            showFeedback({
              tone: "success",
              title: "Tahun ajaran berhasil dibuat",
              description: values.makeActive
                ? `Tahun ajaran ${values.label} sudah aktif.`
                : `Tahun ajaran ${values.label} berhasil disimpan.`,
            });
          }}
          isSubmitting={createYear.isPending}
        />
      ) : null}
      <FeedbackDialog />
      <ConfirmDialog />
    </div>
  );
}

function renderStatusBadge(status: AcademicYear["status"]) {
  const isActive = status === "ACTIVE";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
        isActive ? "bg-primary/10 text-primary" : "bg-surface-2 text-ink-muted",
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          isActive ? "bg-primary" : "bg-ink-muted/60",
        )}
      />
      {isActive ? "Aktif" : "Arsip"}
    </span>
  );
}
