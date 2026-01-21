import { Link } from "@tanstack/react-router";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  ClipboardListIcon,
  UserCheckIcon,
  XCircleIcon,
} from "lucide-react";
import type { AttendanceSummary } from "@/lib/services/api/teacher-dashboard";
import { cn } from "@/lib/utils";

type AttendanceSummaryCardProps = {
  summary: AttendanceSummary;
  isLoading?: boolean;
};

const ATTENDANCE_STATS = [
  {
    key: "present" as const,
    label: "Hadir",
    icon: CheckCircleIcon,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    key: "excused" as const,
    label: "Izin",
    icon: UserCheckIcon,
    color: "text-info",
    bgColor: "bg-info/10",
  },
  {
    key: "sick" as const,
    label: "Sakit",
    icon: AlertCircleIcon,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    key: "absent" as const,
    label: "Alpha",
    icon: XCircleIcon,
    color: "text-error",
    bgColor: "bg-error/10",
  },
];

export function AttendanceSummaryCard({
  summary,
  isLoading,
}: AttendanceSummaryCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl bg-surface-contrast p-6">
        <div className="mb-5 h-4 w-28 animate-pulse rounded bg-surface-1" />
        <div className="mb-4 h-16 animate-pulse rounded-lg bg-surface-1" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-surface-1"
            />
          ))}
        </div>
      </div>
    );
  }

  const attendanceRate =
    summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0;

  return (
    <div className="rounded-xl bg-surface-contrast p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-strong">
            Kehadiran Hari Ini
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Pantau rasio hadir dan tindak lanjut izin
          </p>
        </div>
        <Link
          to="/dashboard/teacher"
          className="text-sm font-medium text-primary hover:underline"
        >
          Lihat detail
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-lg bg-primary/5 px-4 py-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ClipboardListIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-medium text-ink-muted">Rasio kehadiran</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-ink-strong">
              {attendanceRate}%
            </span>
            <span className="text-xs text-ink-subtle">
              ({summary.present}/{summary.total})
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {ATTENDANCE_STATS.map((stat) => {
          const Icon = stat.icon;
          const count = summary[stat.key];

          return (
            <div
              key={stat.key}
              className="rounded-lg bg-surface-1 p-3 transition hover:bg-surface-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn("rounded-md p-2", stat.bgColor, stat.color)}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className={cn("text-xs font-semibold", stat.color)}>
                  {stat.label}
                </span>
              </div>
              <p className="mt-3 text-xl font-semibold text-ink-strong">
                {count}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
