import React from "react";
import { Link } from "@tanstack/react-router";
import { BarChart3Icon, CalendarIcon } from "lucide-react";

export type StudentAttendanceSchedule = {
  id: string;
  subjectName: string;
  attendanceRate: number;
  presentCount: number;
  totalCount: number;
};

export type StudentAttendanceSummary = {
  periodLabel: string;
  academicYearLabel: string;
  schedules: StudentAttendanceSchedule[];
};

interface StudentAttendanceSummaryCardProps {
  summary: StudentAttendanceSummary;
  isLoading?: boolean;
}

export function StudentAttendanceSummaryCard({
  summary,
  isLoading,
}: StudentAttendanceSummaryCardProps) {
  const averageRate = React.useMemo(() => {
    if (summary.schedules.length === 0) return 0;
    const total = summary.schedules.reduce(
      (acc, item) => acc + item.attendanceRate,
      0,
    );
    return Math.round(total / summary.schedules.length);
  }, [summary.schedules]);

  if (isLoading) {
    return (
      <div className="rounded-3xl bg-surface-contrast p-6">
        <div className="mb-4 h-4 w-44 animate-pulse rounded bg-surface-1" />
        <div className="mb-3 h-14 animate-pulse rounded-xl bg-surface-1" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-16 animate-pulse rounded-xl bg-surface-1"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-3xl bg-surface-contrast p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-strong">
            Ringkasan Kehadiran
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            {summary.periodLabel} • Tahun ajaran {summary.academicYearLabel}
          </p>
        </div>
        <Link
          to="/dashboard/student"
          className="text-sm font-medium text-primary hover:underline"
        >
          Lihat detail
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl bg-primary/5 px-4 py-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BarChart3Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-medium text-ink-muted">Rata-rata hadir</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-ink-strong">
              {averageRate}%
            </span>
            <span className="text-xs text-ink-subtle">per jadwal</span>
          </div>
        </div>
      </div>

      <div className="mt-4 divide-y divide-surface-2">
        {summary.schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CalendarIcon
              className="mb-3 h-10 w-10 text-ink-subtle"
              aria-hidden="true"
            />
            <p className="text-sm text-ink-muted">
              Belum ada jadwal dengan data kehadiran
            </p>
          </div>
        ) : (
          summary.schedules.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 px-2 py-3 transition hover:bg-surface-1"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CalendarIcon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-strong">
                  {item.subjectName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-ink-strong">
                  {item.attendanceRate}%
                </p>
                <p className="text-[11px] text-ink-subtle">
                  ({item.presentCount}/{item.totalCount})
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
