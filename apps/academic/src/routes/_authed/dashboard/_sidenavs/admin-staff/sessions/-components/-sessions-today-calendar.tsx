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
import type { SessionItem } from "@/lib/services/api/sessions";
import { formatDateLocalLong, parseDateInputLocal } from "@/lib/utils/date";

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

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const formatTime = (value: string) => timeFormatter.format(new Date(value));

const getMinutesFromStart = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return date.getHours() * 60 + date.getMinutes();
};

type SlotPreset = {
  date: string;
  startTime: string;
  endTime: string;
};

type SessionsTodayCalendarProps = {
  sessions: SessionItem[];
  isLoading: boolean;
  todayDate: string;
  emptyMessage?: string;
  onCreateFromSlot: (payload: SlotPreset) => void;
  onEdit: (session: SessionItem) => void;
};

export function SessionsTodayCalendar({
  sessions,
  isLoading,
  todayDate,
  emptyMessage,
  onCreateFromSlot,
  onEdit,
}: SessionsTodayCalendarProps) {
  const columnTemplate = React.useMemo(() => "96px minmax(0, 1fr)", []);

  const rowTemplate = React.useMemo(
    () => `repeat(${HALF_HOUR_SLOTS.length}, ${ROW_HEIGHT_PX}px)`,
    [],
  );

  const resolveTone = React.useCallback((id: string) => {
    const toneIndex = id.charCodeAt(0) % NOTE_TONES.length;
    return NOTE_TONES[toneIndex];
  }, []);

  const getSessionMetrics = React.useCallback((session: SessionItem) => {
    const startMinutes = getMinutesFromStart(session.startTime);
    const endMinutes = getMinutesFromStart(session.endTime);

    const safeEnd = Math.max(startMinutes + 30, endMinutes);
    const durationMinutes = safeEnd - startMinutes;

    return { startMinutes, durationMinutes };
  }, []);

  const scrollAreaRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (isLoading || sessions.length === 0) return;

    const earliestStart = sessions.reduce<number>((acc, item) => {
      const start = getMinutesFromStart(item.startTime);
      return Math.min(acc, start);
    }, Number.POSITIVE_INFINITY);

    if (!Number.isFinite(earliestStart)) return;

    const target = Math.max(earliestStart * MINUTE_HEIGHT - 120, 0);
    const node = scrollAreaRef.current;
    if (node) {
      node.scrollTo({ top: target, behavior: "smooth" });
    }
  }, [isLoading, sessions]);

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
          <CalendarTitle>Sesi hari ini</CalendarTitle>
          <CalendarDescription>
            {formatDateLocalLong(parseDateInputLocal(todayDate))}
          </CalendarDescription>
        </div>
        <div className="text-xs text-ink-muted">{sessions.length} sesi</div>
      </CalendarHeader>

      {sessions.length === 0 && emptyMessage ? (
        <div className="rounded-lg bg-surface-1 px-4 py-3 text-sm text-ink-muted">
          {emptyMessage}
        </div>
      ) : null}

      <CalendarViewport
        ref={scrollAreaRef}
        className="max-h-180 overflow-x-auto"
      >
        <div className="min-w-240 rounded-lg border border-surface-2">
          <CalendarDayHeaderRow>
            <div className="h-12" />
            <CalendarDayHeader>Hari ini</CalendarDayHeader>
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

            <CalendarDayColumn>
              {HALF_HOUR_SLOTS.map((slot, index) => {
                const endSlot = HALF_HOUR_SLOTS[index + 1];
                const endLabel = endSlot?.label ?? slot.label;

                const slotPreset: SlotPreset = {
                  date: todayDate,
                  startTime: slot.label,
                  endTime: endLabel,
                };

                return (
                  <CalendarSlotButton
                    key={slot.index}
                    onClick={() => onCreateFromSlot(slotPreset)}
                    aria-label={`Tambah sesi pukul ${slot.label}`}
                  >
                    <span className="hidden rounded-sm bg-primary/10 px-2 py-1 text-[10px] text-primary group-hover:inline-flex">
                      Tambah
                    </span>
                  </CalendarSlotButton>
                );
              })}

              <CalendarEventsLayer>
                {sessions.map((session) => {
                  const { startMinutes, durationMinutes } =
                    getSessionMetrics(session);

                  return (
                    <CalendarEvent
                      key={session.id}
                      className={cn(resolveTone(session.id))}
                      topPx={startMinutes * MINUTE_HEIGHT}
                      heightPx={durationMinutes * MINUTE_HEIGHT - 8}
                      minHeightPx={36}
                      leftPx={4}
                      rightPx={4}
                      onClick={() => onEdit(session)}
                    >
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-ink-muted">
                        <span>{session.subjectName}</span>
                        <span className="text-ink-muted">
                          {formatTime(session.startTime)} -{" "}
                          {formatTime(session.endTime)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        <p className="text-sm font-semibold text-ink-strong">
                          {session.teacherName}
                        </p>
                        <p className="text-xs text-ink-muted">
                          • {session.className}
                        </p>
                      </div>
                    </CalendarEvent>
                  );
                })}
              </CalendarEventsLayer>
            </CalendarDayColumn>
          </CalendarGrid>
        </div>
      </CalendarViewport>
    </CalendarRoot>
  );
}
