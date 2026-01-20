import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Loader2Icon, PencilIcon, PlusIcon, RefreshCwIcon } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { useFeedbackDialog } from "@/lib/utils/use-feedback-dialog";
import { useAuthStore } from "@/stores/auth.store";
import { useRegisterUser } from "@/lib/services/api/auth";
import {
  type TeacherProfile,
  useCreateTeacherProfile,
  useTeacherProfile,
  useTeacherProfiles,
  useUpdateTeacherProfile,
} from "@/lib/services/api/teachers";
import { TeachersFormModal } from "./-components/-teachers-form-modal";
import { TeachersEditModal } from "./-components/-teachers-edit-modal";

export const Route = createFileRoute(
  "/_authed/dashboard/_sidenavs/admin-staff/teachers/",
)({
  component: TeachersPage,
  pendingComponent: () => (
    <div className="flex items-center justify-center py-10 text-ink-muted">
      <Loader2Icon className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span className="ml-2 text-sm">Memuat data guru...</span>
    </div>
  ),
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  ),
});

function TeachersPage() {
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [selectedTeacher, setSelectedTeacher] =
    React.useState<TeacherProfile | null>(null);

  const { showFeedback, FeedbackDialog } = useFeedbackDialog();
  const user = useAuthStore((state) => state.user);

  const registerUser = useRegisterUser();
  const createProfile = useCreateTeacherProfile();
  const updateProfile = useUpdateTeacherProfile();

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

  const teachersQuery = useTeacherProfiles(queryParams);
  const teacherDetailQuery = useTeacherProfile(selectedTeacher?.id ?? "", {
    enabled: Boolean(selectedTeacher?.id) && isEditOpen,
  });

  const total = teachersQuery.data?.meta.total ?? 0;
  const pageCount = pagination.pageSize
    ? Math.max(Math.ceil(total / pagination.pageSize), 1)
    : 1;

  const openEdit = React.useCallback((teacher: TeacherProfile) => {
    setSelectedTeacher(teacher);
    setIsEditOpen(true);
  }, []);

  const normalizeOptional = React.useCallback((value?: string) => {
    if (!value) {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, []);

  const getErrorMessage = React.useCallback(
    (error: unknown, fallback: string) =>
      error instanceof Error ? error.message : fallback,
    [],
  );

  const handleCreate = React.useCallback(
    async (values: {
      name: string;
      email: string;
      password: string;
      gender?: "MALE" | "FEMALE" | "none";
      dateOfBirth?: string;
      phoneNumber?: string;
      nip?: string;
      nuptk?: string;
      hiredAt?: string;
    }) => {
      if (!user?.tenantId) {
        showFeedback({
          tone: "warning",
          title: "Tenant belum tersedia",
          description: "Login ulang atau pilih tenant yang benar.",
        });
        return;
      }

      let createdUserEmail: string | null = null;

      try {
        const registerResponse = await registerUser.mutateAsync({
          tenantId: user.tenantId,
          role: "TEACHER",
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password,
          gender: values.gender === "none" ? undefined : values.gender,
          dateOfBirth: normalizeOptional(values.dateOfBirth),
          phoneNumber: normalizeOptional(values.phoneNumber),
        });

        createdUserEmail = registerResponse.data.user.email;

        await createProfile.mutateAsync({
          userId: registerResponse.data.user.id,
          nip: normalizeOptional(values.nip),
          nuptk: normalizeOptional(values.nuptk),
          hiredAt: normalizeOptional(values.hiredAt),
        });

        setIsCreateOpen(false);
        showFeedback({
          tone: "success",
          title: "Guru berhasil dibuat",
          description: `${values.name} sudah ditambahkan ke daftar guru.`,
        });
      } catch (error) {
        if (createdUserEmail) {
          setIsCreateOpen(false);
          showFeedback({
            tone: "warning",
            title: "Profil guru belum lengkap",
            description:
              "Akun guru berhasil dibuat, namun profil guru gagal disimpan. Silakan lengkapi dari modul Pengguna.",
          });
        } else {
          showFeedback({
            tone: "error",
            title: "Gagal menambah guru",
            description: getErrorMessage(
              error,
              "Periksa kembali data yang diisi lalu coba lagi.",
            ),
          });
        }
      }
    },
    [
      createProfile,
      getErrorMessage,
      normalizeOptional,
      registerUser,
      showFeedback,
      user?.tenantId,
    ],
  );

  const handleUpdate = React.useCallback(
    async (values: { nip?: string; nuptk?: string; hiredAt?: string }) => {
      if (!selectedTeacher) {
        return;
      }
      try {
        await updateProfile.mutateAsync({
          id: selectedTeacher.id,
          nip: normalizeOptional(values.nip),
          nuptk: normalizeOptional(values.nuptk),
          hiredAt: normalizeOptional(values.hiredAt),
        });

        setIsEditOpen(false);
        showFeedback({
          tone: "success",
          title: "Identitas guru diperbarui",
          description: `${selectedTeacher.user.name} berhasil diperbarui.`,
        });
      } catch (error) {
        showFeedback({
          tone: "error",
          title: "Gagal memperbarui guru",
          description: getErrorMessage(
            error,
            "Periksa kembali data yang diisi lalu coba lagi.",
          ),
        });
      }
    },
    [
      getErrorMessage,
      normalizeOptional,
      selectedTeacher,
      showFeedback,
      updateProfile,
    ],
  );

  const columns = React.useMemo<ColumnDef<TeacherProfile>[]>(
    () => [
      {
        header: "Guru",
        accessorKey: "user.name",
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-medium text-ink-strong">
              {row.original.user.name}
            </div>
            <p className="text-xs text-ink-muted">{row.original.user.email}</p>
          </div>
        ),
      },
      {
        header: "NIP / NUPTK",
        cell: ({ row }) => (
          <div className="text-sm text-ink">
            <div>{row.original.nip ?? "-"}</div>
            <div className="text-xs text-ink-muted">
              {row.original.nuptk ?? "-"}
            </div>
          </div>
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
          </div>
        ),
      },
    ],
    [openEdit],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-strong">Guru</h1>
          <p className="text-sm text-ink-muted">
            Kelola data guru dan identitas kepegawaian.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => teachersQuery.refetch()}
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
            Tambah guru
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
                placeholder="Cari guru"
                className="w-full"
              />
            </div>
          </div>

          <div className="text-xs text-ink-muted">Total: {total} guru</div>
        </div>

        <div className="mt-4">
          <DataTable
            data={teachersQuery.data?.data ?? []}
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
              teachersQuery.isLoading ? "Memuat data..." : "Belum ada guru"
            }
          />
        </div>
      </div>

      {isCreateOpen ? (
        <TeachersFormModal
          isOpen={isCreateOpen}
          isSubmitting={registerUser.isPending || createProfile.isPending}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreate}
        />
      ) : null}

      {isEditOpen ? (
        <TeachersEditModal
          key={selectedTeacher?.id ?? "teacher-edit"}
          isOpen={isEditOpen}
          teacher={teacherDetailQuery.data?.data ?? selectedTeacher}
          isSubmitting={updateProfile.isPending}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleUpdate}
        />
      ) : null}

      <FeedbackDialog />
    </div>
  );
}
