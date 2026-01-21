import React from "react";

export type ScheduleBase = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type ScheduleDateOption =
  | {
      type: "date";
      date: Date;
      isPinnedToday: boolean;
    }
  | {
      type: "ellipsis";
    };

export type ScheduleContextValue<T extends ScheduleBase = any> = {
  today: Date;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  windowStart: Date;
  goPrevWindow: () => void;
  goNextWindow: () => void;
  dateOptions: ScheduleDateOption[];
  dateListRef: React.RefObject<HTMLDivElement | null>;
  scheduleCountsByDay: Record<number, number>;
  selectedSchedules: T[];
  renderSchedule: (
    schedule: T,
    context: ScheduleContextValue<T>,
  ) => React.ReactNode;
  registerScheduleItemRef?: (
    id: string,
  ) => (node: HTMLDivElement | null) => void;
};

const ScheduleContext = React.createContext<ScheduleContextValue<any> | null>(
  null,
);

function normalizeDayIndex(day: number): number {
  if (day === 7) return 0;
  if (day >= 0 && day <= 6) return day;
  const normalized = ((day % 7) + 7) % 7;
  return normalized === 7 ? 0 : normalized;
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(date.getDate() + amount);
  return next;
}

function normalizeDate(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function buildDateStrip(startDate: Date, length: number): Date[] {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  return Array.from({ length }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    date.setHours(0, 0, 0, 0);
    return date;
  });
}

type ScheduleStateProps<T extends ScheduleBase> = {
  schedules: T[];
  renderSchedule: (
    schedule: T,
    context: ScheduleContextValue<T>,
  ) => React.ReactNode;
};

export function useScheduleState<T extends ScheduleBase>({
  schedules,
  renderSchedule,
}: ScheduleStateProps<T>): ScheduleContextValue {
  const today = React.useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const DATE_WINDOW_SIZE = 14;
  const DATE_WINDOW_STEP = 7;

  const [selectedDate, setSelectedDate] = React.useState<Date>(today);
  const [windowStart, setWindowStart] = React.useState<Date>(
    addDays(today, -DATE_WINDOW_STEP),
  );

  const dateStrip = React.useMemo(
    () => buildDateStrip(windowStart, DATE_WINDOW_SIZE),
    [windowStart],
  );

  const windowEnd = React.useMemo(
    () => addDays(windowStart, DATE_WINDOW_SIZE - 1),
    [windowStart],
  );

  const dateOptions = React.useMemo<ScheduleDateOption[]>(() => {
    const normalizedToday = normalizeDate(today);
    const normalizedStart = normalizeDate(windowStart);
    const normalizedEnd = normalizeDate(windowEnd);
    const isTodayInWindow =
      normalizedToday >= normalizedStart && normalizedToday <= normalizedEnd;

    const baseOptions: ScheduleDateOption[] = dateStrip.map((date) => ({
      type: "date",
      date,
      isPinnedToday: false,
    }));

    if (isTodayInWindow) return baseOptions;

    if (normalizedToday < normalizedStart) {
      return [
        { type: "date", date: normalizedToday, isPinnedToday: true },
        { type: "ellipsis" },
        ...baseOptions,
      ];
    }

    return [
      ...baseOptions,
      { type: "ellipsis" },
      { type: "date", date: normalizedToday, isPinnedToday: true },
    ];
  }, [dateStrip, today, windowStart, windowEnd]);

  const dateListRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!dateListRef.current) return;

    const normalizedToday = normalizeDate(today);
    const normalizedStart = normalizeDate(windowStart);
    const normalizedEnd = normalizeDate(windowEnd);
    const isTodayInWindow =
      normalizedToday >= normalizedStart && normalizedToday <= normalizedEnd;

    if (isTodayInWindow) return;

    const list = dateListRef.current;
    const maxScrollLeft = Math.max(0, list.scrollWidth - list.clientWidth);
    const targetScroll = normalizedToday < normalizedStart ? 0 : maxScrollLeft;

    requestAnimationFrame(() => {
      list.scrollLeft = targetScroll;
    });
  }, [today, windowStart, windowEnd]);

  const scheduleCountsByDay = React.useMemo(() => {
    const counts: Record<number, number> = {};

    schedules.forEach((schedule) => {
      const dayIndex = normalizeDayIndex(schedule.dayOfWeek);
      counts[dayIndex] = (counts[dayIndex] ?? 0) + 1;
    });

    return counts;
  }, [schedules]);

  const selectedDayIndex = selectedDate.getDay();

  const selectedSchedules = React.useMemo(
    () =>
      schedules
        .filter(
          (schedule) =>
            normalizeDayIndex(schedule.dayOfWeek) === selectedDayIndex,
        )
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [schedules, selectedDayIndex],
  );

  const goPrevWindow = React.useCallback(() => {
    setWindowStart((current) => addDays(current, -DATE_WINDOW_STEP));
  }, []);

  const goNextWindow = React.useCallback(() => {
    setWindowStart((current) => addDays(current, DATE_WINDOW_STEP));
  }, []);

  return {
    today,
    selectedDate,
    setSelectedDate,
    windowStart,
    goPrevWindow,
    goNextWindow,
    dateOptions,
    dateListRef,
    scheduleCountsByDay,
    selectedSchedules,
    renderSchedule,
  };
}

