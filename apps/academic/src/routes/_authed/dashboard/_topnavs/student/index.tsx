import React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { AcademicPeriodBadge } from "@/routes/_authed/dashboard/_topnavs/teacher/-components";
import {
  TenantNewsCard,
  type TenantNewsItem,
  TenantScheduleCard,
  type TenantScheduleItem,
} from "@/components/widgets";
import { formatDateKey } from "@/components/schedule/schedule-context";
import { useAuthStore } from "@/stores/auth.store";
import {
  StudentProfileCard,
  StudentScheduleCard,
  StudentTasksCard,
  StudentAcademicProgressCard,
  type StudentScheduleItem,
  type StudentSessionItem,
  type StudentTaskItem,
  type PeriodAverageScore,
  type SubjectPerformanceItem,
} from "./-components";
import { useInfiniteSessions } from "@/lib/services/api/sessions";
import { type ScheduleItem, useSchedules } from "@/lib/services/api/schedules";
import { Button } from "@repo/ui/button";
import { CustomFieldsModal } from "@/components/profile/custom-fields-modal";
import { useStudentProfileByUserId } from "@/lib/services/api/students";
import { useProfileFieldsValues } from "@/lib/services/api/profile-custom-fields";
import { formatProfileValue } from "@/lib/utils/profile-custom-fields";

const TIME_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const DATE_WINDOW_SIZE = 14;
const DATE_WINDOW_STEP = 7;

function formatIsoDate(value: Date) {
  const year = value.getFullYear();
  const month = value.getMonth();
  const day = value.getDate();
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0)).toISOString();
}

function normalizeDate(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(value: Date, amount: number) {
  const next = new Date(value);
  next.setDate(value.getDate() + amount);
  return next;
}

function formatSessionTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return TIME_FORMATTER.format(parsed);
}

function getDayOfWeekValue(value: Date) {
  const day = value.getDay();
  return day === 0 ? 7 : day;
}

