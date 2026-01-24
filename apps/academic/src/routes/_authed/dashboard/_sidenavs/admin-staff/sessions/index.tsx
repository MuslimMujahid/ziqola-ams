import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  CalendarIcon,
  Loader2Icon,
  ListIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { TabsList, TabsRoot, TabsTrigger } from "@/components/ui";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { formatDateLocal, getLocalDateInputValue } from "@/lib/utils/date";
import { useConfirm } from "@/lib/utils/use-confirm";
import { useFeedbackDialog } from "@/lib/utils/use-feedback-dialog";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { useAcademicPeriods } from "@/lib/services/api/academic";
import { useClassSubjects } from "@/lib/services/api/class-subjects";
import { useClasses } from "@/lib/services/api/classes";
import { useSubjects } from "@/lib/services/api/subjects";
import { useTeacherProfiles } from "@/lib/services/api/teachers";
import {
  type SessionItem,
  useCreateSession,
  useDeleteSession,
  useSessions,
  useUpdateSession,
} from "@/lib/services/api/sessions";
import {
  SessionFormModal,
  type SessionFormValues,
} from "./-components/-session-form-modal";
import { SessionsTodayCalendar } from "./-components/-sessions-today-calendar";
import { isApiError } from "@/lib/services/api";

export const Route = createFileRoute(
  "/_authed/dashboard/_sidenavs/admin-staff/sessions/",
)({
  component: SessionsPage,
  pendingComponent: () => (
    <div className="flex items-center justify-center py-10 text-ink-muted">
      <Loader2Icon className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span className="ml-2 text-sm">Memuat sesi pembelajaran...</span>
    </div>
  ),
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  ),
});

type FilterId = string | "ALL";

