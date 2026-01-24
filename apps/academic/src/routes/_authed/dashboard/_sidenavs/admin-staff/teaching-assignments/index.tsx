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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { useConfirm } from "@/lib/utils/use-confirm";
import { useFeedbackDialog } from "@/lib/utils/use-feedback-dialog";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { useAcademicPeriods } from "@/lib/services/api/academic";
import { useClassSubjects } from "@/lib/services/api/class-subjects";
import { useClasses } from "@/lib/services/api/classes";
import { useSubjects } from "@/lib/services/api/subjects";
import { useTeacherProfiles } from "@/lib/services/api/teachers";
import {
  type ScheduleItem,
  useCreateSchedule,
  useDeleteSchedule,
  useSchedules,
  useUpdateSchedule,
} from "@/lib/services/api/schedules";
import {
  ScheduleFormModal,
  type ScheduleFormValues,
} from "./-components/-schedule-form-modal";
import { ScheduleCalendar } from "./-components/-schedule-calendar";
import { isApiError } from "@/lib/services/api";

export const Route = createFileRoute(
  "/_authed/dashboard/_sidenavs/admin-staff/teaching-assignments/",
)({
  component: TeachingAssignmentsPage,
  pendingComponent: () => (
    <div className="flex items-center justify-center py-10 text-ink-muted">
      <Loader2Icon className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span className="ml-2 text-sm">Memuat jadwal mengajar...</span>
    </div>
  ),
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  ),
});

type FilterId = string | "ALL";

