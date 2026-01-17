import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  ActivityIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  SettingsIcon,
  ShieldIcon,
  ZapIcon,
  UsersIcon,
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
    label: "Ringkasan",
    description: "Kesehatan sistem",
    to: "/dashboard/admin-staff",
    icon: LayoutDashboardIcon,
    subItems: [
      {
        label: "Kesehatan sistem",
        to: "/dashboard/admin-staff#ringkasan",
      },
      {
        label: "Aksi cepat",
        to: "/dashboard/admin-staff#aksi-cepat",
      },
      {
        label: "Daftar periksa",
        to: "/dashboard/admin-staff#daftar-periksa",
      },
      {
        label: "Aktivitas terbaru",
        to: "/dashboard/admin-staff#aktivitas-terbaru",
      },
      {
        label: "Peringatan",
        to: "/dashboard/admin-staff#peringatan",
      },
    ],
  },
  {
    label: "Struktur akademik",
    description: "Tahun ajaran & periode",
    to: "/dashboard/admin-staff/academic-years",
    icon: CalendarDaysIcon,
    subItems: [
      {
        label: "Tahun ajaran",
        to: "/dashboard/admin-staff/academic-years",
      },
      {
        label: "Periode akademik",
        to: "/dashboard/admin-staff/academic-periods",
      },
    ],
  },
  {
    label: "Data master",
    description: "Kelas, siswa, guru, mapel",
    to: "/dashboard/admin-staff/classes",
    icon: UsersIcon,
    subItems: [
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
    description: "Penugasan & jadwal",
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
    description: "Komponen nilai & rapor",
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
    label: "Akses & keamanan",
    description: "Pengguna & peran",
    to: "/dashboard/admin-staff/users",
    icon: ShieldIcon,
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
    description: "Kelola preferensi",
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
    <AdminStaffDashboardLayout
      title="Dashboard Staf Administrasi"
      description="Pantau kesiapan data akademik dan operasional harian dalam satu tampilan."
      navItems={navItems}
    >
      <section className="rounded-xl bg-surface-contrast p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">
              Konteks aktif
            </p>
            <h2 className="text-lg font-semibold text-ink-strong">
              SMA Nusantara 1
            </h2>
            <p className="text-sm text-ink-muted">
              Tahun Ajaran 2025/2026 · Semester 1
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
              Aktif
            </span>
            <span className="rounded-full bg-info/10 px-3 py-1 text-xs font-semibold text-info">
              Periode akademik berjalan
            </span>
          </div>
        </div>
      </section>

      <section
        id="ringkasan"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {STAT_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="relative overflow-hidden rounded-xl bg-surface-contrast p-4"
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

      <section id="aksi-cepat" className="rounded-xl bg-surface-contrast p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink-strong">
              <ZapIcon className="h-4 w-4 text-warning" aria-hidden="true" />
              Aksi cepat
            </h2>
            <p className="text-xs text-ink-muted">
              Shortcut yang sesuai akses staf administrasi
            </p>
          </div>
          <span className="text-xs text-ink-subtle">
            Semua tindakan mengarah ke dashboard
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {SHORTCUT_ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <a
                key={item.label}
                href={item.href}
                className="group rounded-xl bg-surface-1 p-4 transition hover:bg-surface-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-ink-strong">
                      {item.label}
                    </p>
                    <p className="text-xs text-ink-muted">{item.description}</p>
                  </div>
                  <span className="rounded-lg bg-surface-2 p-2 text-ink-subtle group-hover:bg-surface-3 group-hover:text-ink">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div id="daftar-periksa" className="rounded-xl bg-surface-contrast p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold text-ink-strong">
                <ListChecksIcon
                  className="h-4 w-4 text-success"
                  aria-hidden="true"
                />
                Daftar Periksa
              </h3>
              <p className="text-xs text-ink-muted">
                Pastikan data akademik siap dipakai
              </p>
            </div>
            <span className="text-xs text-ink-subtle">5 poin dipantau</span>
          </div>
          <div className="mt-4 space-y-3">
            {CHECKLIST_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center justify-between gap-3 rounded-xl bg-surface-1 p-3 text-sm transition hover:bg-surface-2"
              >
                <span className="font-medium text-ink">{item.label}</span>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-medium",
                    item.status === "Aktif"
                      ? "bg-success/10 text-success"
                      : item.status === "Perlu tindakan"
                        ? "bg-error/10 text-error"
                        : "bg-warning/10 text-warning",
                  )}
                >
                  {item.status}
                </span>
              </a>
            ))}
          </div>
        </div>

        <div
          id="aktivitas-terbaru"
          className="rounded-xl bg-surface-contrast p-5"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-base font-semibold text-ink-strong">
              <ActivityIcon className="h-4 w-4 text-info" aria-hidden="true" />
              Aktivitas Terbaru
            </h3>
            <span className="text-xs text-ink-subtle">3 aktivitas</span>
          </div>
          <div className="mt-4 space-y-3">
            {ACTIVITY_ITEMS.map((item) => (
              <div key={item.title} className="rounded-xl bg-surface-1 p-3">
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-xs text-ink-muted">{item.detail}</p>
                <span className="mt-2 inline-flex rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-subtle">
                  {item.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="peringatan" className="rounded-xl bg-surface-contrast p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-ink-strong">
              <AlertTriangleIcon
                className="h-4 w-4 text-warning"
                aria-hidden="true"
              />
              Peringatan
            </h3>
            <p className="text-xs text-ink-muted">
              Hanya isu yang bisa ditindaklanjuti
            </p>
          </div>
          <span className="text-xs text-ink-subtle">4 peringatan</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {ALERT_ITEMS.map((item) => (
            <div
              key={item.title}
              className={cn(
                "flex flex-col gap-2 rounded-xl p-4",
                item.severity === "blocking"
                  ? "bg-error/5"
                  : item.severity === "warning"
                    ? "bg-warning/5"
                    : item.severity === "success"
                      ? "bg-success/5"
                      : "bg-info/5",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-semibold",
                    item.severity === "blocking"
                      ? "bg-error/10 text-error"
                      : item.severity === "warning"
                        ? "bg-warning/10 text-warning"
                        : item.severity === "success"
                          ? "bg-success/10 text-success"
                          : "bg-info/10 text-info",
                  )}
                >
                  {item.severity === "blocking"
                    ? "Blocking"
                    : item.severity === "warning"
                      ? "Warning"
                      : item.severity === "success"
                        ? "Sukses"
                        : "Info"}
                </span>
              </div>
              <p className="text-xs text-ink-muted">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </AdminStaffDashboardLayout>
  );
}
