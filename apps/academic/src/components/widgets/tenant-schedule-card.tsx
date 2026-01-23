import React from "react";

import { CalendarDaysIcon, MapPinIcon } from "lucide-react";

export type TenantScheduleItem = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string | null;
};

type TenantScheduleCardProps = {
  items: TenantScheduleItem[];
  isLoading?: boolean;
};

export function TenantScheduleCard({
  items,
  isLoading,
}: TenantScheduleCardProps) {
  const totalEvents = React.useMemo(() => items.length, [items.length]);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-surface-contrast p-4">
        <div className="mb-4 h-4 w-28 animate-pulse rounded bg-surface-1" />
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-14 animate-pulse rounded-lg bg-surface-1"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-xl bg-surface-contrast p-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-ink-strong">Jadwal</h2>
            <p className="mt-0.5 text-[11px] text-ink-muted">
              Agenda sekolah yang akan datang
            </p>
          </div>
          <span className="rounded-lg bg-primary/10 p-2 text-primary">
            <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
            {totalEvents} agenda
          </span>
        </div>
      </div>

      <div className="my-3 h-px bg-surface-1" aria-hidden="true" />

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <CalendarDaysIcon
            className="mb-2 h-10 w-10 text-ink-subtle"
            aria-hidden="true"
          />
          <p className="text-xs text-ink-muted">Belum ada agenda sekolah</p>
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {items.map((item) => (
            <div
              key={item.id}
              className="px-2 py-3 transition hover:bg-surface-1"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="mt-1 text-sm font-semibold text-ink-strong">
                    {item.title}
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                  {item.startTime} - {item.endTime}
                </span>
              </div>
              {item.location ? (
                <div className="mt-2 flex items-center gap-2 text-[11px] text-ink-muted">
                  <MapPinIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{item.location}</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
