import React from "react";
import { Button } from "@repo/ui/button";
import { cn } from "@/lib/utils";
import {
  ScheduleBase,
  ScheduleContextValue,
  ScheduleProvider,
  useScheduleAutoScroll,
  useScheduleContext,
} from "./schedule-context";
import {
  CalendarIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  PlayCircleIcon,
} from "lucide-react";

const DEFAULT_DAY_LABEL_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
});

const DEFAULT_MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  month: "short",
  year: "numeric",
});

const STATUS_CONFIG = {
  completed: {
    label: "Selesai",
    color: "bg-success/10 text-success",
    icon: CheckCircleIcon,
  },
  in_progress: {
    label: "Berlangsung",
    color: "bg-info/10 text-info",
    icon: PlayCircleIcon,
  },
  not_started: {
    label: "Belum dimulai",
    color: "bg-ink-subtle/10 text-ink-muted",
    icon: ClockIcon,
  },
} as const;

function formatDayLabel(date: Date): string {
  return DEFAULT_DAY_LABEL_FORMATTER.format(date).toUpperCase();
}

function parseTimeToMinutes(time: string): number | null {
  const [hours, minutes] = time
    .trim()
    .split(/[.:]/)
    .map((value) => Number(value));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

type ScheduleRootProps<T extends ScheduleBase> = {
  schedules: T[];
  renderSchedule: (
    schedule: T,
    context: ScheduleContextValue<T>,
  ) => React.ReactNode;
  className?: string;
  stripClassName?: string;
  listClassName?: string;
  children?: React.ReactNode;
};

export function ScheduleRoot<T extends ScheduleBase>({
  schedules,
  renderSchedule,
  className,
  children,
}: ScheduleRootProps<T>) {
  return (
    <ScheduleProvider schedules={schedules} renderSchedule={renderSchedule}>
      <div className={cn("space-y-6", className)}>{children}</div>
    </ScheduleProvider>
  );
}

type ScheduleDateStripProps = {
  prevIcon?: React.ReactNode;
  nextIcon?: React.ReactNode;
  className?: string;
  listClassName?: string;
};

export function ScheduleDateStrip({
  prevIcon,
  nextIcon,
  className,
  listClassName,
}: ScheduleDateStripProps) {
  const {
    dateOptions,
    dateListRef,
    selectedDate,
    setSelectedDate,
    scheduleCountsByDay,
    goPrevWindow,
    goNextWindow,
  } = useScheduleContext();

  return (
    <div className={cn("mb-6 flex items-center", className)}>
      <div className="min-w-18 text-xs font-medium text-ink-muted">
        {DEFAULT_MONTH_YEAR_FORMATTER.format(selectedDate)}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={goPrevWindow}
        aria-label="Previous date"
      >
        {prevIcon ?? <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />}
        <span className="sr-only">Previous date</span>
      </Button>
      <div
        ref={dateListRef}
        className={cn(
          "flex flex-1 gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          listClassName,
        )}
      >
        {dateOptions.map((option, index) => {
          if (option.type === "ellipsis") {
            return (
              <ScheduleDateEllipsis
                key={`ellipsis-${index}`}
                className="self-center"
              />
            );
          }

          const date = option.date;
          const isActive = date.toDateString() === selectedDate.toDateString();
          const dayIndex = date.getDay();
          const hasSchedule = (scheduleCountsByDay[dayIndex] ?? 0) > 0;

          const dayLabel = option.isPinnedToday
            ? "HARI INI"
            : formatDayLabel(date);

          return (
            <ScheduleDateButton
              key={date.toISOString()}
              dayLabel={dayLabel}
              dateLabel={date.getDate()}
              isActive={isActive}
              hasSchedule={hasSchedule}
              onClick={() => setSelectedDate(new Date(date))}
            />
          );
        })}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={goNextWindow}
        aria-label="Next date"
      >
        {nextIcon ?? (
          <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
        )}
        <span className="sr-only">Next date</span>
      </Button>
    </div>
  );
}

type ScheduleDateButtonProps = {
  dayLabel: string;
  dateLabel: string | number;
  isActive: boolean;
  hasSchedule?: boolean;
  onClick: () => void;
  className?: string;
};

export function ScheduleDateButton({
  dayLabel,
  dateLabel,
  isActive,
  hasSchedule,
  onClick,
  className,
}: ScheduleDateButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        "flex shrink-0 flex-col items-center gap-1 text-center",
        className,
      )}
    >
      <p
        className={cn(
          "text-xs font-medium",
          isActive ? "text-primary" : "text-ink-muted",
        )}
      >
        {dayLabel}
      </p>
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all",
          isActive
            ? "bg-primary text-white"
            : "bg-surface-1 text-ink-strong hover:bg-surface-2",
        )}
      >
        {dateLabel}
      </div>
      {hasSchedule && !isActive ? (
        <span className="h-1 w-1 rounded-full bg-primary" />
      ) : null}
    </button>
  );
}

