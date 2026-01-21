import React from "react";

import {
  BookOpenIcon,
  ClockIcon,
  UsersIcon,
  BadgeCheckIcon,
} from "lucide-react";

export type MyClassItem = {
  id: string;
  name: string;
  subjectCount: number;
  studentCount: number;
  isHomeroom: boolean;
  nextSession?: {
    dayLabel: string;
    startTime: string;
    endTime: string;
    subjectName: string;
  } | null;
};

type MyClassesCardProps = {
  classes: MyClassItem[];
  isLoading?: boolean;
};

export function MyClassesCard({ classes, isLoading }: MyClassesCardProps) {
  const totalClasses = React.useMemo(() => classes.length, [classes.length]);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-surface-contrast p-6">
        <div className="mb-5 h-4 w-28 animate-pulse rounded bg-surface-1" />
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-20 animate-pulse rounded-lg bg-surface-1"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-xl bg-surface-contrast p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-strong">Kelas Saya</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Ringkasan kelas yang kamu ajar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
            {totalClasses} kelas
          </span>
          <span className="rounded-lg bg-primary/10 p-2 text-primary">
            <BookOpenIcon className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <BookOpenIcon
            className="mb-2 h-10 w-10 text-ink-subtle"
            aria-hidden="true"
          />
          <p className="text-sm text-ink-muted">Belum ada kelas aktif</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {classes.map((item) => (
            <div
              key={item.id}
              className="rounded-lg bg-surface-1 p-4 transition hover:bg-surface-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-strong">
                    {item.name}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-ink-subtle">
                    <span className="inline-flex items-center gap-1">
                      <UsersIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      {item.studentCount} siswa
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BookOpenIcon
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                      {item.subjectCount} mapel
                    </span>
                  </div>
                </div>
                {item.isHomeroom && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[10px] font-semibold text-success">
                    <BadgeCheckIcon
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                    Wali Kelas
                  </span>
                )}
              </div>

              {item.nextSession ? (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs text-ink-muted">
                  <ClockIcon
                    className="h-3.5 w-3.5 text-primary"
                    aria-hidden="true"
                  />
                  <span className="font-semibold text-ink">
                    {item.nextSession.dayLabel}
                  </span>
                  <span>
                    {item.nextSession.startTime} - {item.nextSession.endTime}
                  </span>
                  <span className="text-ink-subtle">
                    • {item.nextSession.subjectName}
                  </span>
                </div>
              ) : (
                <div className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink-subtle">
                  Belum ada sesi berikutnya
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
