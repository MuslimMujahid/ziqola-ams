import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  type TeacherScheduleItem,
  useTeacherDashboard,
} from "@/lib/services/api/teacher-dashboard";
import { useTeacherProfileByUserId } from "@/lib/services/api/teachers";
import { Button } from "@repo/ui/button";
import { CustomFieldsModal } from "@/components/profile/custom-fields-modal";
import {
  type SessionItem,
  useInfiniteSessions,
} from "@/lib/services/api/sessions";
import { formatDateKey } from "@/components/schedule/schedule-context";
import { formatDateLongId } from "@/lib/utils/date";
import { useAuthStore } from "@/stores/auth.store";
import { TenantNewsCard, TenantScheduleCard } from "@/components/widgets";
import {
  AcademicPeriodBadge,
  MyClassesCard,
  PendingTasksCard,
  PersonalInfoCard,
  ScheduleCard,
} from "./-components";

export const Route = createFileRoute("/_authed/dashboard/_topnavs/teacher/")({
  staticData: { topnavId: "teacher" },
  component: TeacherDashboardPage,
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  ),
  pendingComponent: () => (
    <div className="flex items-center justify-center p-6">
      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-ink-strong" />
    </div>
  ),
});

const MOCK_CLASSES = [
  {
    id: "class-1",
    name: "XI IPA 1",
    subjectCount: 5,
    studentCount: 32,
    isHomeroom: true,
    nextSession: {
      dayLabel: "Hari ini",
      startTime: "09:30",
      endTime: "10:15",
      subjectName: "Matematika",
    },
  },
  {
    id: "class-2",
    name: "XI IPA 2",
    subjectCount: 4,
    studentCount: 30,
    isHomeroom: false,
    nextSession: {
      dayLabel: "Besok",
      startTime: "08:00",
      endTime: "08:45",
      subjectName: "Fisika",
    },
  },
  {
    id: "class-3",
    name: "X IPA 3",
    subjectCount: 3,
    studentCount: 28,
    isHomeroom: false,
    nextSession: null,
  },
];

const MOCK_TENANT_NEWS = [
  {
    id: "news-1",
    title: "Rapat koordinasi wali kelas",
    summary:
      "Rapat dilaksanakan pada Jumat pukul 13.00 untuk koordinasi program semester.",
    date: "21 Jan 2026",
    category: "announcement" as const,
  },
  {
    id: "news-2",
    title: "Pengumpulan nilai tengah semester",
    summary: "Batas akhir pengumpulan nilai adalah 28 Januari 2026.",
    date: "20 Jan 2026",
    category: "info" as const,
  },
  {
    id: "news-3",
    title: "Pelatihan e-rapor",
    summary: "Workshop penggunaan e-rapor untuk guru baru pada 30 Januari.",
    date: "19 Jan 2026",
    category: "announcement" as const,
  },
];

const MOCK_TENANT_SCHEDULE = [
  {
    id: "event-1",
    title: "Gladi resik upacara",
    date: "22 Jan 2026",
    startTime: "22 Jan 2026",
    endTime: "22 Jan 2026",
    location: "Lapangan utama",
  },
  {
    id: "event-2",
    title: "Rapat komite sekolah",
    date: "24 Jan 2026",
    startTime: "24 Jan 2026",
    endTime: "24 Jan 2026",
    location: "Aula sekolah",
  },
  {
    id: "event-3",
    title: "Simulasi ANBK",
    date: "27 Jan 2026",
    startTime: "27 Jan 2026",
    endTime: "28 Jan 2026",
    location: "Lab komputer",
  },
];

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

type TeacherScheduleWithDate = TeacherScheduleItem & { dateKey: string };

