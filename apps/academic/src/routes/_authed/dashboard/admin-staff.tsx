import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  ActivityIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  DatabaseIcon,
  FileTextIcon,
  InfoIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  SettingsIcon,
  ShieldIcon,
  XCircleIcon,
  ZapIcon,
  UsersIcon,
  UserCogIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  AdminStaffDashboardLayout,
  type AdminStaffNavItem,
} from "./admin-staff-layout";

export const Route = createFileRoute("/_authed/dashboard/admin-staff")({
  component: AdminStaffDashboardPage,
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  ),
  pendingComponent: () => (
    <div className="space-y-6 p-6">
      <div className="h-32 animate-pulse rounded-xl bg-surface-1" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`stat-skeleton-${index}`}
            className="h-24 animate-pulse rounded-xl bg-surface-1"
          />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="h-64 animate-pulse rounded-xl bg-surface-1" />
        <div className="h-64 animate-pulse rounded-xl bg-surface-1" />
      </div>
    </div>
  ),
});

type StatItem = {
  label: string;
  value: string;
  helper: string;
  accent: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

type ShortcutItem = {
  label: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
};

type ChecklistItem = {
  label: string;
  status: "Aktif" | "Peringatan" | "Perlu tindakan";
  href: string;
};

type ActivityItem = {
  title: string;
  timestamp: string;
  detail: string;
};

type AlertItem = {
  title: string;
  detail: string;
  severity: "blocking" | "warning" | "info" | "success";
};

const NAV_ITEMS: AdminStaffNavItem[] = [
  {
    label: "Data master",
    to: "/dashboard/admin-staff/classes",
    icon: DatabaseIcon,
    subItems: [
      {
        label: "Tahun ajaran",
        to: "/dashboard/admin-staff/academic-years",
      },
      {
        label: "Periode akademik",
        to: "/dashboard/admin-staff/academic-periods",
      },
      {
        label: "Kelas",
        to: "/dashboard/admin-staff/classes",
      },
      {
        label: "Kelompok",
        to: "/dashboard/admin-staff/groups",
      },
      {
        label: "Siswa",
        to: "/dashboard/admin-staff/students",
      },
      {
        label: "Guru",
        to: "/dashboard/admin-staff/teachers",
      },
      {
        label: "Mata pelajaran",
        to: "/dashboard/admin-staff/subjects",
      },
    ],
  },
  {
    label: "Penjadwalan",
    to: "/dashboard/admin-staff/teaching-assignments",
    icon: ClipboardListIcon,
    subItems: [
      {
        label: "Penugasan mengajar",
        to: "/dashboard/admin-staff/teaching-assignments",
      },
      {
        label: "Jadwal pelajaran",
        to: "/dashboard/admin-staff/schedules",
      },
      {
        label: "Sesi pembelajaran",
        to: "/dashboard/admin-staff/sessions",
      },
    ],
  },
  {
    label: "Penilaian & rapor",
    to: "/dashboard/admin-staff/assessments",
    icon: FileTextIcon,
    subItems: [
      {
        label: "Komponen penilaian",
        to: "/dashboard/admin-staff/assessments",
      },
      {
        label: "Input nilai",
        to: "/dashboard/admin-staff/scores",
      },
      {
        label: "Rapor",
        to: "/dashboard/admin-staff/report-cards",
      },
    ],
  },
  {
    label: "Akses Pengguna",
    to: "/dashboard/admin-staff/users",
    icon: UsersIcon,
    subItems: [
      {
        label: "Pengguna",
        to: "/dashboard/admin-staff/users",
      },
      {
        label: "Peran & izin",
        to: "/dashboard/admin-staff/roles",
      },
      {
        label: "Audit perubahan",
        to: "/dashboard/admin-staff/audit-trails",
      },
    ],
  },
  {
    label: "Pengaturan",
    to: "/dashboard/admin-staff/settings",
    icon: SettingsIcon,
  },
];

const STAT_ITEMS: StatItem[] = [
  {
    label: "Total siswa",
    value: "1.248",
    helper: "Aktif periode ini",
    accent: "bg-primary/10 text-primary",
    icon: UsersIcon,
  },
  {
    label: "Total kelas",
    value: "38",
    helper: "1 kelas tanpa wali",
    accent: "bg-warning/10 text-warning",
    icon: LayoutDashboardIcon,
  },
  {
    label: "Mata pelajaran",
    value: "17",
    helper: "2 belum terpakai",
    accent: "bg-info/10 text-info",
    icon: BookOpenIcon,
  },
  {
    label: "Jadwal",
    value: "82%",
    helper: "3 kelas belum lengkap",
    accent: "bg-warning/10 text-warning",
    icon: CalendarDaysIcon,
  },
  {
    label: "Guru",
    value: "74",
    helper: "5 belum ditugaskan",
    accent: "bg-neutral/10 text-neutral",
    icon: ShieldIcon,
  },
  {
    label: "Isu data",
    value: "4",
    helper: "Perlu tindakan",
    accent: "bg-error/10 text-error",
    icon: AlertCircleIcon,
  },
];

const SHORTCUT_ITEMS: ShortcutItem[] = [
  {
    label: "Tambah siswa",
    description: "Input siswa aktif",
    icon: UsersIcon,
    href: "/dashboard/admin-staff",
  },
  {
    label: "Tambah kelas",
    description: "Buat rombel",
    icon: LayoutDashboardIcon,
    href: "/dashboard/admin-staff",
  },
  {
    label: "Atur jadwal",
    description: "Sinkron jadwal",
    icon: CalendarDaysIcon,
    href: "/dashboard/admin-staff",
  },
  {
    label: "Kelola mapel",
    description: "Struktur kurikulum",
    icon: FileTextIcon,
    href: "/dashboard/admin-staff",
  },
  {
    label: "Kelola guru",
    description: "Penugasan guru",
    icon: ShieldIcon,
    href: "/dashboard/admin-staff",
  },
  {
    label: "Edit profil sekolah",
    description: "Perbarui data admin",
    icon: UserCogIcon,
    href: "/dashboard/admin-staff/settings",
  },
];

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    label: "Tahun ajaran aktif",
    status: "Aktif",
    href: "/dashboard/admin-staff",
  },
  {
    label: "Periode akademik aktif",
    status: "Aktif",
    href: "/dashboard/admin-staff",
  },
  {
    label: "2 kelas belum memiliki wali kelas",
    status: "Perlu tindakan",
    href: "/dashboard/admin-staff",
  },
  {
    label: "Semua kelas memiliki guru per mata pelajaran",
    status: "Aktif",
    href: "/dashboard/admin-staff",
  },
  {
    label: "Jadwal bentrok pada 1 guru",
    status: "Peringatan",
    href: "/dashboard/admin-staff",
  },
];

