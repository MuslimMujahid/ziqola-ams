import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Loader2Icon, PencilIcon, PlusIcon, RefreshCwIcon } from "lucide-react";

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
import { useFeedbackDialog } from "@/lib/utils/use-feedback-dialog";
import { useAuthStore } from "@/stores/auth.store";
import {
  type StudentListItem,
  useCreateStudentProfile,
  useStudents,
  useUpdateStudentProfile,
} from "@/lib/services/api/students";
import {
  useAcademicPeriods,
  useAcademicYears,
} from "@/lib/services/api/academic";
import { useClasses } from "@/lib/services/api/classes";
import { useRegisterUser } from "@/lib/services/api/auth";
import { useCreateEnrollment } from "@/lib/services/api/enrollments";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { StudentsFormModal } from "./(components)/students-form-modal";
import { StudentsEditModal } from "./(components)/students-edit-modal";
import { StudentsEnrollmentModal } from "./(components)/students-enrollment-modal";

const ALL_FILTER = "ALL" as const;
const NO_CLASS_FILTER = "NO_CLASS" as const;

export const Route = createFileRoute(
  "/_authed/dashboard/_sidenavs/admin-staff/students/",
)({
  component: StudentsPage,
  pendingComponent: () => (
    <div className="flex items-center justify-center py-10 text-ink-muted">
      <Loader2Icon className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span className="ml-2 text-sm">Memuat data siswa...</span>
    </div>
  ),
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  ),
});

