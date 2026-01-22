import React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CalendarDayColumn,
  CalendarDayHeader,
  CalendarDayHeaderRow,
  CalendarEvent,
  CalendarEventsLayer,
  CalendarGrid,
  CalendarRoot,
  CalendarTimeColumn,
  CalendarViewport,
} from "@/components/calendar";
import { formatDateKey } from "@/components/schedule/schedule-context";
import { cn } from "@/lib/utils";

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
});

const DATE_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const HALF_HOUR_SLOTS = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? 0 : 30;
  const label = `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;

  return { index, hour, minute, label };
});

const NOTE_TONES = [
  "bg-primary/10 border-primary/30 text-ink",
  "bg-amber-50 border-amber-200 text-ink",
  "bg-emerald-50 border-emerald-200 text-ink",
  "bg-sky-50 border-sky-200 text-ink",
];

const ROW_HEIGHT_PX = 52;
const TOTAL_GRID_HEIGHT = HALF_HOUR_SLOTS.length * ROW_HEIGHT_PX;
const MINUTE_HEIGHT = ROW_HEIGHT_PX / 30;

export type WeeklyScheduleItem = {
  id: string;
  date: Date;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  className: string;
  subjectName: string;
  classSubjectId: string;
  sessionId: string | null;
  source: "session" | "schedule";
};

type WeeklyScheduleCalendarProps = {
  dates: Date[];
  itemsByDateKey: Record<string, WeeklyScheduleItem[]>;
  isLoading?: boolean;
};

function getMinutesFromTime(value: string): number | null {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.getHours() * 60 + parsed.getMinutes();
  }

  const match = value.match(/(\d{1,2})[:.](\d{2})/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function formatTimeRange(startTime: string, endTime: string) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startTime} - ${endTime}`;
  }

  return `${TIME_FORMATTER.format(start)} - ${TIME_FORMATTER.format(end)}`;
}

function resolveTone(value: string) {
  if (!value) return NOTE_TONES[0];
  const toneIndex = value.charCodeAt(0) % NOTE_TONES.length;
  return NOTE_TONES[toneIndex];
}

