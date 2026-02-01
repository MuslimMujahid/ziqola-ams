import { Link } from "@tanstack/react-router";
import { BarChart3Icon, LockIcon } from "lucide-react";
import type { GradingProgressItem } from "@/lib/services/api/teacher-dashboard";
import { cn } from "@/lib/utils";

type GradingProgressCardProps = {
  progress: GradingProgressItem[];
  isLoading?: boolean;
};

export function GradingProgressCard({
  progress,
  isLoading,
}: GradingProgressCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl bg-surface-contrast p-6">
        <div className="mb-4 h-4 w-36 animate-pulse rounded bg-surface-1" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3 rounded-lg bg-surface-1 p-3">
              <div className="h-4 w-32 animate-pulse rounded bg-surface-2" />
              <div className="h-2 w-full animate-pulse rounded-full bg-surface-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface-contrast p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-strong">
            Progress Penilaian
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Pantau kelengkapan komponen nilai per kelas
          </p>
        </div>
        <Link
          to="/dashboard/teacher"
          className="text-sm font-medium text-primary hover:underline"
        >
          Kelola nilai
        </Link>
      </div>

      {progress.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <BarChart3Icon
            className="mb-2 h-10 w-10 text-ink-subtle"
            aria-hidden="true"
          />
          <p className="text-sm text-ink-muted">Belum ada data penilaian</p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {progress.map((item) => {
            const progressColor = getProgressColor(item.percentComplete);
            const progressLabel = getProgressLabel(item.percentComplete);

            return (
              <div
                key={item.classSubjectId}
                className="rounded-lg bg-surface-1 p-3 transition hover:bg-surface-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-strong">
                      {item.className}
                    </p>
                    <p className="truncate text-xs text-ink-muted">
                      {item.subjectName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.isLocked && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-ink-subtle/10 px-2 py-0.5 text-[10px] font-semibold text-ink-muted"
                        title="Nilai terkunci"
                      >
                        <LockIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        Kunci
                      </span>
                    )}
                    <span className="text-xs font-semibold text-ink-strong">
                      {item.completedComponents}/{item.totalComponents}
                    </span>
                  </div>
                </div>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-3">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      progressColor,
                    )}
                    style={{ width: `${item.percentComplete}%` }}
                    role="progressbar"
                    aria-valuenow={item.percentComplete}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progress penilaian ${item.className} ${item.subjectName}`}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-ink-subtle">
                  <span>{progressLabel}</span>
                  <span className="font-semibold text-ink-strong">
                    {item.percentComplete}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getProgressColor(percent: number): string {
  if (percent === 100) return "bg-success";
  if (percent >= 75) return "bg-info";
  if (percent >= 50) return "bg-warning";
  return "bg-error";
}

function getProgressLabel(percent: number): string {
  if (percent === 100) return "Tercapai";
  if (percent >= 75) return "Hampir selesai";
  if (percent >= 50) return "Dalam penilaian";
  return "Perlu dilengkapi";
}
