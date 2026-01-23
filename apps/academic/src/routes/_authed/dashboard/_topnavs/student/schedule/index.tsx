import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@repo/ui/button";
import { BookOpenIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useSessions } from "@/lib/services/api/sessions";
import { useSchedules } from "@/lib/services/api/schedules";
import { useSessionMaterials } from "@/lib/services/api/session-materials";
import { formatDateKey } from "@/components/schedule/schedule-context";
import { isRichTextEmpty } from "@/lib/utils/rich-text";
import {
  ScheduleDetailDialog,
  parseMaterialContent,
  type StudentScheduleItem,
} from "@/routes/_authed/dashboard/_topnavs/student/-components";
import {
  WeeklyScheduleCalendar,
  type WeeklyScheduleItem,
} from "@/routes/_authed/dashboard/_topnavs/teacher/schedule/-components/weekly-schedule-calendar";

export const Route = createFileRoute(
  "/_authed/dashboard/_topnavs/student/schedule/",
)({
  staticData: { topnavId: "student" },
  component: StudentWeeklySchedulePage,
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  ),
  pendingComponent: () => (
    <div className="flex items-center justify-center p-6">
      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-ink-strong" />
    </div>
  ),
});

const DATE_RANGE_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function normalizeDate(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(value: Date, amount: number) {
  const next = new Date(value);
  next.setDate(value.getDate() + amount);
  return next;
}

function startOfWeekMonday(value: Date) {
  const normalized = normalizeDate(value);
  const day = normalized.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  normalized.setDate(normalized.getDate() + offset);
  return normalized;
}

function formatIsoDate(value: Date) {
  const year = value.getFullYear();
  const month = value.getMonth();
  const day = value.getDate();
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0)).toISOString();
}

function toDayOfWeek(date: Date) {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

function shiftDate(value: Date, days: number) {
  return normalizeDate(addDays(value, days));
}

function resolveDate(value: string) {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return new Date();
}

function formatTimeKey(value: string): string {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getHours().toString().padStart(2, "0")}:${parsed
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  }

  const match = value.match(/(\d{1,2})[:.](\d{2})/);
  if (match) {
    return `${match[1].padStart(2, "0")}:${match[2]}`;
  }

  return value;
}

function formatSessionTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return TIME_FORMATTER.format(parsed);
}

function buildSlotKey(item: {
  date: Date;
  startTime: string;
  endTime: string;
  classSubjectId: string;
}) {
  const dateKey = formatDateKey(item.date);
  return `${dateKey}-${formatTimeKey(item.startTime)}-${formatTimeKey(
    item.endTime,
  )}-${item.classSubjectId}`;
}

type SessionMaterialIndicatorProps = {
  sessionId?: string | null;
};

function SessionMaterialIndicator({
  sessionId,
}: SessionMaterialIndicatorProps) {
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

  if (
    !sessionId ||
    materialsQuery.isLoading ||
    materialsQuery.isFetching ||
    !hasMaterial
  ) {
    return null;
  }

  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
      <BookOpenIcon className="h-3 w-3" aria-hidden="true" />
      <span className="sr-only">Ada materi sesi</span>
    </span>
  );
}

