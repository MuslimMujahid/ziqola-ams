import React from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  ClipboardCheckIcon,
  ClockIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type StudentTaskStatus =
  | "overdue"
  | "due_soon"
  | "in_progress"
  | "submitted";

export type StudentTaskItem = {
  id: string;
  title: string;
  subjectName: string;
  dueDateLabel: string;
  status: StudentTaskStatus;
};

interface StudentTasksCardProps {
  tasks: StudentTaskItem[];
  isLoading?: boolean;
}

const STATUS_STYLES: Record<
  StudentTaskStatus,
  {
    label: string;
    bg: string;
    text: string;
    icon: React.ComponentType<{
      className?: string;
      "aria-hidden"?: boolean;
    }>;
  }
> = {
  overdue: {
    label: "Terlambat",
    bg: "bg-error/10",
    text: "text-error",
    icon: AlertTriangleIcon,
  },
  due_soon: {
    label: "Jatuh tempo",
    bg: "bg-warning/10",
    text: "text-warning",
    icon: ClockIcon,
  },
  in_progress: {
    label: "Dikerjakan",
    bg: "bg-info/10",
    text: "text-info",
    icon: ClipboardCheckIcon,
  },
  submitted: {
    label: "Dikumpulkan",
    bg: "bg-success/10",
    text: "text-success",
    icon: CheckCircleIcon,
  },
};

export function StudentTasksCard({ tasks, isLoading }: StudentTasksCardProps) {
  const totalTasks = React.useMemo(() => tasks.length, [tasks.length]);
  const overdueCount = React.useMemo(
    () => tasks.filter((task) => task.status === "overdue").length,
    [tasks],
  );

  if (isLoading) {
    return (
      <div className="rounded-3xl bg-surface-contrast p-6">
        <div className="mb-4 h-4 w-40 animate-pulse rounded bg-surface-1" />
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
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
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-strong">
            Tugas & Penugasan
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Kerjakan tugas yang akan jatuh tempo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-error/10 px-3 py-1 text-[11px] font-semibold text-error">
            {overdueCount} tertunda
          </span>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
            {totalTasks} tugas
          </span>
        </div>
      </div>

      <div className="my-4 h-px bg-surface-2" aria-hidden="true" />

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <ClipboardCheckIcon
            className="mb-3 h-10 w-10 text-ink-subtle"
            aria-hidden="true"
          />
          <p className="text-sm text-ink-muted">Belum ada tugas terbaru</p>
        </div>
      ) : (
        <div className="divide-y divide-surface-2">
          {tasks.map((task) => {
            const statusStyle = STATUS_STYLES[task.status];
            const StatusIcon = statusStyle.icon;

            return (
              <div
                key={task.id}
                className="flex items-start gap-3 px-2 py-3 transition hover:bg-surface-1"
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    statusStyle.bg,
                    statusStyle.text,
                  )}
                >
                  <StatusIcon className="h-4 w-4" aria-hidden={true} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-ink-subtle">
                    {task.subjectName}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-ink-strong">
                    {task.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-muted">
                    <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Jatuh tempo {task.dueDateLabel}</span>
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                    statusStyle.bg,
                    statusStyle.text,
                  )}
                >
                  {statusStyle.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Link
          to="/dashboard/student"
          className="text-sm font-medium text-primary hover:underline"
        >
          Lihat semua tugas
        </Link>
      </div>
    </section>
  );
}
