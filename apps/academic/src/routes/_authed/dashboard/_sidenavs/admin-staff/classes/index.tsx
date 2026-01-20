import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
  UserCheckIcon,
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
  type ClassItem,
  useAssignHomeroom,
  useClasses,
  useCreateClass,
  useDeleteClass,
  useUpdateClass,
} from "@/lib/services/api/classes";
import { useAcademicYears } from "@/lib/services/api/academic";
import { useGroups } from "@/lib/services/api/groups";
import { ClassesFormModal } from "./-components/-classes-form-modal";
import { AssignHomeroomModal } from "./-components/-assign-homeroom-modal";
import { useWorkspaceStore } from "@/stores/workspace.store";

export const Route = createFileRoute(
  "/_authed/dashboard/_sidenavs/admin-staff/classes/",
)({
  component: ClassesPage,
  pendingComponent: () => (
    <div className="flex items-center justify-center py-10 text-ink-muted">
      <Loader2Icon className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span className="ml-2 text-sm">Memuat data kelas...</span>
    </div>
  ),
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  ),
});

function ClassesPage() {
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [groupFilterId, setGroupFilterId] = React.useState<string | "ALL">(
    "ALL",
  );
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<"create" | "edit">("create");
  const [selectedClass, setSelectedClass] = React.useState<ClassItem | null>(
    null,
  );
  const [isHomeroomOpen, setIsHomeroomOpen] = React.useState(false);

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

  const workspace = useWorkspaceStore();
  const academicYearId = workspace.academicYearId ?? undefined;
  const academicYearsQuery = useAcademicYears({
    offset: 0,
    limit: 50,
  });

  const groupOptionsQuery = useGroups({
    offset: 0,
    limit: 200,
  });

  const queryParams = React.useMemo(
    () => ({
      offset: pagination.pageIndex * pagination.pageSize,
      limit: pagination.pageSize,
      search: search || undefined,
      academicYearId,
      groupId: groupFilterId === "ALL" ? undefined : groupFilterId,
    }),
    [
      pagination.pageIndex,
      pagination.pageSize,
      search,
      academicYearId,
      groupFilterId,
    ],
  );

  const classesQuery = useClasses(queryParams, {
    enabled: Boolean(academicYearId),
  });

  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();
  const assignHomeroom = useAssignHomeroom();

  const total = classesQuery.data?.meta.total ?? 0;
  const pageCount = pagination.pageSize
    ? Math.max(Math.ceil(total / pagination.pageSize), 1)
    : 1;

  const openCreate = React.useCallback(() => {
    setFormMode("create");
    setSelectedClass(null);
    setIsFormOpen(true);
  }, []);

  const openEdit = React.useCallback((classItem: ClassItem) => {
    setFormMode("edit");
    setSelectedClass(classItem);
    setIsFormOpen(true);
  }, []);

  const openHomeroom = React.useCallback((classItem: ClassItem) => {
    setSelectedClass(classItem);
    setIsHomeroomOpen(true);
  }, []);

  const handleDelete = React.useCallback(
    async (classItem: ClassItem) => {
      const confirmed = await confirm({
        title: `Hapus kelas ${classItem.name}?`,
        description:
          "Kelas tidak dapat dihapus jika sudah memiliki data akademik.",
        confirmText: "Hapus",
        cancelText: "Batal",
        confirmVariant: "destructive",
      });

      if (!confirmed) {
        return;
      }

      await deleteClass.mutateAsync({ id: classItem.id });
      showFeedback({
        tone: "success",
        title: "Kelas dihapus",
        description: `${classItem.name} berhasil dihapus.`,
      });
    },
    [confirm, deleteClass, showFeedback],
  );

  const renderGroupChips = React.useCallback((groups: ClassItem["groups"]) => {
    if (groups.length === 0) {
      return <span className="text-xs text-ink-muted">Belum ada</span>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {groups.map((group) => (
          <span
            key={group.id}
            className={cn(
              "rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-ink-muted",
              group.type === "GRADE" && "bg-primary/10 text-primary",
            )}
          >
            {group.name}
          </span>
        ))}
      </div>
    );
  }, []);

  const columns = React.useMemo<ColumnDef<ClassItem>[]>(
    () => [
      {
        header: "Kelas",
        accessorKey: "name",
        cell: ({ row }) => (
          <div className="font-medium text-ink-strong">{row.original.name}</div>
        ),
      },
      {
        header: "Rombongan Belajar",
        cell: ({ row }) => renderGroupChips(row.original.groups),
      },
      {
        header: "Wali kelas",
        cell: ({ row }) => (
          <span className="text-sm text-ink">
            {row.original.homeroomTeacher?.name ?? "Belum ditetapkan"}
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
              variant="outline"
              onClick={() => openHomeroom(row.original)}
            >
              <UserCheckIcon className="h-4 w-4" aria-hidden="true" />
              Wali kelas
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-error hover:text-error"
              onClick={() => handleDelete(row.original)}
              disabled={deleteClass.isPending}
            >
              <Trash2Icon className="h-4 w-4" aria-hidden="true" />
              Hapus
            </Button>
          </div>
        ),
      },
    ],
    [
      deleteClass.isPending,
      handleDelete,
      openEdit,
      openHomeroom,
      renderGroupChips,
    ],
  );

  const isYearMissing = !academicYearId && !academicYearsQuery.isLoading;

  const selectedYearLabel = academicYearsQuery.data?.data.find(
    (year) => year.id === academicYearId,
  )?.label;

  const resolveGroupIds = React.useCallback(
    (values: { gradeGroupId?: string; groupId?: string }) => {
      const groupIds = [values.gradeGroupId, values.groupId].filter(
        (id): id is string => Boolean(id),
      );

      return groupIds;
    },
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-strong">Kelas</h1>
          <p className="text-sm text-ink-muted">
            Kelola daftar kelas, rombongan belajar, dan wali kelas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => classesQuery.refetch()}
            className="gap-2"
            disabled={!academicYearId}
          >
            <RefreshCwIcon className="h-4 w-4" aria-hidden="true" />
            Muat ulang
          </Button>
          <Button
            type="button"
            onClick={openCreate}
            className="gap-2"
            disabled={!academicYearId}
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Tambah kelas
          </Button>
        </div>
      </div>

      {isYearMissing ? (
        <div className="rounded-xl bg-surface-contrast p-6 text-sm text-ink-muted">
          Pilih tahun ajaran di workspace untuk menampilkan data kelas.
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
                  placeholder="Cari kelas"
                  className="w-full"
                />
              </div>
              <Select
                value={groupFilterId}
                onValueChange={(value) => setGroupFilterId(value)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Rombongan Belajar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua rombel</SelectItem>
                  {(groupOptionsQuery.data?.data ?? []).map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs text-ink-muted">Total: {total} kelas</div>
          </div>

          <div className="mt-4">
            <DataTable
              data={classesQuery.data?.data ?? []}
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
                classesQuery.isLoading ? "Memuat data..." : "Belum ada kelas"
              }
            />
          </div>
        </div>
      ) : null}

      {isFormOpen ? (
        <ClassesFormModal
          isOpen={isFormOpen}
          mode={formMode}
          isSubmitting={createClass.isPending || updateClass.isPending}
          academicYears={academicYearsQuery.data?.data ?? []}
          groups={groupOptionsQuery.data?.data ?? []}
          lockAcademicYear={Boolean(academicYearId)}
          lockedAcademicYearLabel={selectedYearLabel ?? null}
          initialValues={
            selectedClass
              ? {
                  name: selectedClass.name,
                  academicYearId: selectedClass.academicYearId,
                  gradeGroupId: selectedClass.groups.find(
                    (group) => group.type === "GRADE",
                  )?.id,
                  groupId: selectedClass.groups.find(
                    (group) => group.type !== "GRADE",
                  )?.id,
                }
              : {
                  name: "",
                  academicYearId,
                  gradeGroupId: undefined,
                  groupId: undefined,
                }
          }
          onClose={() => setIsFormOpen(false)}
          onSubmit={async (values) => {
            const groupIds = resolveGroupIds(values);

            if (formMode === "create") {
              if (!values.academicYearId) {
                return;
              }
              await createClass.mutateAsync({
                name: values.name,
                academicYearId: values.academicYearId,
                groupIds,
              });
              showFeedback({
                tone: "success",
                title: "Kelas berhasil dibuat",
                description: `${values.name} telah ditambahkan.`,
              });
            } else if (selectedClass) {
              await updateClass.mutateAsync({
                id: selectedClass.id,
                name: values.name,
                groupIds,
              });
              showFeedback({
                tone: "success",
                title: "Kelas diperbarui",
                description: `${values.name} berhasil diperbarui.`,
              });
            }

            setIsFormOpen(false);
          }}
        />
      ) : null}

      {isHomeroomOpen ? (
        <AssignHomeroomModal
          isOpen={isHomeroomOpen}
          classItem={selectedClass}
          isSubmitting={assignHomeroom.isPending}
          onClose={() => setIsHomeroomOpen(false)}
          onSubmit={async (values) => {
            if (!selectedClass) {
              return;
            }

            await assignHomeroom.mutateAsync({
              id: selectedClass.id,
              teacherProfileId: values.teacherProfileId,
            });
            showFeedback({
              tone: "success",
              title: "Wali kelas diperbarui",
              description: `Wali kelas untuk ${selectedClass.name} berhasil diperbarui.`,
            });
            setIsHomeroomOpen(false);
          }}
        />
      ) : null}

      <FeedbackDialog />
      <ConfirmDialog />
    </div>
  );
}
