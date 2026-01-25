import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import type {
  ColumnDef,
  PaginationState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  Loader2Icon,
  PlusIcon,
  RefreshCwIcon,
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
import { useFeedbackDialog } from "@/lib/utils/use-feedback-dialog";
import { useAuthStore } from "@/stores/auth.store";
import {
  type StudentListItem,
  useCreateStudentProfile,
  useStudents,
} from "@/lib/services/api/students";
import {
  type ProfileFieldValue,
  type TenantProfileField,
  useExportProfiles,
  useFilterProfiles,
  useTenantProfileFields,
} from "@/lib/services/api/profile-custom-fields";
import {
  useAcademicPeriods,
  useAcademicYears,
} from "@/lib/services/api/academic";
import { useClasses } from "@/lib/services/api/classes";
import { useInviteUser } from "@/lib/services/api/users";
import { useCreateEnrollment } from "@/lib/services/api/enrollments";
import { useWorkspaceStore } from "@/stores/workspace.store";
import {
  CustomFieldFilterBuilder,
  type FilterInput,
} from "@/components/profile/custom-field-filter-builder";
import { CustomFieldsModal } from "@/components/profile/custom-fields-modal";
import { formatProfileValue } from "@/lib/utils/profile-custom-fields";
import { useDebouncedValue } from "@/lib/utils/use-debounced-value";
import { useOnClickOutside } from "@/lib/utils/use-on-click-outside";
import { cn } from "@/lib/utils";
import { buildCustomFieldFilters } from "@/lib/utils/query";
import { StudentsFormModal } from "./-components/-students-form-modal";
import { StudentsEnrollmentModal } from "./-components/-students-enrollment-modal";

const ALL_FILTER = "ALL" as const;
const NO_CLASS_FILTER = "NO_CLASS" as const;
const BASE_COLUMN_OPTIONS = [
  { id: "student", label: "Siswa" },
  { id: "class", label: "Kelas" },
  { id: "actions", label: "Aksi", locked: true },
] as const;

type CustomFieldCellProps = {
  field: TenantProfileField;
  values?: ProfileFieldValue[];
};

type StudentColumnsParams = {
  enabledCustomFields: TenantProfileField[];
  onEnrollment: (student: StudentListItem, mode: "assign" | "change") => void;
};

function CustomFieldCell({ field, values }: CustomFieldCellProps) {
  const valueMap = React.useMemo(
    () =>
      new Map((values ?? []).map((value) => [value.fieldId, value] as const)),
    [values],
  );

  return (
    <span className="text-sm text-ink">
      {formatProfileValue(field, valueMap.get(field.id))}
    </span>
  );
}

function createStudentColumns({
  enabledCustomFields,
  onEnrollment,
}: StudentColumnsParams): ColumnDef<StudentListItem>[] {
  return [
    {
      id: "student",
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
      id: "class",
      header: "Kelas",
      cell: ({ row }) => (
        <div className="text-sm text-ink">
          {row.original.currentClass?.name ?? "Belum ada kelas"}
        </div>
      ),
    },
    ...enabledCustomFields.map<ColumnDef<StudentListItem>>((field) => ({
      id: `custom:${field.key}`,
      header: field.label,
      cell: ({ row }) => (
        <CustomFieldCell
          field={field}
          values={row.original.customFieldValues}
        />
      ),
    })),
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          {row.original.currentClass ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onEnrollment(row.original, "change")}
            >
              Ganti kelas
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onEnrollment(row.original, "assign")}
            >
              Tetapkan kelas
            </Button>
          )}
        </div>
      ),
    },
  ];
}

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
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [isColumnMenuOpen, setIsColumnMenuOpen] = React.useState(false);
  const [classId, setClassId] = React.useState<
    string | typeof ALL_FILTER | typeof NO_CLASS_FILTER
  >(ALL_FILTER);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = React.useState(false);
  const [isCustomFieldsOpen, setIsCustomFieldsOpen] = React.useState(false);
  const [enrollMode, setEnrollMode] = React.useState<"assign" | "change">(
    "assign",
  );
  const [selectedStudent, setSelectedStudent] =
    React.useState<StudentListItem | null>(null);
  const [customFieldProfile, setCustomFieldProfile] =
    React.useState<StudentListItem | null>(null);
  const [customFilters, setCustomFilters] = React.useState<FilterInput[]>([]);

  const { showFeedback, FeedbackDialog } = useFeedbackDialog();
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId ?? "";

  const inviteUser = useInviteUser();
  const createProfile = useCreateStudentProfile();
  const createEnrollment = useCreateEnrollment();
  const exportProfiles = useExportProfiles();

  const columnMenuRef = React.useRef<HTMLDivElement | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  React.useEffect(() => {
    setSearch(debouncedSearch.trim());
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch]);

  useOnClickOutside([columnMenuRef], () => setIsColumnMenuOpen(false), {
    enabled: isColumnMenuOpen,
  });

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
      includeCustomFields: true,
    }),
    [
      pagination.pageIndex,
      pagination.pageSize,
      search,
      academicYearId,
      classId,
    ],
  );

  const tenantFieldsQuery = useTenantProfileFields(tenantId, "student", {
    enabled: Boolean(tenantId),
  });
  const tenantFields = tenantFieldsQuery.data?.data ?? [];
  const enabledCustomFields = React.useMemo(
    () => tenantFields.filter((field) => field.isEnabled),
    [tenantFields],
  );

  React.useEffect(() => {
    if (enabledCustomFields.length === 0) return;
    setColumnVisibility((prev) => {
      const next = { ...prev };
      enabledCustomFields.forEach((field) => {
        const id = `custom:${field.key}`;
        if (next[id] === undefined) {
          next[id] = false;
        }
      });
      return next;
    });
  }, [enabledCustomFields]);

  const customFieldFiltersPayload = React.useMemo(
    () => buildCustomFieldFilters(customFilters, tenantFields),
    [customFilters, tenantFields],
  );

  const hasCustomFilters = customFieldFiltersPayload.length > 0;
  const filtersKey = React.useMemo(
    () =>
      JSON.stringify({
        customFieldFiltersPayload,
        search,
        academicYearId,
        classId,
        withoutClass: classId === NO_CLASS_FILTER,
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        includeCustomFields: true,
      }),
    [
      academicYearId,
      classId,
      customFieldFiltersPayload,
      pagination.pageIndex,
      pagination.pageSize,
      search,
    ],
  );

  const studentsQuery = useStudents(queryParams, {
    enabled: Boolean(academicYearId) && !hasCustomFilters,
  });

  const filteredStudentsQuery = useFilterProfiles<StudentListItem>(
    {
      tenantId,
      role: "student",
      filters: customFieldFiltersPayload,
      search: search || undefined,
      academicYearId,
      classId:
        classId === ALL_FILTER || classId === NO_CLASS_FILTER
          ? undefined
          : classId,
      withoutClass: classId === NO_CLASS_FILTER ? true : undefined,
      includeCustomFields: true,
      pagination: {
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
      },
    },
    filtersKey,
    {
      enabled: Boolean(academicYearId) && hasCustomFilters && Boolean(tenantId),
    },
  );

  const total = hasCustomFilters
    ? (filteredStudentsQuery.data?.data.total ?? 0)
    : (studentsQuery.data?.meta.total ?? 0);
  const pageCount = pagination.pageSize
    ? Math.max(Math.ceil(total / pagination.pageSize), 1)
    : 1;

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

  const getErrorMessage = React.useCallback(
    (error: unknown, fallback: string) =>
      error instanceof Error ? error.message : fallback,
    [],
  );

  const handleCreate = React.useCallback(
    async (values: {
      name: string;
      email: string;
      classId: string;
      gender?: "MALE" | "FEMALE" | "none";
      dateOfBirth?: string;
      phoneNumber?: string;
    }) => {
      if (!user?.tenantId || !academicYearId || !academicPeriodId) {
        return;
      }
      try {
        const registerResponse = await inviteUser.mutateAsync({
          role: "STUDENT",
          name: values.name.trim(),
          email: values.email.trim(),
          gender: values.gender === "none" ? undefined : values.gender,
          dateOfBirth: normalizeOptional(values.dateOfBirth),
          phoneNumber: normalizeOptional(values.phoneNumber),
        });

        const profile = await createProfile.mutateAsync({
          userId: registerResponse.data.user.id,
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
          title: "Undangan siswa terkirim",
          description: `Email undangan sudah dikirim ke ${values.email}.`,
        });
      } catch (error) {
        showFeedback({
          tone: "error",
          title: "Gagal menambah siswa",
          description: getErrorMessage(
            error,
            "Periksa kembali data yang diisi lalu coba lagi.",
          ),
        });
      }
    },
    [
      academicPeriodId,
      academicPeriodsQuery.data?.data,
      academicYearId,
      createEnrollment,
      createProfile,
      getErrorMessage,
      normalizeOptional,
      inviteUser,
      showFeedback,
      user?.tenantId,
    ],
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

  const handleExport = React.useCallback(async () => {
    if (!tenantId) {
      return;
    }

    const response = await exportProfiles.mutateAsync({
      tenantId,
      role: "student",
      filters: customFieldFiltersPayload,
      search: search || undefined,
      academicYearId,
      classId:
        classId === ALL_FILTER || classId === NO_CLASS_FILTER
          ? undefined
          : classId,
      withoutClass: classId === NO_CLASS_FILTER ? true : undefined,
      format: "csv",
    });

    if (response.data.downloadUrl) {
      window.open(response.data.downloadUrl, "_blank");
    }
  }, [
    academicYearId,
    classId,
    customFieldFiltersPayload,
    exportProfiles,
    search,
    tenantId,
  ]);

  const columns = React.useMemo(
    () =>
      createStudentColumns({
        enabledCustomFields,
        onEnrollment: openEnrollment,
      }),
    [enabledCustomFields, openEnrollment],
  );

  const handleColumnToggle = React.useCallback(
    (columnId: string, isVisible: boolean) => {
      setColumnVisibility((prev) => ({
        ...prev,
        [columnId]: isVisible,
      }));
    },
    [],
  );

  const selectedYearLabel = academicYearsQuery.data?.data.find(
    (year) => year.id === academicYearId,
  )?.label;

  const columnOptions = React.useMemo(
    () => [
      ...BASE_COLUMN_OPTIONS.filter((column) => column.id !== "actions"),
      ...enabledCustomFields.map((field) => ({
        id: `custom:${field.key}`,
        label: field.label,
      })),
    ],
    [enabledCustomFields],
  );

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
            onClick={() =>
              hasCustomFilters
                ? filteredStudentsQuery.refetch()
                : studentsQuery.refetch()
            }
            className="gap-2"
          >
            <RefreshCwIcon className="h-4 w-4" aria-hidden="true" />
            Muat ulang
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleExport}
            className="gap-2"
            disabled={exportProfiles.isPending}
          >
            {exportProfiles.isPending && (
              <Loader2Icon
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            Export
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
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="text-xs text-ink-muted">Total: {total} siswa</div>
              <div className="relative" ref={columnMenuRef}>
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-2"
                  aria-expanded={isColumnMenuOpen}
                  aria-controls="student-columns-menu"
                  onClick={() => setIsColumnMenuOpen((prev) => !prev)}
                >
                  Kolom
                  <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                </Button>
                {isColumnMenuOpen ? (
                  <div
                    id="student-columns-menu"
                    role="menu"
                    className="absolute right-0 z-10 mt-2 w-56 rounded-lg bg-surface-contrast p-3 shadow-sm"
                  >
                    <div className="mt-2 space-y-1">
                      {columnOptions.map((column) => {
                        const isVisible = columnVisibility[column.id] ?? true;
                        return (
                          <label
                            key={column.id}
                            className={cn(
                              "flex items-center justify-between gap-3 rounded-md bg-surface-1 px-3 py-2 text-sm text-ink",
                              "transition-colors hover:bg-surface-2",
                            )}
                          >
                            <span>{column.label}</span>
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={isVisible}
                              onChange={(event) =>
                                handleColumnToggle(
                                  column.id,
                                  event.target.checked,
                                )
                              }
                            />
                          </label>
                        );
                      })}
                    </div>
                    {enabledCustomFields.length === 0 ? (
                      <p className="mt-1 text-xs text-ink-quiet">
                        Belum ada kolom kustom yang aktif.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div className="h-px bg-surface-2" />

            <CustomFieldFilterBuilder
              fields={tenantFields}
              filters={customFilters}
              onChange={(next) => {
                setCustomFilters(next);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
            />

            <DataTable
              data={
                hasCustomFilters
                  ? (filteredStudentsQuery.data?.data.data ?? [])
                  : (studentsQuery.data?.data ?? [])
              }
              columns={columns}
              showToolbar={false}
              enableColumnFilters={false}
              enableGlobalFilter={false}
              enableRowSelection={false}
              showPagination
              state={{ pagination, columnVisibility }}
              onPaginationChange={(updater) =>
                setPagination((prev) =>
                  typeof updater === "function" ? updater(prev) : updater,
                )
              }
              onColumnVisibilityChange={(updater) =>
                setColumnVisibility((prev) =>
                  typeof updater === "function" ? updater(prev) : updater,
                )
              }
              tableOptions={{
                manualPagination: true,
                pageCount,
              }}
              emptyMessage={
                (
                  hasCustomFilters
                    ? filteredStudentsQuery.isLoading
                    : studentsQuery.isLoading
                )
                  ? "Memuat data..."
                  : "Belum ada siswa"
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
            inviteUser.isPending ||
            createProfile.isPending ||
            createEnrollment.isPending
          }
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreate}
          classes={classOptionsQuery.data?.data ?? []}
          defaultClassId={defaultClassId}
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

      {isCustomFieldsOpen && customFieldProfile ? (
        <CustomFieldsModal
          isOpen={isCustomFieldsOpen}
          tenantId={tenantId}
          role="student"
          profileId={customFieldProfile.id}
          profileName={customFieldProfile.user.name}
          onClose={() => {
            setIsCustomFieldsOpen(false);
            setCustomFieldProfile(null);
          }}
        />
      ) : null}

      <FeedbackDialog />
    </div>
  );
}