function TeachingAssignmentsPage() {
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
  const [dayOfWeek, setDayOfWeek] = React.useState<FilterId>("ALL");
  const [isScheduleFormOpen, setIsScheduleFormOpen] = React.useState(false);
  const [scheduleFormMode, setScheduleFormMode] = React.useState<
    "create" | "edit"
  >("create");
  const [selectedSchedule, setSelectedSchedule] =
    React.useState<ScheduleItem | null>(null);
  const [scheduleDraft, setScheduleDraft] =
    React.useState<Partial<ScheduleFormValues> | null>(null);

  const { confirm, ConfirmDialog } = useConfirm();
  const { showFeedback, FeedbackDialog } = useFeedbackDialog();

  const handleErrorFeedback = React.useCallback(
    (error: unknown, title: string) => {
      let message = "Terjadi kesalahan.";

      if (isApiError(error)) {
        const apiMessage = error.response?.data.message;
        if (apiMessage?.includes("Class already has this subject assignment")) {
          message =
            "Kelas sudah memiliki penugasan untuk mata pelajaran yang dipilih.";
        }
        if (
          apiMessage?.includes("Teacher already has a schedule at this time")
        ) {
          message = "Guru sudah memiliki jadwal di waktu yang sama.";
        }
        if (
          apiMessage?.includes(
            "Schedule cannot be deleted because it already has sessions",
          )
        ) {
          message =
            "Jadwal tidak bisa dihapus karena sudah memiliki sesi pembelajaran.";
        }
        if (
          apiMessage?.includes(
            "Class subject does not belong to this academic period",
          )
        ) {
          message =
            "Penugasan tidak sesuai dengan periode akademik yang dipilih.";
        }
        if (
          apiMessage?.includes(
            "Class subject already assigned to another teacher",
          )
        ) {
          message =
            "Mata pelajaran ini sudah ditetapkan ke guru lain di kelas tersebut.";
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

  React.useEffect(() => {
    setClassId("ALL");
  }, [workspace.academicYearId]);

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

  const queryParams = React.useMemo(
    () => ({
      offset: pagination.pageIndex * pagination.pageSize,
      limit: pagination.pageSize,
      academicPeriodId: activeAcademicPeriodId,
      classId: classId === "ALL" ? undefined : classId,
      subjectId: subjectId === "ALL" ? undefined : subjectId,
      teacherProfileId:
        teacherProfileId === "ALL" ? undefined : teacherProfileId,
      dayOfWeek: dayOfWeek === "ALL" ? undefined : Number(dayOfWeek),
    }),
    [
      pagination.pageIndex,
      pagination.pageSize,
      activeAcademicPeriodId,
      classId,
      subjectId,
      teacherProfileId,
      dayOfWeek,
    ],
  );

  const listSchedulesQuery = useSchedules(queryParams, {
    enabled: viewMode === "list" && Boolean(activeAcademicPeriodId),
  });
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();

  const total = listSchedulesQuery.data?.meta.total ?? 0;
  const pageCount = pagination.pageSize
    ? Math.max(Math.ceil(total / pagination.pageSize), 1)
    : 1;

  const classOptions = React.useMemo(
    () => classOptionsQuery.data?.data ?? [],
    [classOptionsQuery.data?.data],
  );

  const subjectOptions = React.useMemo(
    () => subjectOptionsQuery.data?.data ?? [],
    [subjectOptionsQuery.data?.data],
  );

  const teacherOptions = React.useMemo(
    () => teacherOptionsQuery.data?.data ?? [],
    [teacherOptionsQuery.data?.data],
  );

  const classSubjectAssignments = React.useMemo(
    () => classSubjectsQuery.data?.data ?? [],
    [classSubjectsQuery.data?.data],
  );

  const canCreate = Boolean(activeAcademicPeriodId);

  const scheduleQueryParams = React.useMemo(
    () => ({
      offset: 0,
      limit: 500,
      academicPeriodId: activeAcademicPeriodId,
      classId: classId === "ALL" ? undefined : classId,
      subjectId: subjectId === "ALL" ? undefined : subjectId,
      teacherProfileId:
        teacherProfileId === "ALL" ? undefined : teacherProfileId,
    }),
    [activeAcademicPeriodId, classId, subjectId, teacherProfileId],
  );

  const schedulesQuery = useSchedules(scheduleQueryParams, {
    enabled: viewMode === "calendar" && Boolean(activeAcademicPeriodId),
  });

  const dayOptions = React.useMemo(
    () => [
      { label: "Senin", value: "1" },
      { label: "Selasa", value: "2" },
      { label: "Rabu", value: "3" },
      { label: "Kamis", value: "4" },
      { label: "Jumat", value: "5" },
      { label: "Sabtu", value: "6" },
      { label: "Minggu", value: "7" },
    ],
    [],
  );

  const formatTimeInput = React.useCallback((value: string) => {
    const date = new Date(value);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }, []);

  const toIsoTime = React.useCallback((value: string) => {
    const [hours, minutes] = value.split(":").map((part) => Number(part));
    const date = new Date(1970, 0, 1, hours, minutes, 0, 0);
    return date.toISOString();
  }, []);

  const openScheduleCreate = React.useCallback(
    (preset?: { dayOfWeek?: number; startTime?: string; endTime?: string }) => {
      setScheduleFormMode("create");
      setSelectedSchedule(null);
      setScheduleDraft({
        academicPeriodId: activeAcademicPeriodId ?? "",
        classId: classId === "ALL" ? "" : classId,
        subjectId: subjectId === "ALL" ? "" : subjectId,
        teacherProfileId: teacherProfileId === "ALL" ? "" : teacherProfileId,
        dayOfWeek: preset?.dayOfWeek ? String(preset.dayOfWeek) : "",
        startTime: preset?.startTime ? formatTimeInput(preset.startTime) : "",
        endTime: preset?.endTime ? formatTimeInput(preset.endTime) : "",
      });
      setIsScheduleFormOpen(true);
    },
    [
      activeAcademicPeriodId,
      classId,
      formatTimeInput,
      subjectId,
      teacherProfileId,
    ],
  );

  const openScheduleEdit = React.useCallback((schedule: ScheduleItem) => {
    setScheduleFormMode("edit");
    setSelectedSchedule(schedule);
    setScheduleDraft(null);
    setIsScheduleFormOpen(true);
  }, []);

  const scheduleInitialValues = React.useMemo<ScheduleFormValues>(() => {
    if (scheduleFormMode === "edit" && selectedSchedule) {
      return {
        academicPeriodId: selectedSchedule.academicPeriodId,
        classId: selectedSchedule.classId,
        subjectId: selectedSchedule.subjectId,
        teacherProfileId: selectedSchedule.teacherProfileId,
        dayOfWeek: String(selectedSchedule.dayOfWeek),
        startTime: formatTimeInput(selectedSchedule.startTime),
        endTime: formatTimeInput(selectedSchedule.endTime),
      };
    }

    const defaults: ScheduleFormValues = {
      academicPeriodId: activeAcademicPeriodId ?? "",
      classId: "",
      subjectId: "",
      teacherProfileId: "",
      dayOfWeek: "",
      startTime: "",
      endTime: "",
    };

    return {
      ...defaults,
      ...scheduleDraft,
      academicPeriodId:
        scheduleDraft?.academicPeriodId ?? defaults.academicPeriodId,
    };
  }, [
    activeAcademicPeriodId,
    formatTimeInput,
    scheduleDraft,
    scheduleFormMode,
    selectedSchedule,
  ]);

  const handleScheduleDelete = React.useCallback(
    async (schedule?: ScheduleItem) => {
      const target = schedule ?? selectedSchedule;
      if (!target) return;

      const confirmed = await confirm({
        title: "Hapus jadwal mengajar?",
        description: `${target.className} · ${target.subjectName} akan dihapus dari kalender.`,
        confirmText: "Hapus",
        cancelText: "Batal",
        confirmVariant: "destructive",
      });

      if (!confirmed) return;

      try {
        await deleteSchedule.mutateAsync({ id: target.id });
        showFeedback({
          tone: "success",
          title: "Jadwal dihapus",
          description: "Jadwal berhasil dihapus dari kalender.",
        });
        setIsScheduleFormOpen(false);
        setSelectedSchedule(null);
      } catch (error) {
        handleErrorFeedback(error, "Gagal menghapus jadwal");
      }
    },
    [
      confirm,
      deleteSchedule,
      handleErrorFeedback,
      selectedSchedule,
      showFeedback,
    ],
  );

  const columns = React.useMemo<ColumnDef<ScheduleItem>[]>(
    () => [
      {
        header: "Kelas",
        accessorKey: "className",
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-medium text-ink-strong">
              {row.original.className}
            </div>
            <p className="text-xs text-ink-muted">
              Periode: {row.original.academicPeriodName}
            </p>
          </div>
        ),
      },
      {
        header: "Mata pelajaran",
        accessorKey: "subjectName",
        cell: ({ row }) => (
          <span className="text-sm text-ink">{row.original.subjectName}</span>
        ),
      },
      {
        header: "Guru pengajar",
        accessorKey: "teacherName",
        cell: ({ row }) => (
          <span className="text-sm text-ink">{row.original.teacherName}</span>
        ),
      },
      {
        header: "Waktu",
        cell: ({ row }) => {
          const dayLabel = dayOptions.find(
            (option) => option.value === String(row.original.dayOfWeek),
          )?.label;
          const startTime = formatTimeInput(row.original.startTime);
          const endTime = formatTimeInput(row.original.endTime);

          return (
            <div className="text-sm text-ink">
              <div className="font-medium text-ink-strong">
                {dayLabel ?? "-"}
              </div>
              <div className="text-xs text-ink-muted">
                {startTime} - {endTime}
              </div>
            </div>
          );
        },
      },
      {
        header: "Aksi",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => openScheduleEdit(row.original)}
            >
              <PencilIcon className="h-4 w-4" aria-hidden="true" />
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-error hover:text-error"
              onClick={() => handleScheduleDelete(row.original)}
              disabled={deleteSchedule.isPending}
            >
              <Trash2Icon className="h-4 w-4" aria-hidden="true" />
              Hapus
            </Button>
          </div>
        ),
      },
    ],
    [deleteSchedule.isPending, formatTimeInput, openScheduleEdit, dayOptions],
  );

  const subjectSelectOptions = React.useMemo(
    () =>
      subjectOptions.map((subjectItem) => ({
        label: subjectItem.name,
        value: subjectItem.id,
      })),
    [subjectOptions],
  );

  const teacherSelectOptions = React.useMemo(
    () =>
      teacherOptions.map((teacher) => ({
        label: teacher.user.name,
        value: teacher.id,
      })),
    [teacherOptions],
  );

  const classSelectOptions = React.useMemo(
    () =>
      classOptions.map((classItem) => ({
        label: classItem.name,
        value: classItem.id,
      })),
    [classOptions],
  );

  React.useEffect(() => {
    if (
      viewMode === "calendar" &&
      classId === "ALL" &&
      classSelectOptions.length > 0
    ) {
      setClassId(classSelectOptions[0].value);
    }
  }, [classId, classSelectOptions, viewMode]);

  const emptyStateMessage = listSchedulesQuery.isLoading
    ? "Memuat data..."
    : "Belum ada jadwal.";
  const scheduleItems = schedulesQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-strong">
            Jadwal mengajar
          </h1>
          <p className="text-sm text-ink-muted">
            Atur jadwal mengajar untuk setiap kelas dan mata pelajaran.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              viewMode === "calendar"
                ? schedulesQuery.refetch()
                : listSchedulesQuery.refetch()
            }
            className="gap-2"
            disabled={
              viewMode === "calendar"
                ? !activeAcademicPeriodId
                : !activeAcademicPeriodId
            }
          >
            <RefreshCwIcon className="h-4 w-4" aria-hidden="true" />
            Muat ulang
          </Button>

          <Button
            type="button"
            onClick={() => openScheduleCreate()}
            className="gap-2"
            disabled={!canCreate}
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Tambah jadwal
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-surface-contrast p-6 space-y-4">
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
              Kalender
            </TabsTrigger>
          </TabsList>
        </TabsRoot>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <Select
              value={classId}
              onValueChange={(value) => setClassId(value as FilterId)}
              disabled={!workspace.academicYearId}
            >
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="Pilih kelas" />
              </SelectTrigger>
              <SelectContent>
                {viewMode !== "calendar" ? (
                  <SelectItem value="ALL">Semua kelas</SelectItem>
                ) : null}
                {classSelectOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={subjectId}
              onValueChange={(value) => setSubjectId(value as FilterId)}
            >
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="Mata pelajaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua mapel</SelectItem>
                {subjectSelectOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={teacherProfileId}
              onValueChange={(value) => setTeacherProfileId(value as FilterId)}
            >
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="Guru" />
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

            {viewMode === "list" ? (
              <Select
                value={dayOfWeek}
                onValueChange={(value) => setDayOfWeek(value as FilterId)}
              >
                <SelectTrigger className="w-full sm:w-52">
                  <SelectValue placeholder="Hari" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua hari</SelectItem>
                  {dayOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>

          <div className="text-xs text-ink-muted">
            {viewMode === "calendar"
              ? `Total: ${scheduleItems.length} jadwal`
              : `Total: ${total} jadwal`}
          </div>
        </div>

        {viewMode === "list" ? (
          <>
            {!activeAcademicPeriodId ? (
              <p className="mt-4 rounded-lg bg-surface-1 px-4 py-3 text-sm text-ink-muted">
                Periode akademik aktif belum ditentukan di workspace.
              </p>
            ) : null}

            <div className="mt-4">
              <DataTable
                data={listSchedulesQuery.data?.data ?? []}
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
            </div>
          </>
        ) : !activeAcademicPeriodId ? (
          <p className="mt-4 rounded-lg bg-surface-1 px-4 py-3 text-sm text-ink-muted">
            Periode akademik aktif belum ditentukan di workspace.
          </p>
        ) : (
          <div className="mt-4">
            <ScheduleCalendar
              schedules={scheduleItems}
              isLoading={schedulesQuery.isLoading}
              onCreateFromSlot={(payload) => openScheduleCreate(payload)}
              onEdit={openScheduleEdit}
            />
          </div>
        )}
      </div>

      {isScheduleFormOpen ? (
        <ScheduleFormModal
          isOpen={isScheduleFormOpen}
          mode={scheduleFormMode}
          isSubmitting={createSchedule.isPending || updateSchedule.isPending}
          academicPeriodLabel={
            scheduleFormMode === "edit"
              ? (selectedSchedule?.academicPeriodName ?? "-")
              : (selectedAcademicPeriod?.name ?? "-")
          }
          classOptions={classSelectOptions}
          classSubjects={classSubjectAssignments}
          dayOptions={dayOptions}
          initialValues={scheduleInitialValues}
          onDelete={
            scheduleFormMode === "edit" ? handleScheduleDelete : undefined
          }
          isDeleting={deleteSchedule.isPending}
          onClose={() => {
            setIsScheduleFormOpen(false);
            setScheduleDraft(null);
          }}
          onSubmit={async (values) => {
            try {
              const payload = {
                academicPeriodId: values.academicPeriodId,
                classId: values.classId,
                subjectId: values.subjectId,
                teacherProfileId: values.teacherProfileId,
                dayOfWeek: Number(values.dayOfWeek),
                startTime: toIsoTime(values.startTime),
                endTime: toIsoTime(values.endTime),
              };

              if (scheduleFormMode === "create") {
                await createSchedule.mutateAsync(payload);
                showFeedback({
                  tone: "success",
                  title: "Jadwal dibuat",
                  description: "Slot waktu berhasil ditambahkan ke kalender.",
                });
              } else if (selectedSchedule) {
                await updateSchedule.mutateAsync({
                  id: selectedSchedule.id,
                  ...payload,
                });
                showFeedback({
                  tone: "success",
                  title: "Jadwal diperbarui",
                  description: "Perubahan jadwal berhasil disimpan.",
                });
              }

              setIsScheduleFormOpen(false);
              setScheduleDraft(null);
            } catch (error) {
              handleErrorFeedback(
                error,
                scheduleFormMode === "create"
                  ? "Gagal membuat jadwal"
                  : "Gagal memperbarui jadwal",
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