function StudentWeeklySchedulePage() {
  const today = React.useMemo(() => normalizeDate(new Date()), []);
  const [selectedDate, setSelectedDate] = React.useState<Date>(today);

  const handlePrevWeek = React.useCallback(() => {
    setSelectedDate((prev) => shiftDate(prev, -7));
  }, []);

  const handleNextWeek = React.useCallback(() => {
    setSelectedDate((prev) => shiftDate(prev, 7));
  }, []);

  const windowStart = React.useMemo(
    () => startOfWeekMonday(selectedDate),
    [selectedDate],
  );
  const windowEnd = React.useMemo(() => addDays(windowStart, 6), [windowStart]);
  const windowDates = React.useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(windowStart, index)),
    [windowStart],
  );

  const sessionParams = React.useMemo(
    () => ({
      dateFrom: formatIsoDate(windowStart),
      dateTo: formatIsoDate(windowEnd),
    }),
    [windowEnd, windowStart],
  );

  const sessionsQuery = useSessions(sessionParams, { enabled: true });
  const schedulesQuery = useSchedules({}, { enabled: true });

  const scheduleItems = React.useMemo<WeeklyScheduleItem[]>(() => {
    const sessions = sessionsQuery.data?.data ?? [];
    const schedules = schedulesQuery.data?.data ?? [];

    const sessionItems = sessions.map((session) => {
      const date = resolveDate(session.date);
      return {
        id: session.id,
        date,
        dayOfWeek: toDayOfWeek(date),
        startTime: formatSessionTime(session.startTime),
        endTime: formatSessionTime(session.endTime),
        className: session.className,
        subjectName: session.subjectName,
        classSubjectId: session.classSubjectId,
        sessionId: session.id,
        teacherName: session.teacherName,
        location: null,
        source: "session" as const,
      };
    });

    const sessionMap = new Map<string, WeeklyScheduleItem>();
    sessionItems.forEach((item) => {
      sessionMap.set(buildSlotKey(item), item);
    });

    const scheduleOccurrences: WeeklyScheduleItem[] = [];

    windowDates.forEach((date) => {
      const dayOfWeek = toDayOfWeek(date);

      schedules.forEach((schedule) => {
        const scheduleDayOfWeek = Number(schedule.dayOfWeek);
        if (Number.isNaN(scheduleDayOfWeek)) return;
        if (scheduleDayOfWeek !== dayOfWeek) return;

        const item: WeeklyScheduleItem = {
          id: `${schedule.id}-${formatDateKey(date)}`,
          date,
          dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          className: schedule.className,
          subjectName: schedule.subjectName,
          classSubjectId: schedule.classSubjectId,
          sessionId: null,
          teacherName: schedule.teacherName,
          location: null,
          source: "schedule",
        };

        const slotKey = buildSlotKey(item);
        if (sessionMap.has(slotKey)) return;

        scheduleOccurrences.push(item);
      });
    });

    return [...sessionItems, ...scheduleOccurrences];
  }, [schedulesQuery.data?.data, sessionsQuery.data?.data, windowDates]);

  const itemsByDateKey = React.useMemo(() => {
    const grouped: Record<string, WeeklyScheduleItem[]> = {};

    scheduleItems.forEach((item) => {
      const key = formatDateKey(item.date);
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    return grouped;
  }, [scheduleItems]);

  const dateRangeLabel = React.useMemo(() => {
    if (windowDates.length === 0) return "";
    const startLabel = DATE_RANGE_FORMATTER.format(windowDates[0]);
    const endLabel = DATE_RANGE_FORMATTER.format(
      windowDates[windowDates.length - 1],
    );
    return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
  }, [windowDates]);

  const isLoading = sessionsQuery.isLoading || schedulesQuery.isLoading;
  const hasItems = scheduleItems.length > 0;

  const [selectedSchedule, setSelectedSchedule] =
    React.useState<StudentScheduleItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleDialogChange = React.useCallback((open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedSchedule(null);
    }
  }, []);

  const handleItemSelect = React.useCallback((item: WeeklyScheduleItem) => {
    if (!item.sessionId) return;
    setSelectedSchedule({
      id: item.id,
      scheduleId: null,
      sessionId: item.sessionId,
      dateKey: formatDateKey(item.date),
      startTime: item.startTime,
      endTime: item.endTime,
      subjectName: item.subjectName,
      teacherName: item.teacherName ?? "",
      className: item.className ?? null,
      location: item.location ?? null,
    });
    setIsDialogOpen(true);
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-surface-contrast p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-2 pb-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink-strong">
              Jadwal mingguan
            </p>
            <p className="text-xs text-ink-muted">
              Geser rentang 7 hari ke depan atau ke belakang.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              className="rounded-full bg-surface"
              size="icon"
              aria-label="Minggu sebelumnya"
              onClick={handlePrevWeek}
            >
              <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <p className="text-sm font-semibold text-ink-strong">
              {dateRangeLabel}
            </p>
            <Button
              type="button"
              variant="ghost"
              className="rounded-full bg-surface"
              size="icon"
              aria-label="Minggu berikutnya"
              onClick={handleNextWeek}
            >
              <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <WeeklyScheduleCalendar
            dates={windowDates}
            itemsByDateKey={itemsByDateKey}
            isLoading={isLoading}
            onItemSelect={handleItemSelect}
            renderItemIndicator={(item) => (
              <SessionMaterialIndicator sessionId={item.sessionId} />
            )}
          />

          {!isLoading && !hasItems ? (
            <div className="rounded-xl bg-surface-contrast p-6 text-center text-sm text-ink-muted">
              Belum ada jadwal pada rentang tanggal ini.
            </div>
          ) : null}
        </div>
      </div>

      <ScheduleDetailDialog
        schedule={selectedSchedule}
        open={isDialogOpen && Boolean(selectedSchedule?.sessionId)}
        onOpenChange={handleDialogChange}
      />
    </div>
  );
}