const ACTIVITY_ITEMS: ActivityItem[] = [
  {
    title: "Siswa Andi Pratama ditambahkan",
    timestamp: "Hari ini, 08:45",
    detail: "Kelas XI IPA 1 · Sumber: Form pendaftaran",
  },
  {
    title: "Jadwal XI IPA 1 diperbarui",
    timestamp: "Hari ini, 10:10",
    detail: "2 mata pelajaran dipindah · Oleh: Admin TU",
  },
  {
    title: "Guru Budi ditetapkan sebagai wali kelas XI IPA 2",
    timestamp: "Kemarin, 16:20",
    detail: "Status wali kelas terkonfirmasi",
  },
];

const ALERT_ITEMS: AlertItem[] = [
  {
    title: "Bentrok jadwal guru",
    detail: "1 guru mengajar di dua kelas pada jam yang sama.",
    severity: "blocking",
  },
  {
    title: "Jadwal belum lengkap",
    detail: "3 kelas belum memiliki jadwal lengkap.",
    severity: "warning",
  },
  {
    title: "Periode akademik aktif",
    detail: "Semester 1 aktif, pastikan jadwal dipublikasikan.",
    severity: "info",
  },
  {
    title: "Validasi data siswa",
    detail: "Pengisian NISN lengkap untuk 20 siswa.",
    severity: "success",
  },
];

