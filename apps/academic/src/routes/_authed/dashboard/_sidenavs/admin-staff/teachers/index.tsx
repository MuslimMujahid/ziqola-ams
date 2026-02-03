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
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
} from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { cn } from "@/lib/utils";
import { useFeedbackDialog } from "@/lib/utils/use-feedback-dialog";
import { useAuthStore } from "@/stores/auth.store";
import { useInviteUser } from "@/lib/services/api/users";
import {
  type ProfileFieldValue,
  type TenantProfileField,
  useExportProfiles,
  useFilterProfiles,
  useTenantProfileFields,
} from "@/lib/services/api/profile-custom-fields";
import {
  type TeacherProfile,
  useCreateTeacherProfile,
  useTeacherProfile,
  useTeacherProfiles,
  useUpdateTeacherProfile,
} from "@/lib/services/api/teachers";
import {
  CustomFieldFilterBuilder,
  type FilterInput,
} from "@/components/profile/custom-field-filter-builder";
import { CustomFieldsModal } from "@/components/profile/custom-fields-modal";
import { buildCustomFieldFilters } from "@/lib/utils/query";
import { TeachersFormModal } from "./-components/-teachers-form-modal";
import { TeachersEditModal } from "./-components/-teachers-edit-modal";

const BASE_COLUMN_OPTIONS = [
  { id: "teacher", label: "Guru" },
  { id: "actions", label: "Aksi" },
] as const;

type CustomFieldCellProps = {
  field: TenantProfileField;
  values?: ProfileFieldValue[];
};

