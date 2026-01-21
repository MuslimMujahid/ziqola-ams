import { Link } from "@tanstack/react-router";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  FileTextIcon,
  PencilLineIcon,
} from "lucide-react";
import type React from "react";
import type {
  PendingTask,
  PendingTaskType,
} from "@/lib/services/api/teacher-dashboard";
import { cn } from "@/lib/utils";

type PendingTasksCardProps = {
  tasks: PendingTask[];
  isLoading?: boolean;
};

const TASK_TYPE_CONFIG: Record<
  PendingTaskType,
  {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    color: string;
    bgColor: string;
  }
> = {
  missing_attendance: {
    icon: ClipboardCheckIcon,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  ungraded_component: {
    icon: PencilLineIcon,
    color: "text-error",
    bgColor: "bg-error/10",
  },
  draft_description: {
    icon: FileTextIcon,
    color: "text-info",
    bgColor: "bg-info/10",
  },
};

export function PendingTasksCard({ tasks, isLoading }: PendingTasksCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl bg-surface-contrast p-6">
        <div className="mb-5 h-4 w-28 animate-pulse rounded bg-surface-1" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-surface-1"
            />
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
            Tugas Tertunda
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Prioritaskan aksi yang perlu segera ditutup
          </p>
        </div>
        {tasks.length > 0 && (
          <span className="rounded-full bg-error/10 px-3 py-1 text-xs font-semibold text-error">
            {tasks.length} tugas
          </span>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <CheckCircle2Icon
            className="mb-2 h-10 w-10 text-success"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-success">
            Semua tugas telah selesai!
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Tidak ada tindakan yang tertunda
          </p>
        </div>
      ) : (
        <div className="mt-5 divide-y divide-border/60">
          {tasks.map((task) => {
            const config = TASK_TYPE_CONFIG[task.type];
            const TaskIcon = config.icon;

            return (
              <Link
                key={task.id}
                to={task.link}
                className="group flex items-start gap-3 px-2 py-3 transition hover:bg-surface-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    config.bgColor,
                  )}
                >
                  <TaskIcon
                    className={cn("h-4 w-4", config.color)}
                    aria-hidden="true"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-strong">
                    {task.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    {task.description}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-ink-subtle">
                    <span className="font-semibold text-ink">
                      {task.className}
                      {task.subjectName && ` • ${task.subjectName}`}
                    </span>
                    {task.dueDate && (
                      <span className="rounded-full bg-error/10 px-2 py-0.5 text-error">
                        Batas {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>

                <ArrowRightIcon
                  className="mt-1 h-4 w-4 shrink-0 text-ink-subtle transition group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}
