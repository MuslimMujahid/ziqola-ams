import { Link } from "@tanstack/react-router";
import { Button } from "@repo/ui/button";
import { ClockIcon, PlayCircleIcon } from "lucide-react";
import {
  ScheduleDateStrip,
  ScheduleRoot,
  ScheduleStatusBadge,
  ScheduleTimeline,
  ScheduleTimelineItem,
} from "@/components/schedule/schedule";
import { useScheduleContext } from "../../../../../../components/schedule/schedule-context";
import type { TeacherScheduleItem } from "@/lib/services/api/teacher-dashboard";

type ScheduleCardProps = {
  schedules: TeacherScheduleItem[];
  isLoading?: boolean;
};

const FULL_DATE_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function getScheduleStatus(
  schedule: TeacherScheduleItem,
  now: Date = new Date(),
): "completed" | "in_progress" | "not_started" {
  const [startHours, startMinutes] = schedule.startTime
    .trim()
    .split(/[.:]/)
    .map((value) => Number(value));
  const [endHours, endMinutes] = schedule.endTime
    .trim()
    .split(/[.:]/)
    .map((value) => Number(value));

  const startTime = new Date(now);
  const endTime = new Date(now);
  startTime.setHours(startHours, startMinutes, 0, 0);
  endTime.setHours(endHours, endMinutes, 0, 0);

  if (now < startTime) {
    return "not_started";
  } else if (now >= startTime && now <= endTime) {
    return "in_progress";
  } else {
    return "completed";
  }
}

export function ScheduleCard({ schedules, isLoading }: ScheduleCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-3xl bg-surface-contrast p-6">
        <div className="mb-6 h-4 w-36 animate-pulse rounded bg-surface-1" />
        <div className="mb-6 flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((item) => (
            <div
              key={item}
              className="h-16 w-10 animate-pulse rounded-full bg-surface-1"
            />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-24 animate-pulse rounded-2xl bg-surface-1"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <ScheduleRoot
      schedules={schedules}
      renderSchedule={(schedule, context) => {
        const status = getScheduleStatus(schedule);
        const itemRef = context.registerScheduleItemRef?.(schedule.id);

        return (
          <ScheduleTimelineItem ref={itemRef} status={status}>
            <div className="flex-1 rounded-2xl bg-surface-1 p-4 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-ink-strong">
                    {schedule.subjectName}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    {schedule.className}
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-ink-subtle">
                    <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    {schedule.startTime} - {schedule.endTime}
                  </div>
                </div>

                <ScheduleStatusBadge status={status} />
              </div>

              {status === "not_started" ? (
                <div className="mt-3 flex gap-3 border-t border-surface-2 pt-3">
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 px-4 text-xs font-medium"
                    asChild
                  >
                    <Link to="/dashboard/teacher">
                      <PlayCircleIcon
                        className="mr-1.5 h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                      Mulai sesi
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-4 text-xs font-medium text-ink-muted hover:text-ink-strong"
                  >
                    Detail
                  </Button>
                </div>
              ) : null}
            </div>
          </ScheduleTimelineItem>
        );
      }}
    >
      <ScheduleCardContent />
    </ScheduleRoot>
  );
}

type ScheduleCardContentProps = {};

function ScheduleCardContent({}: ScheduleCardContentProps) {
  const { selectedDate } = useScheduleContext();

  return (
    <div className="relative rounded-3xl bg-surface-contrast p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-strong">
            Agenda Hari Ini
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            {FULL_DATE_FORMATTER.format(selectedDate)}
          </p>
        </div>
        <Link
          to="/dashboard/teacher"
          className="text-sm font-medium text-primary hover:underline"
        >
          Lihat semua
        </Link>
      </div>

      <ScheduleDateStrip />
      <ScheduleTimeline />
    </div>
  );
}
