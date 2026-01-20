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
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/lib/utils/use-confirm";
import { useFeedbackDialog } from "@/lib/utils/use-feedback-dialog";
import {
  type Group,
  type GroupType,
  useCreateGroup,
  useDeleteGroup,
  useGroups,
  useUpdateGroup,
} from "@/lib/services/api/groups";
import { GroupsFormModal } from "./-components/-groups-form-modal";

export const Route = createFileRoute(
  "/_authed/dashboard/_sidenavs/admin-staff/groups/",
)({
  component: GroupsPage,
  pendingComponent: () => (
    <div className="flex items-center justify-center py-10 text-ink-muted">
      <Loader2Icon className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span className="ml-2 text-sm">Memuat data rombongan belajar...</span>
    </div>
  ),
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  ),
});

const GROUP_TYPE_LABELS: Record<GroupType, string> = {
  GRADE: "Tingkat",
  STREAM: "Jurusan",
  PROGRAM: "Program",
  CUSTOM: "Kustom",
};

const GROUP_TYPE_BADGE: Record<GroupType, string> = {
  GRADE: "bg-primary/10 text-primary",
  STREAM: "bg-info/10 text-info",
  PROGRAM: "bg-success/10 text-success",
  CUSTOM: "bg-surface-2 text-ink-muted",
};

const GROUP_TYPE_OPTIONS: Array<{ label: string; value: GroupType | "ALL" }> = [
  { label: "Semua tipe", value: "ALL" },
  { label: "Jurusan", value: "STREAM" },
  { label: "Program", value: "PROGRAM" },
  { label: "Kustom", value: "CUSTOM" },
];

function GroupsPage() {
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [selectedType, setSelectedType] = React.useState<GroupType | "ALL">(
    "ALL",
  );
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<"create" | "edit">("create");
  const [selectedGroup, setSelectedGroup] = React.useState<Group | null>(null);
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
      type:
        selectedType === "ALL" || selectedType === "GRADE"
          ? undefined
          : selectedType,
    }),
    [pagination.pageIndex, pagination.pageSize, search, selectedType],
  );

  const groupsQuery = useGroups(queryParams);
  const createGroup = useCreateGroup();
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();

  const total = groupsQuery.data?.meta.total ?? 0;
  const pageCount = pagination.pageSize
    ? Math.max(Math.ceil(total / pagination.pageSize), 1)
    : 1;

  const openCreate = React.useCallback(() => {
    setFormMode("create");
    setSelectedGroup(null);
    setIsFormOpen(true);
  }, []);

  const openEdit = React.useCallback((group: Group) => {
    setFormMode("edit");
    setSelectedGroup(group);
    setIsFormOpen(true);
  }, []);

  const handleDelete = React.useCallback(
    async (group: Group) => {
      const confirmed = await confirm({
        title: `Hapus rombongan belajar ${group.name}?`,
        description:
          "Rombongan belajar akan dihapus jika belum dipakai di kelas manapun.",
        confirmText: "Hapus",
        cancelText: "Batal",
        confirmVariant: "destructive",
      });

      if (!confirmed) {
        return;
      }

      await deleteGroup.mutateAsync({ id: group.id });
      showFeedback({
        tone: "success",
        title: "Rombongan belajar dihapus",
        description: `${group.name} berhasil dihapus.`,
      });
    },
    [confirm, deleteGroup, showFeedback],
  );

  const columns = React.useMemo<ColumnDef<Group>[]>(
    () => [
      {
        header: "Rombongan Belajar",
        accessorKey: "name",
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-medium text-ink-strong">
              {row.original.name}
            </div>
            <p className="text-xs text-ink-muted">
              {row.original.classCount ?? 0} kelas terhubung
            </p>
          </div>
        ),
      },
      {
        header: "Tipe",
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
              GROUP_TYPE_BADGE[row.original.type],
            )}
          >
            {GROUP_TYPE_LABELS[row.original.type]}
          </span>
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
              disabled={deleteGroup.isPending}
            >
              <Trash2Icon className="h-4 w-4" aria-hidden="true" />
              Hapus
            </Button>
          </div>
        ),
      },
    ],
    [deleteGroup.isPending, handleDelete, openEdit],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-strong">
            Rombongan Belajar
          </h1>
          <p className="text-sm text-ink-muted">
            Kelola klasifikasi kelas berdasarkan tingkat, jurusan, atau program.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => groupsQuery.refetch()}
            className="gap-2"
          >
            <RefreshCwIcon className="h-4 w-4" aria-hidden="true" />
            Muat ulang
          </Button>
          <Button type="button" onClick={openCreate} className="gap-2">
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Tambah rombongan belajar
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
                placeholder="Cari rombongan belajar"
                className="w-full"
              />
            </div>
            <Select
              value={selectedType}
              onValueChange={(value) =>
                setSelectedType(value as GroupType | "ALL")
              }
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Filter tipe" />
              </SelectTrigger>
              <SelectContent>
                {GROUP_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs text-ink-muted">
            Total: {total} rombongan belajar
          </div>
        </div>

        <div className="mt-4">
          <DataTable
            data={(groupsQuery.data?.data ?? []).filter(
              (group) => group.type !== "GRADE",
            )}
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
              groupsQuery.isLoading
                ? "Memuat data..."
                : "Belum ada rombongan belajar"
            }
          />
        </div>
      </div>

      {isFormOpen ? (
        <GroupsFormModal
          isOpen={isFormOpen}
          mode={formMode}
          allowGrade={false}
          isSubmitting={createGroup.isPending || updateGroup.isPending}
          initialValues={
            selectedGroup
              ? { name: selectedGroup.name, type: selectedGroup.type }
              : undefined
          }
          onClose={() => setIsFormOpen(false)}
          onSubmit={async (values) => {
            if (formMode === "create") {
              await createGroup.mutateAsync(values);
              showFeedback({
                tone: "success",
                title: "Rombongan belajar berhasil dibuat",
                description: `${values.name} telah ditambahkan.`,
              });
            } else if (selectedGroup) {
              await updateGroup.mutateAsync({
                id: selectedGroup.id,
                name: values.name,
                type: values.type,
              });
              showFeedback({
                tone: "success",
                title: "Rombongan belajar diperbarui",
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
