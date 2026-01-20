import React from "react";
import {
  CalendarDayColumn,
  CalendarDayHeader,
  CalendarDayHeaderRow,
  CalendarDescription,
  CalendarEvent,
  CalendarEventsLayer,
  CalendarGrid,
  CalendarHeader,
  CalendarRoot,
  CalendarSlotButton,
  CalendarTimeColumn,
  CalendarTitle,
  CalendarViewport,
} from "@/components/calendar";
import { cn } from "@/lib/utils";
import type { ScheduleItem } from "@/lib/services/api/schedules";

const WEEK_DAYS = [
  { label: "Senin", value: 1 },
  { label: "Selasa", value: 2 },
  { label: "Rabu", value: 3 },
  { label: "Kamis", value: 4 },
  { label: "Jumat", value: 5 },
  { label: "Sabtu", value: 6 },
  { label: "Minggu", value: 7 },
];

const HALF_HOUR_SLOTS = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? 0 : 30;
  const label = `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;

  return {
    index,
    hour,
    minute,
    label,
  };
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

type ScheduleCalendarProps = {
  schedules: ScheduleItem[];
  isLoading: boolean;
  onCreateFromSlot: (payload: SlotPreset) => void;
  onEdit: (schedule: ScheduleItem, preset?: SlotPreset) => void;
};

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const formatTime = (value: string) => timeFormatter.format(new Date(value));

const getMinutesFromStart = (value: string) => {
  const date = new Date(value);
  return date.getHours() * 60 + date.getMinutes();
};

type SlotPreset = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export function ScheduleCalendar({
  schedules,
  isLoading,
  onCreateFromSlot,
  onEdit,
}: ScheduleCalendarProps) {
  const baseDate = React.useMemo(() => {
    if (schedules.length > 0) {
      return new Date(schedules[0].startTime);
    }

    return new Date();
  }, [schedules]);

  const columnTemplate = React.useMemo(
    () => `96px repeat(${WEEK_DAYS.length}, minmax(0, 1fr))`,
    [],
  );

  const rowTemplate = React.useMemo(
    () => `repeat(${HALF_HOUR_SLOTS.length}, ${ROW_HEIGHT_PX}px)`,
    [],
  );

  const schedulesByDay = React.useMemo(() => {
    const map = new Map<number, ScheduleItem[]>();

    schedules.forEach((schedule) => {
      const current = map.get(schedule.dayOfWeek) ?? [];
      current.push(schedule);
      map.set(schedule.dayOfWeek, current);
    });

    Array.from(map.values()).forEach((list) =>
      list.sort((a, b) => a.startTime.localeCompare(b.startTime)),
    );

    return map;
  }, [schedules]);

  const buildSlotTime = React.useCallback(
    (slotIndex: number) => {
      const date = new Date(baseDate);
      date.setHours(0, 0, 0, 0);
      date.setMinutes(slotIndex * 30);
      return date.toISOString();
    },
    [baseDate],
  );

  const resolveTone = React.useCallback((id: string) => {
    const toneIndex = id.charCodeAt(0) % NOTE_TONES.length;
    return NOTE_TONES[toneIndex];
  }, []);

  const getScheduleMetrics = React.useCallback((schedule: ScheduleItem) => {
    const startMinutes = getMinutesFromStart(schedule.startTime);
    const endMinutes = getMinutesFromStart(schedule.endTime);

    const safeEnd = Math.max(startMinutes + 30, endMinutes);
    const durationMinutes = safeEnd - startMinutes;

    return { startMinutes, durationMinutes };
  }, []);

  const scrollAreaRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (isLoading || schedules.length === 0) return;

    const earliestStart = schedules.reduce<number>((acc, item) => {
      const start = getMinutesFromStart(item.startTime);
      return Math.min(acc, start);
    }, Number.POSITIVE_INFINITY);

    if (!Number.isFinite(earliestStart)) return;

    const target = Math.max(earliestStart * MINUTE_HEIGHT - 120, 0);
    const node = scrollAreaRef.current;
    if (node) {
      node.scrollTo({ top: target, behavior: "smooth" });
    }
  }, [isLoading, schedules]);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-surface-contrast p-6">
        <div className="space-y-4">
          <div className="h-6 w-48 animate-pulse rounded-lg bg-surface-2" />
          <div className="h-72 w-full animate-pulse rounded-lg bg-surface-2" />
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
      <CalendarHeader>
        <div className="space-y-1">
          <CalendarTitle>Jadwal mengajar kelas</CalendarTitle>
          <CalendarDescription>
            Klik sel kosong untuk menambahkan.
          </CalendarDescription>
        </div>
        <div />
      </CalendarHeader>

      <div className="overflow-x-auto">
        <div className="min-w-240 rounded-lg border border-surface-2">
          <CalendarViewport ref={scrollAreaRef} className="max-h-180">
            <CalendarDayHeaderRow>
              <div className="h-12" />
              {WEEK_DAYS.map((day) => (
                <CalendarDayHeader key={day.value}>
                  {day.label}
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

              {WEEK_DAYS.map((day) => {
                const daySchedules = schedulesByDay.get(day.value) ?? [];

                return (
                  <CalendarDayColumn key={day.value}>
                    {HALF_HOUR_SLOTS.map((slot) => {
                      const cellStart = buildSlotTime(slot.index);
                      const cellEnd = buildSlotTime(slot.index + 1);

                      const slotPreset: SlotPreset = {
                        dayOfWeek: day.value,
                        startTime: cellStart,
                        endTime: cellEnd,
                      };

                      return (
                        <CalendarSlotButton
                          key={`${day.value}-${slot.index}`}
                          onClick={() => {
                            onCreateFromSlot(slotPreset);
                          }}
                          aria-label={`Tambah jadwal ${day.label} pukul ${slot.label}`}
                        >
                          <span className="hidden rounded-sm bg-primary/10 px-2 py-1 text-[10px] text-primary group-hover:inline-flex">
                            Tambah
                          </span>
                        </CalendarSlotButton>
                      );
                    })}

                    <CalendarEventsLayer>
                      {daySchedules.map((schedule) => {
                        const { startMinutes, durationMinutes } =
                          getScheduleMetrics(schedule);

                        const schedulePreset: SlotPreset = {
                          dayOfWeek: schedule.dayOfWeek,
                          startTime: schedule.startTime,
                          endTime: schedule.endTime,
                        };

                        return (
                          <CalendarEvent
                            key={schedule.id}
                            className={cn(resolveTone(schedule.id))}
                            topPx={startMinutes * MINUTE_HEIGHT}
                            heightPx={durationMinutes * MINUTE_HEIGHT - 8}
                            minHeightPx={36}
                            leftPx={4}
                            rightPx={4}
                            onClick={() => {
                              onEdit(schedule, schedulePreset);
                            }}
                          >
                            <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-ink-muted">
                              <span>{schedule.className}</span>
                              <span className="text-ink-muted">
                                {formatTime(schedule.startTime)} -{" "}
                                {formatTime(schedule.endTime)}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                              <p className="text-sm font-semibold text-ink-strong">
                                {schedule.subjectName}
                              </p>
                              <p className="text-xs text-ink-muted">
                                • {schedule.teacherName}
                              </p>
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