function SessionsPage() {
  const workspace = useWorkspaceStore();
  const [viewMode, setViewMode] = React.useState<"list" | "calendar">("list");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [classId, setClassId] = React.useState<FilterId>("ALL");
  const [subjectId, setSubjectId] = React.useState<FilterId>("ALL");
  const [teacherProfileId, setTeacherProfileId] =
    React.useState<FilterId>("ALL");
  const [dateFrom, setDateFrom] = React.useState<string>("");
  const [dateTo, setDateTo] = React.useState<string>("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<"create" | "edit">("create");
  const [selectedSession, setSelectedSession] =
    React.useState<SessionItem | null>(null);
  const [sessionDraft, setSessionDraft] =
    React.useState<Partial<SessionFormValues> | null>(null);

  const { confirm, ConfirmDialog } = useConfirm();
  const { showFeedback, FeedbackDialog } = useFeedbackDialog();

  const academicPeriodsQuery = useAcademicPeriods(
    {
      offset: 0,
      limit: 50,
      academicYearId: workspace.academicYearId ?? undefined,
    },
    { enabled: Boolean(workspace.academicYearId) },
  );

  const classOptionsQuery = useClasses(
    {
      offset: 0,
      limit: 200,
      academicYearId: workspace.academicYearId ?? undefined,
    },
    { enabled: true },
  );

  const subjectOptionsQuery = useSubjects({ offset: 0, limit: 200 });
  const teacherOptionsQuery = useTeacherProfiles({ offset: 0, limit: 200 });
  const classSubjectsQuery = useClassSubjects(
    {
      offset: 0,
      limit: 500,
      academicYearId: workspace.academicYearId ?? undefined,
    },
    { enabled: Boolean(workspace.academicYearId) },
  );

  const academicPeriodOptions = React.useMemo(
    () => academicPeriodsQuery.data?.data ?? [],
    [academicPeriodsQuery.data?.data],
  );
  const selectedAcademicPeriod = academicPeriodOptions.find(
    (period) => period.id === workspace.academicPeriodId,
  );
  const activeAcademicPeriodId = workspace.academicPeriodId ?? undefined;
  const isAcademicPeriodMissing =
    !activeAcademicPeriodId && !academicPeriodsQuery.isLoading;

  const todayLocal = React.useMemo(() => getLocalDateInputValue(), []);

  const listQueryParams = React.useMemo(
    () => ({
      offset: pagination.pageIndex * pagination.pageSize,
      limit: pagination.pageSize,
      academicPeriodId: activeAcademicPeriodId,
      classId: classId === "ALL" ? undefined : classId,
      subjectId: subjectId === "ALL" ? undefined : subjectId,
      teacherProfileId:
        teacherProfileId === "ALL" ? undefined : teacherProfileId,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [
      pagination.pageIndex,
      pagination.pageSize,
      activeAcademicPeriodId,
      classId,
      subjectId,
      teacherProfileId,
      dateFrom,
      dateTo,
    ],
  );

  const calendarQueryParams = React.useMemo(
    () => ({
      offset: 0,
      limit: 200,
      academicPeriodId: activeAcademicPeriodId,
      classId: classId === "ALL" ? undefined : classId,
      dateFrom: todayLocal,
      dateTo: todayLocal,
    }),
    [activeAcademicPeriodId, classId, todayLocal],
  );

  const listSessionsQuery = useSessions(listQueryParams, {
    enabled: viewMode === "list" && Boolean(activeAcademicPeriodId),
  });

  const calendarSessionsQuery = useSessions(calendarQueryParams, {
    enabled:
      viewMode === "calendar" &&
      Boolean(activeAcademicPeriodId) &&
      classId !== "ALL",
  });

  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSession();

  const total = listSessionsQuery.data?.meta.total ?? 0;
  const pageCount = pagination.pageSize
    ? Math.max(Math.ceil(total / pagination.pageSize), 1)
    : 1;

  const classSelectOptions = React.useMemo(
    () =>
      (classOptionsQuery.data?.data ?? []).map((item) => ({
        label: item.name,
        value: item.id,
      })),
    [classOptionsQuery.data?.data],
  );

  React.useEffect(() => {
    if (viewMode !== "calendar" || classId !== "ALL") return;
    const fallbackClassId = classSelectOptions[0]?.value;
    if (fallbackClassId) {
      setClassId(fallbackClassId);
    }
  }, [viewMode, classId, classSelectOptions]);

  const classSubjectAssignments = React.useMemo(
    () => classSubjectsQuery.data?.data ?? [],
    [classSubjectsQuery.data?.data],
  );

  const subjectSelectOptions = React.useMemo(
    () =>
      (subjectOptionsQuery.data?.data ?? []).map((item) => ({
        label: item.name,
        value: item.id,
      })),
    [subjectOptionsQuery.data?.data],
  );

  const teacherSelectOptions = React.useMemo(
    () =>
      (teacherOptionsQuery.data?.data ?? []).map((item) => ({
        label: item.user.name,
        value: item.id,
      })),
    [teacherOptionsQuery.data?.data],
  );

  const formatTime = React.useCallback((value?: string | Date | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const formatTimeInput = React.useCallback((value: string) => {
    const date = new Date(value);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }, []);

  const toIsoDateTime = React.useCallback((dateValue: string, time: string) => {
    const [year, month, day] = dateValue.split("-").map((part) => Number(part));
    const [hours, minutes] = time.split(":").map((part) => Number(part));

    if (
      !year ||
      !month ||
      !day ||
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return "";
    }

    const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return date.toISOString();
  }, []);

  const toDateInput = React.useCallback((value: string | Date) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  }, []);

  const handleErrorFeedback = React.useCallback(
    (error: unknown, title: string) => {
      let message = "Terjadi kesalahan.";

      if (isApiError(error)) {
        const apiMessage = error.response?.data.message;
        if (apiMessage?.includes("Session time conflicts")) {
          message = "Sesi bentrok dengan jadwal lain.";
        }
        if (apiMessage?.includes("Session already exists")) {
          message = "Sesi untuk jadwal dan tanggal tersebut sudah ada.";
        }
        if (apiMessage?.includes("Session cannot be deleted")) {
          message = "Sesi tidak bisa dihapus karena sudah ada absensi.";
        }
      }

      showFeedback({
        tone: "error",
        title,
        description: message,
      });
    },
    [showFeedback],
  );

  const openCreate = React.useCallback(() => {
    setFormMode("create");
    setSelectedSession(null);
    setSessionDraft({
      academicPeriodId: activeAcademicPeriodId ?? "",
      classId: classId === "ALL" ? "" : classId,
      subjectId: subjectId === "ALL" ? "" : subjectId,
      date: "",
      startTime: "",
      endTime: "",
    });
    setIsFormOpen(true);
  }, [activeAcademicPeriodId, classId, subjectId]);

  const openEdit = React.useCallback((session: SessionItem) => {
    setFormMode("edit");
    setSelectedSession(session);
    setSessionDraft(null);
    setIsFormOpen(true);
  }, []);

  const sessionInitialValues = React.useMemo<SessionFormValues>(() => {
    if (formMode === "edit" && selectedSession) {
      return {
        academicPeriodId: selectedSession.academicPeriodId ?? "",
        classId: selectedSession.classId,
        subjectId: selectedSession.subjectId,
        date: toDateInput(selectedSession.date),
        startTime: formatTimeInput(selectedSession.startTime),
        endTime: formatTimeInput(selectedSession.endTime),
      };
    }

    const defaults: SessionFormValues = {
      academicPeriodId: activeAcademicPeriodId ?? "",
      classId: classId === "ALL" ? "" : classId,
      subjectId: subjectId === "ALL" ? "" : subjectId,
      date: "",
      startTime: "",
      endTime: "",
    };

    return { ...defaults, ...(sessionDraft ?? {}) };
  }, [
    formMode,
    selectedSession,
    activeAcademicPeriodId,
    classId,
    subjectId,
    sessionDraft,
    formatTimeInput,
    toDateInput,
  ]);

  const resolveClassSubjectId = React.useCallback(
    (classIdValue: string, subjectIdValue: string) =>
      classSubjectAssignments.find(
        (item) =>
          item.classId === classIdValue && item.subjectId === subjectIdValue,
      )?.id ?? null,
    [classSubjectAssignments],
  );
  const handleDelete = React.useCallback(
    async (session: SessionItem) => {
      const confirmed = await confirm({
        title: "Hapus sesi ini?",
        description: "Sesi tidak dapat dihapus jika sudah ada absensi.",
        confirmText: "Hapus",
        cancelText: "Batal",
        confirmVariant: "destructive",
      });

      if (!confirmed) return;

      try {
        await deleteSession.mutateAsync({ id: session.id });
        showFeedback({
          tone: "success",
          title: "Sesi dihapus",
          description: "Sesi pembelajaran berhasil dihapus.",
        });
      } catch (error) {
        handleErrorFeedback(error, "Gagal menghapus sesi");
      } finally {
        setIsFormOpen(false);
        setSessionDraft(null);
      }
    },
    [confirm, deleteSession, showFeedback, handleErrorFeedback],
  );

  const handleResetFilters = React.useCallback(() => {
    setClassId("ALL");
    setSubjectId("ALL");
    setTeacherProfileId("ALL");
    setDateFrom("");
    setDateTo("");
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handleTodayFilter = React.useCallback(() => {
    const today = getLocalDateInputValue();
    setDateFrom(today);
    setDateTo(today);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const columns = React.useMemo<ColumnDef<SessionItem>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Tanggal",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <CalendarIcon
              className="h-4 w-4 text-ink-muted"
              aria-hidden="true"
            />
            <span>{formatDateLocal(row.original.date)}</span>
          </div>
        ),
      },
      {
        id: "time",
        header: "Waktu",
        cell: ({ row }) => (
          <span className="text-sm text-ink">
            {formatTime(row.original.startTime)}–
            {formatTime(row.original.endTime)}
          </span>
        ),
      },
      {
        accessorKey: "className",
        header: "Kelas",
      },
      {
        accessorKey: "subjectName",
        header: "Mata pelajaran",
      },
      {
        accessorKey: "teacherName",
        header: "Guru",
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
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
            >
              <Trash2Icon className="h-4 w-4" aria-hidden="true" />
              Hapus
            </Button>
          </div>
        ),
      },
    ],
    [formatTime, handleDelete, openEdit],
  );

  const emptyStateMessage = !activeAcademicPeriodId
    ? "Periode akademik aktif belum ditentukan."
    : "Belum ada sesi pembelajaran.";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-strong">
            Sesi Pembelajaran
          </h1>
          <p className="text-sm text-ink-muted">
            Catat sesi pembelajaran dan kelola jadwal aktual untuk kelas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            className="gap-2"
            onClick={() =>
              viewMode === "calendar"
                ? calendarSessionsQuery.refetch()
                : listSessionsQuery.refetch()
            }
            disabled={
              !activeAcademicPeriodId ||
              (viewMode === "calendar" && classId === "ALL")
            }
          >
            <RefreshCwIcon className="h-4 w-4" aria-hidden="true" />
            Muat ulang
          </Button>
          <Button
            type="button"
            onClick={openCreate}
            className="gap-2"
            disabled={!activeAcademicPeriodId}
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Tambah sesi
          </Button>
        </div>
      </div>

      {isAcademicPeriodMissing ? (
        <div className="rounded-xl bg-surface-contrast p-6 text-sm text-ink-muted">
          Pilih periode akademik di workspace untuk menampilkan data sesi.
        </div>
      ) : (
        <div className="rounded-xl bg-surface-contrast p-6 space-y-5">
          <TabsRoot
            value={viewMode}
            onValueChange={(next) => setViewMode(next as "list" | "calendar")}
            className="-mx-6 -mt-6 px-6"
          >
            <TabsList>
              <TabsTrigger value="list" icon={ListIcon}>
                Daftar
              </TabsTrigger>
              <TabsTrigger value="calendar" icon={CalendarIcon}>
                Kalender hari ini
              </TabsTrigger>
            </TabsList>
          </TabsRoot>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <Select
                value={classId}
                onValueChange={(value) => {
                  setClassId(value as FilterId);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
              >
                <SelectTrigger
                  id="session-filter-class"
                  aria-label="Filter kelas"
                  className="h-10"
                >
                  <SelectValue
                    placeholder={
                      viewMode === "calendar" ? "Pilih kelas" : "Semua kelas"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {viewMode === "list" ? (
                    <SelectItem value="ALL">Semua kelas</SelectItem>
                  ) : null}
                  {classSelectOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {viewMode === "list" ? (
                <>
                  <Select
                    value={subjectId}
                    onValueChange={(value) => {
                      setSubjectId(value as FilterId);
                      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                    }}
                  >
                    <SelectTrigger
                      id="session-filter-subject"
                      aria-label="Filter mata pelajaran"
                      className="h-10"
                    >
                      <SelectValue placeholder="Semua mata pelajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua mata pelajaran</SelectItem>
                      {subjectSelectOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={teacherProfileId}
                    onValueChange={(value) => {
                      setTeacherProfileId(value as FilterId);
                      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                    }}
                  >
                    <SelectTrigger
                      id="session-filter-teacher"
                      aria-label="Filter guru"
                      className="h-10"
                    >
                      <SelectValue placeholder="Semua guru" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua guru</SelectItem>
                      {teacherSelectOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-3 px-3 border-x border-surface-2">
                    <Input
                      id="session-filter-date-from"
                      aria-label="Dari tanggal"
                      type="date"
                      value={dateFrom}
                      onChange={(event) => {
                        setDateFrom(event.target.value);
                        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                      }}
                      className="h-10 w-fit"
                    />
                    -
                    <Input
                      id="session-filter-date-to"
                      aria-label="Sampai tanggal"
                      type="date"
                      value={dateTo}
                      onChange={(event) => {
                        setDateTo(event.target.value);
                        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                      }}
                      className="h-10 w-fit"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTodayFilter}
                  >
                    Sesi hari ini
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 gap-2 px-3"
                    onClick={handleResetFilters}
                  >
                    Reset filter
                  </Button>
                </>
              ) : null}
            </div>

            <div className="text-xs text-ink-muted">
              {viewMode === "calendar"
                ? `Total: ${calendarSessionsQuery.data?.data.length ?? 0} sesi`
                : `Total: ${total} sesi`}
            </div>
          </div>

          {viewMode === "list" ? (
            <DataTable
              data={listSessionsQuery.data?.data ?? []}
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
              emptyMessage={emptyStateMessage}
            />
          ) : !activeAcademicPeriodId ? (
            <div className="rounded-lg bg-surface-1 px-4 py-3 text-sm text-ink-muted">
              Periode akademik aktif belum ditentukan di workspace.
            </div>
          ) : classId === "ALL" ? (
            <div className="rounded-lg bg-surface-1 px-4 py-3 text-sm text-ink-muted">
              Pilih kelas untuk melihat sesi hari ini.
            </div>
          ) : (
            <SessionsTodayCalendar
              sessions={calendarSessionsQuery.data?.data ?? []}
              isLoading={calendarSessionsQuery.isLoading}
              todayDate={todayLocal}
              emptyMessage="Belum ada sesi pembelajaran hari ini."
              onCreateFromSlot={(payload) => {
                setFormMode("create");
                setSelectedSession(null);
                setSessionDraft({
                  academicPeriodId: activeAcademicPeriodId ?? "",
                  classId: classId === "ALL" ? "" : classId,
                  subjectId: subjectId === "ALL" ? "" : subjectId,
                  date: payload.date,
                  startTime: payload.startTime,
                  endTime: payload.endTime,
                });
                setIsFormOpen(true);
              }}
              onEdit={openEdit}
            />
          )}
        </div>
      )}

      {isFormOpen ? (
        <SessionFormModal
          isOpen={isFormOpen}
          mode={formMode}
          isSubmitting={createSession.isPending || updateSession.isPending}
          academicPeriodLabel={
            formMode === "edit"
              ? (selectedSession?.academicPeriodName ?? "-")
              : (selectedAcademicPeriod?.name ?? "-")
          }
          classOptions={classSelectOptions}
          subjectOptions={subjectSelectOptions}
          classSubjects={classSubjectAssignments}
          initialValues={sessionInitialValues}
          onDelete={
            formMode === "edit" && selectedSession
              ? () => handleDelete(selectedSession)
              : undefined
          }
          isDeleting={deleteSession.isPending}
          onClose={() => {
            setIsFormOpen(false);
            setSessionDraft(null);
          }}
          onSubmit={async (values) => {
            try {
              const classSubjectId = resolveClassSubjectId(
                values.classId,
                values.subjectId,
              );

              if (!classSubjectId) {
                showFeedback({
                  tone: "error",
                  title: "Penugasan tidak ditemukan",
                  description:
                    "Penugasan guru untuk kelas dan mata pelajaran ini belum dibuat.",
                });
                return;
              }

              const basePayload = {
                date: values.date,
                startTime: toIsoDateTime(values.date, values.startTime),
                endTime: toIsoDateTime(values.date, values.endTime),
              };

              const manualPayload = {
                ...basePayload,
                academicPeriodId: values.academicPeriodId,
                classSubjectId,
              };

              if (formMode === "create") {
                await createSession.mutateAsync(manualPayload);
                showFeedback({
                  tone: "success",
                  title: "Sesi dibuat",
                  description: "Sesi pembelajaran berhasil ditambahkan.",
                });
              } else if (selectedSession) {
                await updateSession.mutateAsync({
                  id: selectedSession.id,
                  ...manualPayload,
                });
                showFeedback({
                  tone: "success",
                  title: "Sesi diperbarui",
                  description: "Perubahan sesi berhasil disimpan.",
                });
              }

              setIsFormOpen(false);
              setSessionDraft(null);
            } catch (error) {
              handleErrorFeedback(
                error,
                formMode === "create"
                  ? "Gagal membuat sesi"
                  : "Gagal memperbarui sesi",
              );
            }
          }}
        />
      ) : null}

      <FeedbackDialog />
      <ConfirmDialog />
    </div>
  );
}