type ScheduleProviderProps<T extends ScheduleBase> = {
  schedules: T[];
  renderSchedule: (
    schedule: T,
    context: ScheduleContextValue<T>,
  ) => React.ReactNode;
  children: React.ReactNode;
};

export function ScheduleProvider<T extends ScheduleBase>({
  schedules,
  renderSchedule,
  children,
}: ScheduleProviderProps<T>) {
  const value = useScheduleState<T>({ schedules, renderSchedule });

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useScheduleContext<T extends ScheduleBase = any>() {
  const context = React.useContext(ScheduleContext);
  if (!context) {
    throw new Error("useScheduleContext must be used within ScheduleProvider");
  }
  return context as ScheduleContextValue<T>;
}

type ScheduleAutoScrollArgs = {
  scheduleListRef: React.RefObject<HTMLDivElement | null>;
  scheduleItemRefs: React.RefObject<Map<string, HTMLDivElement | null>>;
  nowMinutes: number;
  getStartMinutes: (time: string) => number | null;
};

export function useScheduleAutoScroll({
  scheduleListRef,
  scheduleItemRefs,
  nowMinutes,
  getStartMinutes,
}: ScheduleAutoScrollArgs) {
  const { today, selectedDate, selectedSchedules } = useScheduleContext();

  React.useEffect(() => {
    if (!scheduleListRef.current || selectedSchedules.length === 0) return;

    const isTodaySelected =
      selectedDate.toDateString() === today.toDateString();

    const scheduleWithMinutes = selectedSchedules
      .map((schedule) => ({
        id: schedule.id,
        startMinutes: getStartMinutes(schedule.startTime),
      }))
      .filter((item) => item.startMinutes !== null) as Array<{
      id: string;
      startMinutes: number;
    }>;

    if (scheduleWithMinutes.length === 0) return;

    let targetId = scheduleWithMinutes[0].id;

    if (isTodaySelected) {
      const upcoming = scheduleWithMinutes.filter(
        (item) => item.startMinutes >= nowMinutes,
      );
      if (upcoming.length > 0) {
        targetId = upcoming[0].id;
      } else {
        targetId = scheduleWithMinutes[scheduleWithMinutes.length - 1].id;
      }
    }

    const target = scheduleItemRefs.current.get(targetId);
    if (!target) return;

    const container = scheduleListRef.current;
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const offsetTop = targetRect.top - containerRect.top;
    const scrollTop =
      container.scrollTop +
      offsetTop -
      (container.clientHeight / 2 - target.clientHeight / 2);
    const maxScrollTop = container.scrollHeight - container.clientHeight;
    const nextScrollTop = Math.max(0, Math.min(scrollTop, maxScrollTop));

    container.scrollTo({ top: nextScrollTop, behavior: "smooth" });
  }, [
    getStartMinutes,
    nowMinutes,
    scheduleItemRefs,
    scheduleListRef,
    selectedDate,
    selectedSchedules,
    today,
  ]);
}