function formatProfileValue(
  field: TenantProfileField,
  value?: ProfileFieldValue,
) {
  if (!value) return "-";

  const optionLabel = (raw?: string | null) => {
    if (!raw) return "-";
    const match = field.options?.find((option) => option.value === raw);
    return match?.label ?? raw;
  };

  switch (field.type) {
    case "text":
      return value.valueText ?? "-";
    case "number":
      return value.valueNumber !== null && value.valueNumber !== undefined
        ? String(value.valueNumber)
        : "-";
    case "date":
      return value.valueDate ? (value.valueDate.split("T")[0] ?? "-") : "-";
    case "boolean":
      return value.valueBoolean === undefined || value.valueBoolean === null
        ? "-"
        : value.valueBoolean
          ? "Ya"
          : "Tidak";
    case "select":
      return optionLabel(value.valueSelect ?? undefined);
    case "multiSelect":
      return value.valueMultiSelect && value.valueMultiSelect.length > 0
        ? value.valueMultiSelect
            .map((item) => optionLabel(item))
            .filter(Boolean)
            .join(", ")
        : "-";
    case "file":
      return value.valueFile?.fileName ?? "-";
    default:
      return "-";
  }
}

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
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [isColumnMenuOpen, setIsColumnMenuOpen] = React.useState(false);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isCustomFieldsOpen, setIsCustomFieldsOpen] = React.useState(false);
  const [selectedTeacher, setSelectedTeacher] =
    React.useState<TeacherProfile | null>(null);
  const [customFieldProfile, setCustomFieldProfile] =
    React.useState<TeacherProfile | null>(null);
  const [customFilters, setCustomFilters] = React.useState<FilterInput[]>([]);

  const { showFeedback, FeedbackDialog } = useFeedbackDialog();
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId ?? "";

  const inviteUser = useInviteUser();
  const createProfile = useCreateTeacherProfile();
  const updateProfile = useUpdateTeacherProfile();
  const exportProfiles = useExportProfiles();

  const debouncedSearchRef = React.useRef<number | undefined>(undefined);
  const columnMenuRef = React.useRef<HTMLDivElement | null>(null);

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

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        columnMenuRef.current &&
        !columnMenuRef.current.contains(event.target as Node)
      ) {
        setIsColumnMenuOpen(false);
      }
    };

    if (isColumnMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isColumnMenuOpen]);

  const queryParams = React.useMemo(
    () => ({
      offset: pagination.pageIndex * pagination.pageSize,
      limit: pagination.pageSize,
      search: search || undefined,
      includeCustomFields: true,
    }),
    [pagination.pageIndex, pagination.pageSize, search],
  );

  const tenantFieldsQuery = useTenantProfileFields(tenantId, "teacher", {
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
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      }),
    [
      customFieldFiltersPayload,
      pagination.pageIndex,
      pagination.pageSize,
      search,
    ],
  );

  const teachersQuery = useTeacherProfiles(queryParams, {
    enabled: !hasCustomFilters,
  });
  const filteredTeachersQuery = useFilterProfiles<TeacherProfile>(
    {
      tenantId,
      role: "teacher",
      filters: customFieldFiltersPayload,
      search: search || undefined,
      includeCustomFields: true,
      pagination: {
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
      },
    },
    filtersKey,
    { enabled: hasCustomFilters && Boolean(tenantId) },
  );
  const teacherDetailQuery = useTeacherProfile(selectedTeacher?.id ?? "", {
    enabled: Boolean(selectedTeacher?.id) && isEditOpen,
  });

  const total = hasCustomFilters
    ? (filteredTeachersQuery.data?.data.total ?? 0)
    : (teachersQuery.data?.meta.total ?? 0);
  const pageCount = pagination.pageSize
    ? Math.max(Math.ceil(total / pagination.pageSize), 1)
    : 1;

  const openEdit = React.useCallback((teacher: TeacherProfile) => {
    setSelectedTeacher(teacher);
    setIsEditOpen(true);
  }, []);

  const openCustomFields = React.useCallback((teacher: TeacherProfile) => {
    setCustomFieldProfile(teacher);
    setIsCustomFieldsOpen(true);
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

  const handleExport = React.useCallback(async () => {
    if (!tenantId) {
      return;
    }

    const response = await exportProfiles.mutateAsync({
      tenantId,
      role: "teacher",
      filters: customFieldFiltersPayload,
      search: search || undefined,
      format: "csv",
    });

    if (response.data.downloadUrl) {
      window.open(response.data.downloadUrl, "_blank");
    }
  }, [customFieldFiltersPayload, exportProfiles, search, tenantId]);

  const handleCreate = React.useCallback(
    async (values: {
      name: string;
      email: string;
      gender?: "MALE" | "FEMALE" | "none";
      dateOfBirth?: string;
      phoneNumber?: string;
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
        const registerResponse = await inviteUser.mutateAsync({
          role: "TEACHER",
          name: values.name.trim(),
          email: values.email.trim(),
        });

        createdUserEmail = registerResponse.data.user.email;

        await createProfile.mutateAsync({
          userId: registerResponse.data.user.id,
          hiredAt: normalizeOptional(values.hiredAt),
          gender: values.gender === "none" ? undefined : values.gender,
          dateOfBirth: normalizeOptional(values.dateOfBirth),
          phoneNumber: normalizeOptional(values.phoneNumber),
        });

        setIsCreateOpen(false);
        showFeedback({
          tone: "success",
          title: "Undangan guru terkirim",
          description: `Email undangan sudah dikirim ke ${values.email}.`,
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
      inviteUser,
      normalizeOptional,
      showFeedback,
      user?.tenantId,
    ],
  );

  const handleUpdate = React.useCallback(
    async (values: { hiredAt?: string }) => {
      if (!selectedTeacher) {
        return;
      }
      try {
        await updateProfile.mutateAsync({
          id: selectedTeacher.id,
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
        id: "teacher",
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
      ...enabledCustomFields.map<ColumnDef<TeacherProfile>>((field) => ({
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
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => openEdit(row.original)}
            >
              <PencilIcon className="h-4 w-4" aria-hidden="true" />
              Edit
            </Button>
          </div>
        ),
      },
    ],
    [enabledCustomFields, openCustomFields, openEdit],
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
            onClick={() =>
              hasCustomFilters
                ? filteredTeachersQuery.refetch()
                : teachersQuery.refetch()
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

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs text-ink-muted">Total: {total} guru</div>
            <div className="relative" ref={columnMenuRef}>
              <Button
                type="button"
                variant="ghost"
                className="gap-2"
                aria-expanded={isColumnMenuOpen}
                aria-controls="teacher-columns-menu"
                onClick={() => setIsColumnMenuOpen((prev) => !prev)}
              >
                Kolom
                <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
              </Button>
              {isColumnMenuOpen ? (
                <div
                  id="teacher-columns-menu"
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
                ? (filteredTeachersQuery.data?.data.data ?? [])
                : (teachersQuery.data?.data ?? [])
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
                  ? filteredTeachersQuery.isLoading
                  : teachersQuery.isLoading
              )
                ? "Memuat data..."
                : "Belum ada guru"
            }
          />
        </div>
      </div>

      {isCreateOpen ? (
        <TeachersFormModal
          isOpen={isCreateOpen}
          isSubmitting={inviteUser.isPending || createProfile.isPending}
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

      {isCustomFieldsOpen && customFieldProfile ? (
        <CustomFieldsModal
          isOpen={isCustomFieldsOpen}
          tenantId={tenantId}
          role="teacher"
          profileId={customFieldProfile.id}
          profileName={customFieldProfile.user.name}
          onClose={() => setIsCustomFieldsOpen(false)}
        />
      ) : null}

      <FeedbackDialog />
    </div>
  );
}
