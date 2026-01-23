import React from "react";
import { BookOpenIcon, ClockIcon, MapPinIcon, UserIcon } from "lucide-react";

import {
  ScheduleDateStrip,
  ScheduleRoot,
  ScheduleStatusBadge,
  ScheduleTimeline,
  ScheduleTimelineItem,
  useScheduleContext,
} from "@/components/schedule";
import { useSessionMaterials } from "@/lib/services/api/session-materials";
import { cn } from "@/lib/utils/cn";
import { isRichTextEmpty } from "@/lib/utils/rich-text";
import { formatDateKey } from "@/components/schedule/schedule-context";
import {
  parseMaterialContent,
  ScheduleDetailDialog,
  type StudentScheduleItem,
} from "./schedule-detail-dialog";

export type StudentSessionItem = {
  id: string;
  scheduleId?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  subjectName: string;
  teacherName: string;
  className?: string | null;
  location?: string | null;
};

type StudentScheduleCardProps = {
  schedules: StudentScheduleItem[];
  sessions?: StudentSessionItem[];
  isLoading?: boolean;
  onWindowShift?: (args: {
    windowStart: Date;
    windowEnd: Date;
    direction: "prev" | "next";
  }) => void;
};

const FULL_DATE_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function normalizeDate(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function parseDateKey(dateKey: string): Date | null {
  const parsed = new Date(`${dateKey}T00:00:00.000`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateKeyFromDateLike(value: string): string {
  const parsedFromKey = parseDateKey(value);
  if (parsedFromKey) return formatDateKey(parsedFromKey);

  const parsedDate = new Date(value);
  if (!Number.isNaN(parsedDate.getTime())) {
    return formatDateKey(parsedDate);
  }

  return value;
}

function mergeStudentSchedules({
  scheduleItems,
  sessionItems,
}: {
  scheduleItems: StudentScheduleItem[];
  sessionItems: StudentSessionItem[];
}): StudentScheduleItem[] {
  const merged = new Map<string, StudentScheduleItem>();

  scheduleItems.forEach((item) => {
    const key = `${item.scheduleId ?? item.id}-${item.dateKey}`;
    merged.set(key, {
      ...item,
      sessionId: item.sessionId ?? null,
      className: item.className ?? null,
      scheduleId: item.scheduleId ?? item.id,
    });
  });

  sessionItems.forEach((session) => {
    const dateKey = toDateKeyFromDateLike(session.date);
    const key = session.scheduleId
      ? `${session.scheduleId}-${dateKey}`
      : `${dateKey}-${session.startTime}-${session.subjectName}`;

    const existing = merged.get(key);

    const combined: StudentScheduleItem = existing
      ? {
          ...existing,
          dateKey,
          startTime: session.startTime ?? existing.startTime,
          endTime: session.endTime ?? existing.endTime,
          subjectName: session.subjectName ?? existing.subjectName,
          teacherName: session.teacherName ?? existing.teacherName,
          location: session.location ?? existing.location,
          className: existing.className ?? session.className ?? null,
          scheduleId: existing.scheduleId ?? session.scheduleId ?? existing.id,
          sessionId: session.id,
        }
      : {
          id: session.id,
          scheduleId: session.scheduleId ?? null,
          sessionId: session.id,
          dateKey,
          startTime: session.startTime,
          endTime: session.endTime,
          subjectName: session.subjectName,
          teacherName: session.teacherName,
          location: session.location ?? null,
          className: session.className ?? null,
        };

    merged.set(key, combined);
  });

  return Array.from(merged.values()).sort((a, b) => {
    if (a.dateKey === b.dateKey) {
      return a.startTime.localeCompare(b.startTime);
    }
    return a.dateKey.localeCompare(b.dateKey);
  });
}

type SessionMaterialBadgeProps = {
  sessionId?: string | null;
};

function SessionMaterialBadge({ sessionId }: SessionMaterialBadgeProps) {
  const materialsQuery = useSessionMaterials(sessionId ?? "", {
    enabled: Boolean(sessionId),
  });

  const materialContent = React.useMemo(
    () => parseMaterialContent(materialsQuery.data?.content ?? null),
    [materialsQuery.data?.content],
  );

  const attachments = materialsQuery.data?.attachments ?? [];
  const links = materialsQuery.data?.links ?? [];
  const hasMaterial =
    !isRichTextEmpty(materialContent) ||
    attachments.length > 0 ||
    links.length > 0;

  if (materialsQuery.isLoading || materialsQuery.isFetching || !hasMaterial) {
    return null;
  }

  return (
    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-2 text-xs font-medium text-primary">
      <BookOpenIcon className="h-4 w-4" aria-hidden="true" />
      <span>Catatan Guru</span>
    </div>
  );
}

function getScheduleStatus(
  schedule: StudentScheduleItem,
  now: Date = new Date(),
): "completed" | "in_progress" | "not_started" {
  const scheduleDate = parseDateKey(schedule.dateKey) ?? now;
  const today = normalizeDate(now);
  const scheduleDay = normalizeDate(scheduleDate);

  if (scheduleDay.getTime() > today.getTime()) {
    return "not_started";
  }

  if (scheduleDay.getTime() < today.getTime()) {
    return "completed";
  }

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

export function StudentScheduleCard({
  schedules,
  sessions = [],
  isLoading,
  onWindowShift,
}: StudentScheduleCardProps) {
  const mergedSchedules = React.useMemo(
    () =>
      mergeStudentSchedules({
        scheduleItems: schedules,
        sessionItems: sessions,
      }),
    [schedules, sessions],
  );

  const [selectedSchedule, setSelectedSchedule] =
    React.useState<StudentScheduleItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleScheduleSelect = React.useCallback(
    (item: StudentScheduleItem) => {
      if (!item.sessionId) return;
      setSelectedSchedule(item);
      setIsDialogOpen(true);
    },
    [],
  );

  const handleDialogChange = React.useCallback((open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedSchedule(null);
    }
  }, []);

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
    <>
      <ScheduleRoot
        schedules={mergedSchedules}
        renderSchedule={(schedule, context) => {
          const status = getScheduleStatus(schedule);
          const itemRef = context.registerScheduleItemRef?.(schedule.id);
          const hasSession = Boolean(schedule.sessionId);

          const handleKeyDown = (
            event: React.KeyboardEvent<HTMLDivElement>,
          ) => {
            if (!hasSession) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleScheduleSelect(schedule);
            }
          };

          return (
            <ScheduleTimelineItem
              ref={itemRef}
              status={status}
              timeLabel={schedule.startTime}
            >
              <div
                className={cn(
                  "flex-1 rounded-2xl bg-surface-1 p-4 transition-colors",
                  hasSession &&
                    "cursor-pointer ring-offset-2 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                )}
                role={hasSession ? "button" : undefined}
                tabIndex={hasSession ? 0 : -1}
                onClick={
                  hasSession ? () => handleScheduleSelect(schedule) : undefined
                }
                onKeyDown={hasSession ? handleKeyDown : undefined}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-ink-strong">
                      {schedule.subjectName}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-ink-muted">
                      <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="truncate">{schedule.teacherName}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-xs text-ink-subtle">
                      <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      {schedule.startTime} - {schedule.endTime}
                    </div>
                  </div>

                  <ScheduleStatusBadge status={status} />
                </div>

                {schedule.location ? (
                  <div className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
                    <MapPinIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{schedule.location}</span>
                  </div>
                ) : null}

                {hasSession ? (
                  <SessionMaterialBadge sessionId={schedule.sessionId} />
                ) : null}
              </div>
            </ScheduleTimelineItem>
          );
        }}
        onWindowShift={onWindowShift}
      >
        <StudentScheduleCardContent />
      </ScheduleRoot>

      <ScheduleDetailDialog
        schedule={selectedSchedule}
        open={isDialogOpen && Boolean(selectedSchedule?.sessionId)}
        onOpenChange={handleDialogChange}
      />
    </>
  );
}

function StudentScheduleCardContent() {
  const { selectedDate } = useScheduleContext();

  return (
    <div className="relative rounded-3xl bg-surface-contrast p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-strong">
            Agenda hari ini
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            {FULL_DATE_FORMATTER.format(selectedDate)}
          </p>
        </div>
        <a
          href="/dashboard/student/schedule"
          className="text-sm font-medium text-primary hover:underline"
        >
          Lihat semua
        </a>
      </div>

      <ScheduleDateStrip />
      <ScheduleTimeline />
    </div>
  );
}