function AdminStaffDashboardPage() {
  const navItems = React.useMemo(() => NAV_ITEMS, []);

  return (
    <AdminStaffDashboardLayout navItems={navItems}>
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-xl bg-primary/70 p-6 text-white">
          <div
            className="absolute inset-y-0 right-[-12%] hidden w-64 rounded-full bg-white/6 blur-3xl md:block"
            aria-hidden="true"
          />

          <div className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold leading-tight">
                SMA Nusantara 1
              </h2>
            </div>

            <div className="flex w-full gap-3 text-sm sm:w-auto">
              <div className="rounded-xl bg-white/10 px-4 py-3">
                <p className="text-xs text-white/70">Tahun Ajaran</p>
                <div className="mt-1 flex items-center gap-2">
                  <CalendarDaysIcon
                    className="h-4 w-4 text-white"
                    aria-hidden="true"
                  />
                  <span className="font-semibold">2025/2026</span>
                </div>
              </div>
              <div className="rounded-xl bg-white/8 px-4 py-3">
                <p className="text-xs text-white/70">Periode berjalan</p>
                <div className="mt-1 flex items-center gap-2">
                  <CalendarDaysIcon
                    className="h-4 w-4 text-white"
                    aria-hidden="true"
                  />
                  <span className="font-semibold">Semester 1</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          id="aksi-cepat"
          className="space-y-3 rounded-xl bg-surface-contrast p-6 lg:col-span-2"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-strong">
            <ZapIcon className="h-4 w-4 text-primary" aria-hidden="true" />
            Aksi cepat
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {SHORTCUT_ITEMS.map((item) => {
              const Icon = item.icon;

              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-primary/25 bg-transparent px-3 py-2 text-sm font-semibold text-ink transition hover:border-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <span className="text-sm font-medium text-ink">
                    {item.label}
                  </span>
                  <span className="rounded-md border border-primary/40 p-2 text-primary transition group-hover:border-primary group-hover:bg-primary/10">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="ringkasan"
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
      >
        {STAT_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="relative overflow-hidden rounded-xl bg-surface-contrast p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-subtle">
                    {item.label}
                  </p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-semibold text-ink-strong">
                      {item.value}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {item.helper}
                    </span>
                  </div>
                </div>
                <span className={cn("rounded-lg p-2", item.accent)}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div id="daftar-periksa" className="rounded-xl bg-surface-contrast p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold text-ink-strong">
                <ListChecksIcon
                  className="h-4 w-4 text-ink-muted"
                  aria-hidden="true"
                />
                Daftar Periksa
              </h3>
              <p className="mt-1 text-xs text-ink-muted">
                Pastikan data akademik siap dipakai
              </p>
            </div>
            <span className="text-xs text-ink-subtle">5 poin dipantau</span>
          </div>
          <div className="mt-5 divide-y divide-border/60">
            {CHECKLIST_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center justify-between gap-4 px-2 py-3 text-sm transition hover:bg-surface-1"
              >
                <span className="text-ink">{item.label}</span>
                {item.status === "Aktif" ? (
                  <CheckCircle2Icon
                    className="h-4 w-4 text-success"
                    aria-label="Aktif"
                  />
                ) : item.status === "Perlu tindakan" ? (
                  <XCircleIcon
                    className="h-4 w-4 text-error"
                    aria-label="Perlu tindakan"
                  />
                ) : (
                  <AlertCircleIcon
                    className="h-4 w-4 text-warning"
                    aria-label="Peringatan"
                  />
                )}
              </a>
            ))}
          </div>
        </div>

        <div
          id="aktivitas-terbaru"
          className="rounded-xl bg-surface-contrast p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-base font-semibold text-ink-strong">
              <ActivityIcon
                className="h-4 w-4 text-ink-muted"
                aria-hidden="true"
              />
              Aktivitas Terbaru
            </h3>
            <span className="text-xs text-ink-subtle">3 aktivitas</span>
          </div>
          <div className="mt-5 divide-y divide-border/60">
            {ACTIVITY_ITEMS.map((item) => (
              <div key={item.title} className="px-2 py-3">
                <p className="text-sm font-medium text-ink">{item.title}</p>
                <p className="mt-1 text-xs text-ink-muted">{item.detail}</p>
                <span className="mt-1.5 inline-block text-[11px] text-ink-subtle">
                  {item.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="peringatan" className="rounded-xl bg-surface-contrast p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-ink-strong">
              <AlertTriangleIcon
                className="h-4 w-4 text-ink-muted"
                aria-hidden="true"
              />
              Peringatan
            </h3>
            <p className="mt-1 text-xs text-ink-muted">
              Hanya isu yang bisa ditindaklanjuti
            </p>
          </div>
          <span className="text-xs text-ink-subtle">4 peringatan</span>
        </div>
        <div className="mt-5 divide-y divide-border/60">
          {ALERT_ITEMS.map((item) => (
            <div key={item.title} className="flex items-start gap-3 px-2 py-3">
              {item.severity === "blocking" ? (
                <XCircleIcon
                  className="mt-0.5 h-4 w-4 shrink-0 text-error"
                  aria-label="Blocking"
                />
              ) : item.severity === "warning" ? (
                <AlertTriangleIcon
                  className="mt-0.5 h-4 w-4 shrink-0 text-warning"
                  aria-label="Warning"
                />
              ) : item.severity === "success" ? (
                <CheckCircle2Icon
                  className="mt-0.5 h-4 w-4 shrink-0 text-success"
                  aria-label="Sukses"
                />
              ) : (
                <InfoIcon
                  className="mt-0.5 h-4 w-4 shrink-0 text-info"
                  aria-label="Info"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{item.title}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AdminStaffDashboardLayout>
  );
}
