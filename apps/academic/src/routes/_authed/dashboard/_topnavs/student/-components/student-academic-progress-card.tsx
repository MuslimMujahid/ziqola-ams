import React from "react";
import { Link } from "@tanstack/react-router";
import type { TooltipItem } from "chart.js";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { AlertTriangleIcon, BookOpenIcon, MedalIcon } from "lucide-react";

import { cn } from "@/lib/utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

export type PeriodAverageScore = {
  periodId: string;
  periodLabel: string;
  averageScore: number;
};

export type SubjectPerformanceItem = {
  id: string;
  subjectName: string;
  attendanceRate: number;
  finalScore: number;
};

interface StudentAcademicProgressCardProps {
  averages: PeriodAverageScore[];
  subjects: SubjectPerformanceItem[];
  isLoading?: boolean;
}

export function StudentAcademicProgressCard({
  averages,
  subjects,
  isLoading,
}: StudentAcademicProgressCardProps) {
  const chartData = React.useMemo(
    () => ({
      labels: averages.map((item) => item.periodLabel),
      datasets: [
        {
          label: "Rata-rata nilai",
          data: averages.map((item) => item.averageScore),
          borderColor: "#2563EB",
          backgroundColor: "rgba(37, 99, 235, 0.15)",
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: "#2563EB",
          pointBorderColor: "#FFFFFF",
          borderWidth: 2,
        },
      ],
    }),
    [averages],
  );

  const chartOptions = React.useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: "index" as const,
          intersect: false,
          callbacks: {
            label: (ctx: TooltipItem<"line">) => `Rata-rata: ${ctx.parsed.y}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: "#64748B", maxRotation: 0 },
          grid: { display: false },
        },
        y: {
          ticks: { color: "#64748B" },
          min: 0,
          max: 100,
          grid: { color: "rgba(148, 163, 184, 0.25)" },
          border: { display: false },
        },
      },
    }),
    [],
  );

  if (isLoading) {
    return (
      <div className="rounded-3xl bg-surface-contrast p-6">
        <div className="mb-4 h-4 w-48 animate-pulse rounded bg-surface-1" />
        <div className="mb-5 h-16 animate-pulse rounded-xl bg-surface-1" />
        <div className="space-y-3">
          <div className="h-32 animate-pulse rounded-xl bg-surface-1" />
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-14 animate-pulse rounded-xl bg-surface-1"
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
            Performa Belajar
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Rata-rata nilai per periode dan nilai terbaru
          </p>
        </div>
        <Link
          to="/dashboard/student"
          className="text-sm font-medium text-primary hover:underline"
        >
          Lihat rapor
        </Link>
      </div>

      <div className="mt-4 rounded-xl bg-surface-1 p-4">
        {averages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BookOpenIcon
              className="mb-3 h-10 w-10 text-ink-subtle"
              aria-hidden="true"
            />
            <p className="text-sm text-ink-muted">
              Belum ada data rata-rata nilai
            </p>
          </div>
        ) : (
          <div className="mt-4 h-56">
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </div>

      {subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <BookOpenIcon
            className="mb-3 h-10 w-10 text-ink-subtle"
            aria-hidden="true"
          />
          <p className="text-sm text-ink-muted">
            Belum ada data performa mata pelajaran
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl mt-4">
          <div className="grid grid-cols-3 gap-3 border-b border-surface-2 px-4 py-3 text-xs font-semibold text-ink-subtle">
            <span>Pelajaran</span>
            <span className="text-center">Kehadiran</span>
            <span className="text-right">Nilai akhir</span>
          </div>
          <div className="divide-y divide-surface-2">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="grid grid-cols-3 items-center gap-3 px-4 py-3 text-sm transition hover:bg-surface-2"
              >
                <div className="flex items-center gap-2 font-semibold text-ink-strong">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <MedalIcon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="truncate">{subject.subjectName}</span>
                </div>
                <div className="text-center text-sm">
                  <span
                    className={cn(
                      "inline-flex min-w-14 items-center justify-center gap-1.5 rounded-full px-2 py-1 text-sm font-semibold",
                      subject.attendanceRate < 80
                        ? "bg-warning/10 text-warning"
                        : "text-ink-strong",
                    )}
                  >
                    {subject.attendanceRate < 80 ? (
                      <AlertTriangleIcon
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    ) : null}
                    {subject.attendanceRate}%
                  </span>
                </div>
                <div className="text-right text-sm font-semibold text-ink-strong">
                  {subject.finalScore}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
