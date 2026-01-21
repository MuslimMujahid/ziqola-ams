import { createFileRoute } from "@tanstack/react-router";
import { useTeacherDashboard } from "@/lib/services/api/teacher-dashboard";
import {
  AcademicPeriodBadge,
  MyClassesCard,
  PendingTasksCard,
  PersonalInfoCard,
  ScheduleCard,
  TenantNewsCard,
  TenantScheduleCard,
} from "./teacher/-components";

export const Route = createFileRoute("/_authed/dashboard/_topnavs/teacher")({
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

const MOCK_PERSONAL_INFO = {
  name: "Rizky Aditya",
  username: "@rizkyaditya",
  birthDate: "12 Mei 1994",
  roleLabel: "Guru Matematika",
  email: "rizky.aditya@smabina.sch.id",
  phone: "+62 812-3456-7890",
  mainSubject: "Matematika",
  avatarUrl: null,
};

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

function TeacherDashboardPage() {
  const { data, isLoading } = useTeacherDashboard();

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
          periodName={data?.academicPeriod?.name ?? null}
          academicYearLabel={data?.academicPeriod?.academicYearLabel ?? null}
          isLoading={isLoading}
        />
      </div>

      {/* Top Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <PersonalInfoCard info={MOCK_PERSONAL_INFO} />
          <TenantNewsCard items={MOCK_TENANT_NEWS} />
          <TenantScheduleCard items={MOCK_TENANT_SCHEDULE} />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <ScheduleCard
            schedules={data?.todaySchedule ?? []}
            isLoading={isLoading}
          />
          <MyClassesCard classes={MOCK_CLASSES} />
          <PendingTasksCard
            tasks={data?.pendingTasks ?? []}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
