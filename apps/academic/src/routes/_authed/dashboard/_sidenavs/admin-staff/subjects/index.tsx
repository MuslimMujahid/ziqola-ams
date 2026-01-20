import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import {
  type GetSubjectsVars,
  type Subject,
  useCreateSubject,
  useDeleteSubject,
  useSubjects,
  useUpdateSubject,
} from "@/lib/services/api/subjects";
import { useConfirm } from "@/lib/utils/use-confirm";
import { useFeedbackDialog } from "@/lib/utils/use-feedback-dialog";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { SubjectsFormModal } from "./-components/-subjects-form-modal";

export const Route = createFileRoute(
  "/_authed/dashboard/_sidenavs/admin-staff/subjects/",
)({
  component: SubjectsPage,
  pendingComponent: PendingSubjects,
  errorComponent: SubjectsError,
});

function PendingSubjects() {
  return (
    <div className="flex items-center justify-center py-10 text-ink-muted">
      <Loader2Icon className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span className="ml-2 text-sm">Memuat data mata pelajaran...</span>
    </div>
  );
}

function SubjectsError({ error }: { error: Error }) {
  return (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  );
}

function SubjectsPage() {
  const [searchInput, setSearchInput] = React.useState("");

  const [search, setSearch] = React.useState("");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<"create" | "edit">("create");
  const [selectedSubject, setSelectedSubject] = React.useState<Subject | null>(
    null,
  );
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

  const queryParams = React.useMemo<GetSubjectsVars>(
    () => ({
      offset: pagination.pageIndex * pagination.pageSize,
      limit: pagination.pageSize,
      search: search || undefined,
    }),
    [pagination.pageIndex, pagination.pageSize, search],
  );

  const subjectsQuery = useSubjects(queryParams);
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  const total = subjectsQuery.data?.meta.total ?? 0;
  const pageCount = pagination.pageSize
    ? Math.max(Math.ceil(total / pagination.pageSize), 1)
    : 1;

  const openCreate = React.useCallback(() => {
    setFormMode("create");
    setSelectedSubject(null);
    setIsFormOpen(true);
  }, []);

  const openEdit = React.useCallback((subject: Subject) => {
    setFormMode("edit");
    setSelectedSubject(subject);
    setIsFormOpen(true);
  }, []);

  const handleDelete = React.useCallback(
    async (subject: Subject) => {
      const confirmed = await confirm({
        title: `Hapus mata pelajaran ${subject.name}?`,
        description:
          "Jika masih digunakan, data akan ditandai dihapus (soft delete).",
        confirmText: "Hapus",
        cancelText: "Batal",
        confirmVariant: "destructive",
      });

      if (!confirmed) return;

      await deleteSubject.mutateAsync({ id: subject.id });
      showFeedback({
        tone: "success",
        title: "Mata pelajaran dihapus",
        description: `${subject.name} berhasil dihapus atau ditandai dihapus.`,
      });
    },
    [confirm, deleteSubject, showFeedback],
  );

  const columns = React.useMemo<ColumnDef<Subject>[]>(
    () => [
      {
        header: "Mata pelajaran",
        accessorKey: "name",
        cell: ({ row }) => (
          <div className="font-medium text-ink-strong">{row.original.name}</div>
        ),
      },
      {
        header: "Aksi",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => openEdit(row.original)}
            >
              <PencilIcon className="h-4 w-4" aria-hidden="true" />
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-error hover:text-error"
              onClick={() => handleDelete(row.original)}
              disabled={deleteSubject.isPending}
            >
              <Trash2Icon className="h-4 w-4" aria-hidden="true" />
              Hapus
            </Button>
          </div>
        ),
      },
    ],
    [deleteSubject.isPending, handleDelete, openEdit],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-strong">
            Mata pelajaran
          </h1>
          <p className="text-sm text-ink-muted">
            Kelola daftar mata pelajaran untuk tenant ini.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => subjectsQuery.refetch()}
            className="gap-2"
          >
            <RefreshCwIcon className="h-4 w-4" aria-hidden="true" />
            Muat ulang
          </Button>
          <Button type="button" onClick={openCreate} className="gap-2">
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Tambah mata pelajaran
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
                placeholder="Cari mata pelajaran"
                className="w-full"
              />
            </div>
          </div>

          <div className="text-xs text-ink-muted">
            Total: {total} mata pelajaran
          </div>
        </div>

        <div className="mt-4">
          <DataTable
            data={subjectsQuery.data?.data ?? []}
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
              subjectsQuery.isLoading
                ? "Memuat data..."
                : "Belum ada mata pelajaran"
            }
          />
        </div>
      </div>

      {isFormOpen ? (
        <SubjectsFormModal
          isOpen={isFormOpen}
          mode={formMode}
          isSubmitting={createSubject.isPending || updateSubject.isPending}
          initialValues={
            selectedSubject ? { name: selectedSubject.name } : undefined
          }
          onClose={() => setIsFormOpen(false)}
          onSubmit={async (values) => {
            if (formMode === "create") {
              await createSubject.mutateAsync(values);
              showFeedback({
                tone: "success",
                title: "Mata pelajaran dibuat",
                description: `${values.name} berhasil ditambahkan.`,
              });
            } else if (selectedSubject) {
              await updateSubject.mutateAsync({
                id: selectedSubject.id,
                name: values.name,
              });
              showFeedback({
                tone: "success",
                title: "Mata pelajaran diperbarui",
                description: `${values.name} berhasil diperbarui.`,
              });
            }

            setIsFormOpen(false);
          }}
        />
      ) : null}
      <FeedbackDialog />
      <ConfirmDialog />
    </div>
  );
}