type ScheduleDateEllipsisProps = {
  className?: string;
};

export function ScheduleDateEllipsis({ className }: ScheduleDateEllipsisProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex h-10 w-10 items-center justify-center text-xs font-semibold text-ink-subtle",
        className,
      )}
    >
      ..
    </div>
  );
}

type ScheduleStatus = "completed" | "in_progress" | "not_started";

type ScheduleTimelineContentProps<T extends ScheduleBase> = {
  context: ScheduleContextValue<T>;
  registerScheduleItemRef?: (
    id: string,
  ) => (node: HTMLDivElement | null) => void;
};

function ScheduleTimelineContent<T extends ScheduleBase>({
  context,
  registerScheduleItemRef,
}: ScheduleTimelineContentProps<T>) {

  if (context.selectedSchedules.length === 0) {
    return (
      <ScheduleEmptyState
        icon={CalendarIcon}
        title="Tidak ada jadwal"
        description="Tidak ada sesi mengajar pada tanggal ini"
      />
    );
  }

  const contextWithRefs = registerScheduleItemRef
    ? { ...context, registerScheduleItemRef }
    : context;

  return context.selectedSchedules.map((schedule) => (
    <React.Fragment key={schedule.id}>
      {context.renderSchedule(schedule, contextWithRefs)}
    </React.Fragment>
  ));
}

type ScheduleTimelineProps = {
  className?: string;
  listClassName?: string;
  lineClassName?: string;
};

export function ScheduleTimeline<T extends ScheduleBase = ScheduleBase>({
  className,
  listClassName,
  lineClassName,
}: ScheduleTimelineProps) {
  const context = useScheduleContext<T>();
  const scheduleListRef = React.useRef<HTMLDivElement | null>(null);
  const scheduleItemRefs = React.useRef(
    new Map<string, HTMLDivElement | null>(),
  );

  const nowMinutes = (() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  })();

  useScheduleAutoScroll({
    scheduleListRef,
    scheduleItemRefs,
    nowMinutes,
    getStartMinutes: parseTimeToMinutes,
  });

  const registerScheduleItemRef = React.useCallback(
    (id: string) => (node: HTMLDivElement | null) => {
      scheduleItemRefs.current.set(id, node);
    },
    [],
  );

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "absolute left-14 top-2 h-[calc(100%-1rem)] w-px bg-surface-2",
          lineClassName,
        )}
      />
      <div
        ref={scheduleListRef}
        className={cn(
          "max-h-105 space-y-6 overflow-y-auto pr-1",
          listClassName,
        )}
      >
        <ScheduleTimelineContent
          context={context}
          registerScheduleItemRef={registerScheduleItemRef}
        />
      </div>
    </div>
  );
}

type ScheduleTimelineItemProps = {
  status: "completed" | "in_progress" | "not_started";
  children: React.ReactNode;
  className?: string;
};

export const ScheduleTimelineItem = React.forwardRef<
  HTMLDivElement,
  ScheduleTimelineItemProps
>(function ScheduleTimelineItem({ status, children, className }, ref) {
  const { selectedDate } = useScheduleContext();

  return (
    <div ref={ref} className={cn("relative flex gap-4 pl-20", className)}>
      <div
        className={cn(
          "absolute left-14 top-4 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 bg-surface-contrast",
          status === "completed"
            ? "border-success"
            : status === "in_progress"
              ? "border-primary"
              : "border-surface-2",
        )}
      >
        {status === "completed" ? (
          <div className="h-2.5 w-2.5 rounded-full bg-success" />
        ) : null}
        {status === "in_progress" ? (
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
        ) : null}
      </div>
      <div className="absolute left-0 top-4 w-10 -translate-y-1/2 text-right text-xs font-medium leading-none text-ink-muted">
        {DEFAULT_DAY_LABEL_FORMATTER.format(selectedDate)}
      </div>
      {children}
    </div>
  );
});

ScheduleTimelineItem.displayName = "ScheduleTimelineItem";

type ScheduleStatusBadgeProps = {
  status: ScheduleStatus;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  className?: string;
};

export function ScheduleStatusBadge({
  icon: Icon,
  status,
  className,
}: ScheduleStatusBadgeProps) {
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = Icon ?? statusConfig.icon;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        statusConfig.color,
        className,
      )}
    >
      {Icon ? <Icon className="h-3 w-3" aria-hidden="true" /> : <StatusIcon />}
    </span>
  );
}

type ScheduleEmptyStateProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
};

export function ScheduleEmptyState({
  icon: Icon,
  title,
  description,
  className,
}: ScheduleEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className,
      )}
    >
      <Icon className="mb-3 h-12 w-12 text-ink-subtle" aria-hidden="true" />
      <p className="text-sm font-medium text-ink-strong">{title}</p>
      {description ? (
        <p className="mt-1 text-xs text-ink-muted">{description}</p>
      ) : null}
    </div>
  );
}