function StudentsPage() {
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [classId, setClassId] = React.useState<
    string | typeof ALL_FILTER | typeof NO_CLASS_FILTER
  >(ALL_FILTER);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = React.useState(false);
  const [enrollMode, setEnrollMode] = React.useState<"assign" | "change">(
    "assign",
  );
  const [selectedStudent, setSelectedStudent] =
    React.useState<StudentListItem | null>(null);

  const { showFeedback, FeedbackDialog } = useFeedbackDialog();
  const user = useAuthStore((state) => state.user);

  const registerUser = useRegisterUser();
  const createProfile = useCreateStudentProfile();
  const updateProfile = useUpdateStudentProfile();
  const createEnrollment = useCreateEnrollment();

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
  const academicPeriodId = workspace.academicPeriodId ?? undefined;
  const academicYearsQuery = useAcademicYears({ offset: 0, limit: 50 });
  const academicPeriodsQuery = useAcademicPeriods(
    { offset: 0, limit: 50, academicYearId },
    { enabled: Boolean(academicYearId) },
  );

  React.useEffect(() => {
    setClassId(ALL_FILTER);
  }, [academicYearId]);

  const classOptionsQuery = useClasses(
    {
      offset: 0,
      limit: 200,
      academicYearId,
    },
    { enabled: Boolean(academicYearId) },
  );

  const queryParams = React.useMemo(
    () => ({
      offset: pagination.pageIndex * pagination.pageSize,
      limit: pagination.pageSize,
      search: search || undefined,
      academicYearId,
      classId:
        classId === ALL_FILTER || classId === NO_CLASS_FILTER
          ? undefined
          : classId,
      withoutClass: classId === NO_CLASS_FILTER ? true : undefined,
    }),
    [
      pagination.pageIndex,
      pagination.pageSize,
      search,
      academicYearId,
      classId,
    ],
  );

  const studentsQuery = useStudents(queryParams, {
    enabled: Boolean(academicYearId),
  });

  const total = studentsQuery.data?.meta.total ?? 0;
  const pageCount = pagination.pageSize
    ? Math.max(Math.ceil(total / pagination.pageSize), 1)
    : 1;

  const openEdit = React.useCallback((student: StudentListItem) => {
    setSelectedStudent(student);
    setIsEditOpen(true);
  }, []);

  const openEnrollment = React.useCallback(
    (student: StudentListItem, mode: "assign" | "change") => {
      setSelectedStudent(student);
      setEnrollMode(mode);
      setIsEnrollOpen(true);
    },
    [],
  );

  const normalizeOptional = React.useCallback((value?: string) => {
    if (!value) {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, []);

  const handleCreate = React.useCallback(
    async (values: {
      name: string;
      email: string;
      password: string;
      classId: string;
      gender?: "MALE" | "FEMALE" | "none";
      dateOfBirth?: string;
      phoneNumber?: string;
      nis?: string;
      nisn?: string;
    }) => {
      if (!user?.tenantId || !academicYearId || !academicPeriodId) {
        return;
      }

      const registerResponse = await registerUser.mutateAsync({
        tenantId: user.tenantId,
        role: "STUDENT",
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        gender: values.gender === "none" ? undefined : values.gender,
        dateOfBirth: normalizeOptional(values.dateOfBirth),
        phoneNumber: normalizeOptional(values.phoneNumber),
      });

      const profile = await createProfile.mutateAsync({
        userId: registerResponse.data.user.id,
        nis: normalizeOptional(values.nis),
        nisn: normalizeOptional(values.nisn),
      });

      const selectedPeriod = academicPeriodsQuery.data?.data.find(
        (period) => period.id === academicPeriodId,
      );

      const startDate =
        selectedPeriod?.startDate ?? new Date().toISOString().slice(0, 10);

      await createEnrollment.mutateAsync({
        studentProfileId: profile.id,
        classId: values.classId,
        startDate,
      });

      setIsCreateOpen(false);
      showFeedback({
        tone: "success",
        title: "Siswa berhasil dibuat",
        description: `${values.name} sudah ditambahkan ke daftar siswa.`,
      });
    },
    [
      academicPeriodId,
      academicPeriodsQuery.data?.data,
      academicYearId,
      createEnrollment,
      createProfile,
      normalizeOptional,
      registerUser,
      showFeedback,
      user?.tenantId,
    ],
  );

  const handleUpdate = React.useCallback(
    async (values: { nis?: string; nisn?: string }) => {
      if (!selectedStudent) {
        return;
      }

      await updateProfile.mutateAsync({
        id: selectedStudent.id,
        nis: normalizeOptional(values.nis),
        nisn: normalizeOptional(values.nisn),
      });

      setIsEditOpen(false);
      showFeedback({
        tone: "success",
        title: "Identitas siswa diperbarui",
        description: `${selectedStudent.user.name} berhasil diperbarui.`,
      });
    },
    [normalizeOptional, selectedStudent, showFeedback, updateProfile],
  );

  const handleEnrollment = React.useCallback(
    async (values: {
      classId: string;
      startDate: string;
      endDate?: string;
    }) => {
      if (!selectedStudent || !academicYearId) {
        return;
      }

      await createEnrollment.mutateAsync({
        studentProfileId: selectedStudent.id,
        classId: values.classId,
        startDate: values.startDate,
        endDate: normalizeOptional(values.endDate),
      });

      setIsEnrollOpen(false);
      showFeedback({
        tone: "success",
        title: "Kelas siswa diperbarui",
        description: `${selectedStudent.user.name} sudah ditetapkan ke kelas baru.`,
      });
    },
    [
      academicYearId,
      createEnrollment,
      normalizeOptional,
      selectedStudent,
      showFeedback,
    ],
  );

  const columns = React.useMemo<ColumnDef<StudentListItem>[]>(
    () => [
      {
        header: "Siswa",
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
        header: "NIS / NISN",
        cell: ({ row }) => (
          <div className="text-sm text-ink">
            <div>{row.original.nis ?? "-"}</div>
            <div className="text-xs text-ink-muted">
              {row.original.nisn ?? "-"}
            </div>
          </div>
        ),
      },
      {
        header: "Kelas",
        cell: ({ row }) => (
          <div className="text-sm text-ink">
            {row.original.currentClass?.name ?? "Belum ada kelas"}
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
            {row.original.currentClass ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => openEnrollment(row.original, "change")}
              >
                Ganti kelas
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => openEnrollment(row.original, "assign")}
              >
                Tetapkan kelas
              </Button>
            )}
          </div>
        ),
      },
    ],
    [openEdit, openEnrollment],
  );

  const selectedYearLabel = academicYearsQuery.data?.data.find(
    (year) => year.id === academicYearId,
  )?.label;

  const isYearMissing = !academicYearId && !academicYearsQuery.isLoading;
  const isPeriodMissing = !academicPeriodId && !academicPeriodsQuery.isLoading;

  const handleOpenCreate = React.useCallback(() => {
    if (isYearMissing || isPeriodMissing) {
      showFeedback({
        tone: "warning",
        title: "Workspace tidak lengkap",
        description:
          "Pilih tahun ajaran dan periode akademik untuk menambah siswa.",
      });
      return;
    }

    setIsCreateOpen(true);
  }, [isPeriodMissing, isYearMissing, showFeedback]);

  const defaultClassId =
    classId === ALL_FILTER || classId === NO_CLASS_FILTER ? "" : classId;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-strong">Siswa</h1>
          <p className="text-sm text-ink-muted">
            Kelola data siswa dan identitas akademik.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => studentsQuery.refetch()}
            className="gap-2"
          >
            <RefreshCwIcon className="h-4 w-4" aria-hidden="true" />
            Muat ulang
          </Button>
          <Button type="button" onClick={handleOpenCreate} className="gap-2">
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Tambah siswa
          </Button>
        </div>
      </div>

      {isYearMissing ? (
        <div className="rounded-xl bg-surface-contrast p-6 text-sm text-ink-muted">
          Pilih tahun ajaran di workspace untuk menampilkan data siswa.
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
                  placeholder="Cari siswa"
                  className="w-full"
                />
              </div>
              <Select
                value={classId}
                onValueChange={(value) => setClassId(value)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>Semua kelas</SelectItem>
                  <SelectItem value={NO_CLASS_FILTER}>Tanpa kelas</SelectItem>
                  {(classOptionsQuery.data?.data ?? []).map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedYearLabel ? (
                <div className="text-sm text-ink-muted">
                  Tahun ajaran: {selectedYearLabel}
                </div>
              ) : null}
            </div>

            <div className="text-xs text-ink-muted">Total: {total} siswa</div>
          </div>

          <div className="mt-4">
            <DataTable
              data={studentsQuery.data?.data ?? []}
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
                studentsQuery.isLoading ? "Memuat data..." : "Belum ada siswa"
              }
            />
          </div>
        </div>
      ) : null}

      {isCreateOpen ? (
        <StudentsFormModal
          key={`student-create-${defaultClassId || "empty"}`}
          isOpen={isCreateOpen}
          isSubmitting={
            registerUser.isPending ||
            createProfile.isPending ||
            createEnrollment.isPending
          }
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreate}
          classes={classOptionsQuery.data?.data ?? []}
          defaultClassId={defaultClassId}
        />
      ) : null}

      {isEditOpen ? (
        <StudentsEditModal
          key={selectedStudent?.id ?? "student-edit"}
          isOpen={isEditOpen}
          student={selectedStudent}
          isSubmitting={updateProfile.isPending}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleUpdate}
        />
      ) : null}

      {isEnrollOpen ? (
        <StudentsEnrollmentModal
          key={`${selectedStudent?.id ?? "student"}-enrollment`}
          isOpen={isEnrollOpen}
          student={selectedStudent}
          mode={enrollMode}
          classes={classOptionsQuery.data?.data ?? []}
          academicYearLabel={selectedYearLabel ?? null}
          isSubmitting={createEnrollment.isPending}
          onClose={() => setIsEnrollOpen(false)}
          onSubmit={handleEnrollment}
        />
      ) : null}

      <FeedbackDialog />
    </div>
  );
}