export function WeeklyScheduleCalendar({
  dates,
  itemsByDateKey,
  isLoading,
}: WeeklyScheduleCalendarProps) {
  const navigate = useNavigate();

  const columnTemplate = React.useMemo(
    () => `96px repeat(${dates.length}, minmax(0, 1fr))`,
    [dates.length],
  );

  const rowTemplate = React.useMemo(
    () => `repeat(${HALF_HOUR_SLOTS.length}, ${ROW_HEIGHT_PX}px)`,
    [],
  );

  const scrollAreaRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (isLoading) return;

    const firstDateKey = formatDateKey(dates[0] ?? new Date());
    const firstItems = itemsByDateKey[firstDateKey] ?? [];
    const earliestStart = firstItems.reduce<number>((acc, item) => {
      const startMinutes = getMinutesFromTime(item.startTime);
      if (startMinutes === null) return acc;
      return Math.min(acc, startMinutes);
    }, Number.POSITIVE_INFINITY);

    if (!Number.isFinite(earliestStart)) return;

    const target = Math.max(earliestStart * MINUTE_HEIGHT - 120, 0);
    const node = scrollAreaRef.current;
    if (node) {
      node.scrollTo({ top: target, behavior: "smooth" });
    }
  }, [dates, isLoading, itemsByDateKey]);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-surface-contrast p-6">
        <div className="space-y-4">
          <div className="h-6 w-48 animate-pulse rounded-lg bg-surface-2" />
          <div className="h-80 w-full animate-pulse rounded-lg bg-surface-2" />
        </div>
      </div>
    );
  }

  return (
    <CalendarRoot
      className="rounded-xl bg-surface-contrast p-6"
      columnTemplate={columnTemplate}
      rowTemplate={rowTemplate}
      rowHeightPx={ROW_HEIGHT_PX}
      totalGridHeightPx={TOTAL_GRID_HEIGHT}
    >
      <div className="overflow-x-auto">
        <div className="min-w-240 rounded-lg border border-surface-2">
          <CalendarViewport ref={scrollAreaRef} className="max-h-152">
            <CalendarDayHeaderRow>
              <div className="h-12" />
              {dates.map((date) => (
                <CalendarDayHeader key={date.toISOString()}>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[11px] font-medium uppercase text-ink-muted">
                      {WEEKDAY_FORMATTER.format(date)}
                    </span>
                    <span className="text-xs font-semibold text-ink-strong">
                      {DATE_FORMATTER.format(date)}
                    </span>
                  </div>
                </CalendarDayHeader>
              ))}
            </CalendarDayHeaderRow>

            <CalendarGrid>
              <CalendarTimeColumn>
                <div className="grid" style={{ gridTemplateRows: rowTemplate }}>
                  {HALF_HOUR_SLOTS.map((slot) => (
                    <div
                      key={slot.index}
                      className="flex items-start justify-end px-3"
                    >
                      {slot.minute === 0 ? (
                        slot.index === 0 ? (
                          <span className="h-3 w-12" aria-hidden="true" />
                        ) : (
                          <span className="translate-y-[-0.35rem] text-xs font-medium text-ink">
                            {slot.label}
                          </span>
                        )
                      ) : (
                        <span
                          className="mt-1 h-px w-6 bg-surface-2"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CalendarTimeColumn>

              {dates.map((date) => {
                const dateKey = formatDateKey(date);
                const dayItems = (itemsByDateKey[dateKey] ?? []).slice();
                dayItems.sort((a, b) => a.startTime.localeCompare(b.startTime));

                return (
                  <CalendarDayColumn key={dateKey}>
                    {HALF_HOUR_SLOTS.map((slot) => (
                      <div
                        key={`${dateKey}-${slot.index}`}
                        className="h-full border-b border-l border-surface-2/80 bg-surface-contrast/60"
                        aria-hidden="true"
                      />
                    ))}

                    <CalendarEventsLayer>
                      {dayItems.map((item) => {
                        const startMinutes =
                          getMinutesFromTime(item.startTime) ?? 0;
                        const endMinutes =
                          getMinutesFromTime(item.endTime) ?? startMinutes + 30;
                        const safeEnd = Math.max(startMinutes + 30, endMinutes);
                        const durationMinutes = safeEnd - startMinutes;
                        const timeLabel = formatTimeRange(
                          item.startTime,
                          item.endTime,
                        );
                        const hasSession = Boolean(item.sessionId);
                        const toneClass = resolveTone(item.classSubjectId);

                        return (
                          <CalendarEvent
                            key={item.id}
                            topPx={startMinutes * MINUTE_HEIGHT}
                            heightPx={durationMinutes * MINUTE_HEIGHT - 8}
                            minHeightPx={36}
                            leftPx={4}
                            rightPx={4}
                            aria-disabled={!hasSession}
                            onClick={() => {
                              if (!item.sessionId) return;
                              navigate({
                                to: "/dashboard/teacher/sessions/$sessionId",
                                params: { sessionId: item.sessionId },
                              });
                            }}
                            className={cn(
                              "border text-ink",
                              toneClass,
                              hasSession
                                ? "cursor-pointer"
                                : "cursor-default opacity-90",
                            )}
                          >
                            <div className="flex flex-col gap-1">
                              <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                                {item.className}
                              </span>
                              <p className="truncate text-sm font-semibold text-ink-strong">
                                {item.subjectName}
                              </p>
                              <span className="text-xs font-medium text-ink-muted">
                                {timeLabel}
                              </span>
                            </div>
                          </CalendarEvent>
                        );
                      })}
                    </CalendarEventsLayer>
                  </CalendarDayColumn>
                );
              })}
            </CalendarGrid>
          </CalendarViewport>
        </div>
      </div>
    </CalendarRoot>
  );
}