function mapSessionsToSchedule(
  sessions: SessionItem[],
): TeacherScheduleWithDate[] {
  return sessions.map((session) => {
    const sessionDate = new Date(session.date);
    const resolvedDate = Number.isNaN(sessionDate.getTime())
      ? new Date()
      : sessionDate;
    const dayOfWeek = resolvedDate.getDay();

    return {
      id: session.id,
      classId: session.classId,
      className: session.className,
      classSubjectId: session.classSubjectId,
      subjectId: session.subjectId,
      subjectName: session.subjectName,
      dayOfWeek,
      dateKey: formatDateKey(resolvedDate),
      startTime: formatSessionTime(session.startTime),
      endTime: formatSessionTime(session.endTime),
      sessionId: session.id,
      sessionStatus: null,
    };
  });
}

function TeacherDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId ?? "";
  const [isCustomFieldsOpen, setIsCustomFieldsOpen] = React.useState(false);
  const { data: dashboardData, isLoading: isDashboardLoading } =
    useTeacherDashboard();
  const today = React.useMemo(() => normalizeDate(new Date()), []);
  const [range, setRange] = React.useState(() => {
    const start = addDays(today, -DATE_WINDOW_STEP);
    const end = addDays(start, DATE_WINDOW_SIZE - 1);
    return { start, end };
  });
  const sessionsParams = React.useMemo(
    () => ({
      dateFrom: formatIsoDate(range.start),
      dateTo: formatIsoDate(range.end),
    }),
    [range.end, range.start],
  );
  const sessionsQuery = useInfiniteSessions(sessionsParams, {
    pageSize: 25,
  });
  const teacherProfileQuery = useTeacherProfileByUserId(user?.id ?? "", {
    enabled: Boolean(user?.id),
  });
  const teacherProfileId = teacherProfileQuery.data?.data.id ?? "";

  const sessionsData = React.useMemo(
    () => sessionsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [sessionsQuery.data?.pages],
  );

  const personalInfo = React.useMemo(() => {
    const profile = teacherProfileQuery.data?.data;
    const profileUser = profile?.user;
    const name = profileUser?.name ?? user?.name ?? "Guru";
    const birthDate = profileUser?.dateOfBirth
      ? formatDateLongId(profileUser.dateOfBirth)
      : undefined;

    return {
      name,
      birthDate,
      email: user?.email,
      phone: profileUser?.phoneNumber,
      avatarUrl: null,
    };
  }, [teacherProfileQuery.data?.data, user?.email, user?.name]);

  const todaySchedule = React.useMemo(
    () => mapSessionsToSchedule(sessionsData),
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-strong">
            Dashboard Guru
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Kelola jadwal mengajar, kehadiran, dan penilaian siswa
          </p>
        </div>
        <AcademicPeriodBadge
          periodName={dashboardData?.academicPeriod?.name ?? null}
          academicYearLabel={
            dashboardData?.academicPeriod?.academicYearLabel ?? null
          }
          isLoading={isDashboardLoading}
        />
      </div>

      {/* Top Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <PersonalInfoCard
            info={personalInfo}
            isLoading={teacherProfileQuery.isLoading}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsCustomFieldsOpen(true)}
            disabled={!teacherProfileId}
          >
            Lengkapi data tambahan
          </Button>
          <TenantNewsCard items={MOCK_TENANT_NEWS} />
          <TenantScheduleCard items={MOCK_TENANT_SCHEDULE} />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <ScheduleCard
            schedules={todaySchedule}
            isLoading={sessionsQuery.isLoading}
            onWindowShift={handleWindowShift}
          />
          <MyClassesCard classes={MOCK_CLASSES} />
          <PendingTasksCard
            tasks={dashboardData?.pendingTasks ?? []}
            isLoading={isDashboardLoading}
          />
        </div>
      </div>

      {isCustomFieldsOpen && teacherProfileId ? (
        <CustomFieldsModal
          isOpen={isCustomFieldsOpen}
          tenantId={tenantId}
          role="teacher"
          profileId={teacherProfileId}
          profileName={personalInfo.name}
          onClose={() => setIsCustomFieldsOpen(false)}
        />
      ) : null}
    </div>
  );
}
