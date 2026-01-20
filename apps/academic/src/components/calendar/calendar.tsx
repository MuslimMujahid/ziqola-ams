import React from "react";
import { cn } from "@/lib/utils";

type CalendarLayoutContextValue = {
  columnTemplate?: string;
  rowTemplate?: string;
  rowHeightPx?: number;
  totalGridHeightPx?: number;
};

const CalendarLayoutContext = React.createContext<
  CalendarLayoutContextValue | undefined
>(undefined);

const useCalendarLayout = () => React.useContext(CalendarLayoutContext) ?? {};

type CalendarRootProps = React.HTMLAttributes<HTMLDivElement> &
  CalendarLayoutContextValue;

/**
 * CalendarRoot provides layout context for calendar sub-components.
 */
export function CalendarRoot({
  columnTemplate,
  rowTemplate,
  rowHeightPx,
  totalGridHeightPx,
  className,
  children,
  ...props
}: CalendarRootProps) {
  const contextValue = React.useMemo(
    () => ({
      columnTemplate,
      rowTemplate,
      rowHeightPx,
      totalGridHeightPx,
    }),
    [columnTemplate, rowTemplate, rowHeightPx, totalGridHeightPx],
  );

  return (
    <CalendarLayoutContext.Provider value={contextValue}>
      <div className={cn("space-y-4", className)} {...props}>
        {children}
      </div>
    </CalendarLayoutContext.Provider>
  );
}

type CalendarHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export function CalendarHeader({ className, ...props }: CalendarHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3",
        className,
      )}
      {...props}
    />
  );
}

type CalendarTitleProps = React.HTMLAttributes<HTMLParagraphElement>;

export function CalendarTitle({ className, ...props }: CalendarTitleProps) {
  return (
    <p className={cn("text-sm font-semibold text-ink", className)} {...props} />
  );
}

type CalendarDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export function CalendarDescription({
  className,
  ...props
}: CalendarDescriptionProps) {
  return <p className={cn("text-xs text-ink-muted", className)} {...props} />;
}

type CalendarActionsProps = React.HTMLAttributes<HTMLDivElement>;

export function CalendarActions({ className, ...props }: CalendarActionsProps) {
  return (
    <div className={cn("flex items-center gap-3", className)} {...props} />
  );
}

type CalendarViewportProps = React.HTMLAttributes<HTMLDivElement>;

export const CalendarViewport = React.forwardRef<
  HTMLDivElement,
  CalendarViewportProps
>(({ className, style, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("overflow-y-auto", className)}
    style={{ scrollbarGutter: "stable both-edges", ...style }}
    {...props}
  />
));

CalendarViewport.displayName = "CalendarViewport";

type CalendarDayHeaderRowProps = React.HTMLAttributes<HTMLDivElement>;

export function CalendarDayHeaderRow({
  className,
  style,
  ...props
}: CalendarDayHeaderRowProps) {
  const { columnTemplate } = useCalendarLayout();

  return (
    <div
      className={cn("grid border-b border-surface-2 bg-surface", className)}
      style={{ gridTemplateColumns: columnTemplate, ...style }}
      {...props}
    />
  );
}

type CalendarDayHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export function CalendarDayHeader({
  className,
  ...props
}: CalendarDayHeaderProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-20 flex h-12 items-center justify-center border-l border-surface-2 bg-surface-contrast text-sm font-medium text-ink",
        className,
      )}
      {...props}
    />
  );
}

type CalendarGridProps = React.HTMLAttributes<HTMLDivElement>;

export function CalendarGrid({
  className,
  style,
  ...props
}: CalendarGridProps) {
  const { columnTemplate } = useCalendarLayout();

  return (
    <div
      className={cn("grid", className)}
      style={{ gridTemplateColumns: columnTemplate, ...style }}
      {...props}
    />
  );
}

type CalendarTimeColumnProps = React.HTMLAttributes<HTMLDivElement>;

export function CalendarTimeColumn({
  className,
  ...props
}: CalendarTimeColumnProps) {
  return (
    <div
      className={cn("sticky left-0 z-30 bg-surface-contrast", className)}
      {...props}
    />
  );
}

type CalendarDayColumnProps = React.HTMLAttributes<HTMLDivElement>;

export function CalendarDayColumn({
  className,
  style,
  ...props
}: CalendarDayColumnProps) {
  const { rowTemplate } = useCalendarLayout();

  return (
    <div
      className={cn("relative grid bg-surface", className)}
      style={{ gridTemplateRows: rowTemplate, ...style }}
      {...props}
    />
  );
}

type CalendarSlotButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function CalendarSlotButton({
  className,
  ...props
}: CalendarSlotButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "group flex h-full items-start border-b border-l border-surface-2/80 bg-surface-contrast/60 px-2 text-left text-[11px] text-ink-muted transition hover:bg-primary/5",
        className,
      )}
      {...props}
    />
  );
}

type CalendarEventsLayerProps = React.HTMLAttributes<HTMLDivElement> & {
  paddingPx?: number;
  heightPx?: number;
};

export function CalendarEventsLayer({
  className,
  style,
  paddingPx = 4,
  heightPx,
  ...props
}: CalendarEventsLayerProps) {
  const { totalGridHeightPx } = useCalendarLayout();

  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        height: heightPx ?? totalGridHeightPx,
        padding: `${paddingPx}px`,
        ...style,
      }}
      {...props}
    />
  );
}

type CalendarEventProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  topPx?: number;
  heightPx?: number;
  minHeightPx?: number;
  leftPx?: number;
  rightPx?: number;
};

export function CalendarEvent({
  className,
  style,
  topPx,
  heightPx,
  minHeightPx,
  leftPx,
  rightPx,
  ...props
}: CalendarEventProps) {
  return (
    <button
      type="button"
      className={cn(
        "pointer-events-auto relative flex flex-col gap-1 rounded-lg border px-3 py-2 text-left text-xs transition",
        "hover:-translate-y-0.5 hover:scale-[1.01]",
        className,
      )}
      style={{
        top: topPx === undefined ? undefined : `${topPx}px`,
        height: heightPx === undefined ? undefined : `${heightPx}px`,
        minHeight: minHeightPx === undefined ? undefined : `${minHeightPx}px`,
        left: leftPx === undefined ? undefined : `${leftPx}px`,
        right: rightPx === undefined ? undefined : `${rightPx}px`,
        position: "absolute",
        ...style,
      }}
      {...props}
    />
  );
}