function buildDateList(start: Date, end: Date) {
  const dates: Date[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  while (cursor <= endDate) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function buildScheduleItemsFromSchedules(
  schedules: ScheduleItem[],
  range: { start: Date; end: Date },
): StudentScheduleItem[] {
  const dates = buildDateList(range.start, range.end);

  return schedules.flatMap((schedule) =>
    dates
      .filter((date) => getDayOfWeekValue(date) === schedule.dayOfWeek)
      .map((date) => ({
        id: `${schedule.id}-${formatDateKey(date)}`,
        scheduleId: schedule.id,
        dateKey: formatDateKey(date),
        subjectName: schedule.subjectName,
        teacherName: schedule.teacherName,
        startTime: formatSessionTime(schedule.startTime),
        endTime: formatSessionTime(schedule.endTime),
        location: null,
        className: schedule.className,
      })),
  );
}

export const Route = createFileRoute("/_authed/dashboard/_topnavs/student/")({
  staticData: { topnavId: "student" },
  component: StudentDashboardPage,
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  ),
  pendingComponent: () => (
    <div className="flex items-center justify-center p-6">
      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-ink-strong" />
    </div>
  ),
});

function StudentDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId ?? "";
  const [isCustomFieldsOpen, setIsCustomFieldsOpen] = React.useState(false);
  const studentProfileQuery = useStudentProfileByUserId(user?.id ?? "", {
    enabled: Boolean(user?.id),
  });
  const studentProfileId = studentProfileQuery.data?.data.id ?? "";
  const profileFieldsQuery = useProfileFieldsValues(
    tenantId,
    "student",
    studentProfileId,
    {
      enabled: Boolean(tenantId) && Boolean(studentProfileId),
    },
  );

  const today = React.useMemo(() => normalizeDate(new Date()), []);
  const [range, setRange] = React.useState(() => {
    const start = addDays(today, -DATE_WINDOW_STEP);
    const end = addDays(start, DATE_WINDOW_SIZE - 1);
    return { start, end };
  });

  const sessionParams = React.useMemo(
    () => ({
      dateFrom: formatIsoDate(range.start),
      dateTo: formatIsoDate(range.end),
    }),
    [range.end, range.start],
  );

  const sessionsQuery = useInfiniteSessions(sessionParams, {
    pageSize: 25,
  });
  const scheduleParams = React.useMemo(() => ({}), []);
  const schedulesQuery = useSchedules(scheduleParams, { enabled: true });

  const profileInfo = React.useMemo(() => {
    const fields = profileFieldsQuery.data?.data.fields ?? [];
    const values = profileFieldsQuery.data?.data.values ?? [];
    const nisField = fields.find((field) => field.key === "nis");
    const nisValue = nisField
      ? values.find((value) => value.fieldId === nisField.id)
      : undefined;

    const formattedNis = nisField
      ? formatProfileValue(nisField, nisValue)
      : "-";

    return {
      name: user?.name ?? "Siswa",
      className: "XI IPA 1",
      nis: formattedNis === "-" ? null : formattedNis,
      email: user?.email ?? "siswa@ziqola.sch.id",
      avatarUrl: null,
    };
  }, [
    profileFieldsQuery.data?.data.fields,
    profileFieldsQuery.data?.data.values,
    user?.email,
    user?.name,
  ]);

  const scheduleItems = React.useMemo<StudentScheduleItem[]>(
    () =>
      buildScheduleItemsFromSchedules(schedulesQuery.data?.data ?? [], range),
    [range, schedulesQuery.data?.data],
  );

  const sessionsData = React.useMemo(
    () => sessionsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [sessionsQuery.data?.pages],
  );

  const sessionItems = React.useMemo<StudentSessionItem[]>(
    () =>
      sessionsData.map((session) => ({
        id: session.id,
        scheduleId: session.scheduleId ?? null,
        date: session.date,
        subjectName: session.subjectName,
        teacherName: session.teacherName,
        startTime: formatSessionTime(session.startTime),
        endTime: formatSessionTime(session.endTime),
        location: null,
        className: session.className,
      })),
    [sessionsData],
  );

  const pendingRangeFetch = React.useRef<"prev" | "next" | null>(null);

  const handleWindowShift = React.useCallback(
    (args: {
      windowStart: Date;
      windowEnd: Date;
      direction: "prev" | "next";
    }) => {
      pendingRangeFetch.current = args.direction;
      setRange((current) => {
        if (args.direction === "prev") {
          const nextStart = addDays(current.start, -DATE_WINDOW_STEP);
          return { start: nextStart, end: current.end };
        }

        const nextEnd = addDays(current.end, DATE_WINDOW_STEP);
        return { start: current.start, end: nextEnd };
      });
    },
    [],
  );

  React.useEffect(() => {
    if (!pendingRangeFetch.current) return;
    pendingRangeFetch.current = null;
    sessionsQuery.fetchNextPage();
  }, [range.end, range.start, sessionsQuery]);

  const tenantNewsItems = React.useMemo<TenantNewsItem[]>(
    () => [
      {
        id: "news-1",
        title: "Simulasi Ujian Tengah Semester",
        summary:
          "Simulasi UTS akan berlangsung pada 27 Januari 2026 di aula sekolah.",
        date: "22 Jan 2026",
        category: "announcement",
      },
      {
        id: "news-2",
        title: "Pengumpulan tugas proyek IPA",
        summary: "Batas pengumpulan tugas proyek IPA adalah 30 Januari 2026.",
        date: "21 Jan 2026",
        category: "info",
      },
      {
        id: "news-3",
        title: "Pekan literasi sekolah",
        summary:
          "Pameran literasi dan bazar buku akan digelar 2 Februari 2026.",
        date: "20 Jan 2026",
        category: "announcement",
      },
    ],
    [],
  );

  const tenantScheduleItems = React.useMemo<TenantScheduleItem[]>(
    () => [
      {
        id: "event-1",
        title: "Upacara bendera",
        date: "24 Jan 2026",
        startTime: "07:00",
        endTime: "07:45",
        location: "Lapangan utama",
      },
      {
        id: "event-2",
        title: "Kelas inspirasi alumni",
        date: "26 Jan 2026",
        startTime: "10:00",
        endTime: "11:30",
        location: "Aula sekolah",
      },
      {
        id: "event-3",
        title: "Latihan pentas seni",
        date: "28 Jan 2026",
        startTime: "13:30",
        endTime: "15:00",
        location: "Studio seni",
      },
    ],
    [],
  );

  const studentTasks = React.useMemo<StudentTaskItem[]>(
    () => [
      {
        id: "task-1",
        title: "Ringkasan bab 3 ekosistem",
        subjectName: "Biologi",
        dueDateLabel: "24 Jan 2026",
        status: "due_soon",
      },
      {
        id: "task-2",
        title: "Latihan soal trigonometri",
        subjectName: "Matematika",
        dueDateLabel: "Hari ini",
        status: "in_progress",
      },
      {
        id: "task-3",
        title: "Esai analisis cerpen",
        subjectName: "Bahasa Indonesia",
        dueDateLabel: "22 Jan 2026",
        status: "overdue",
      },
      {
        id: "task-4",
        title: "Laporan praktikum larutan",
        subjectName: "Kimia",
        dueDateLabel: "27 Jan 2026",
        status: "submitted",
      },
    ],
    [],
  );

  const averageScores = React.useMemo<PeriodAverageScore[]>(
    () => [
      {
        periodId: "2024-ganjil",
        periodLabel: "Semester Ganjil 2024/2025",
        averageScore: 80,
      },
      {
        periodId: "2024-genap",
        periodLabel: "Semester Genap 2024/2025",
        averageScore: 82,
      },
      {
        periodId: "2025-ganjil",
        periodLabel: "Semester Ganjil 2025/2026",
        averageScore: 84,
      },
      {
        periodId: "2025-genap",
        periodLabel: "Semester Genap 2025/2026",
        averageScore: 87,
      },
    ],
    [],
  );

  const subjectPerformances = React.useMemo<SubjectPerformanceItem[]>(
    () => [
      {
        id: "perf-1",
        subjectName: "Matematika",
        attendanceRate: 93,
        finalScore: 88,
      },
      {
        id: "perf-2",
        subjectName: "Bahasa Indonesia",
        attendanceRate: 90,
        finalScore: 91,
      },
      {
        id: "perf-3",
        subjectName: "Fisika",
        attendanceRate: 75,
        finalScore: 84,
      },
      {
        id: "perf-4",
        subjectName: "Biologi",
        attendanceRate: 95,
        finalScore: 89,
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-strong">
            Dashboard Siswa
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Lihat agenda hari ini, berita sekolah, dan jadwal terbaru
          </p>
        </div>
        <AcademicPeriodBadge
          periodName="Semester Genap"
          academicYearLabel="2025/2026"
          isLoading={false}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <StudentProfileCard info={profileInfo} />
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsCustomFieldsOpen(true)}
            disabled={!studentProfileId}
          >
            Lengkapi data tambahan
          </Button>
          <StudentTasksCard tasks={studentTasks} />
          <TenantNewsCard items={tenantNewsItems} />
          <TenantScheduleCard items={tenantScheduleItems} />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <StudentAcademicProgressCard
            averages={averageScores}
            subjects={subjectPerformances}
          />
          <StudentScheduleCard
            schedules={scheduleItems}
            sessions={sessionItems}
            isLoading={sessionsQuery.isLoading || schedulesQuery.isLoading}
            onWindowShift={handleWindowShift}
          />
        </div>
      </div>

      {isCustomFieldsOpen && studentProfileId ? (
        <CustomFieldsModal
          isOpen={isCustomFieldsOpen}
          tenantId={tenantId}
          role="student"
          profileId={studentProfileId}
          profileName={profileInfo.name}
          onClose={() => setIsCustomFieldsOpen(false)}
        />
      ) : null}
    </div>
  );
}
