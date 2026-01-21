import { CalendarDaysIcon } from "lucide-react";

type AcademicPeriodBadgeProps = {
  periodName: string | null;
  academicYearLabel: string | null;
  isLoading?: boolean;
};

export function AcademicPeriodBadge({
  periodName,
  academicYearLabel,
  isLoading,
}: AcademicPeriodBadgeProps) {
  if (isLoading) {
    return (
      <div className="inline-flex animate-pulse items-center gap-2 rounded-lg bg-surface-2 px-3 py-1.5">
        <div className="h-4 w-4 rounded bg-surface-3" />
        <div className="h-4 w-32 rounded bg-surface-3" />
      </div>
    );
  }

  if (!periodName || !academicYearLabel) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-1.5 text-sm text-warning">
        <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
        <span>Periode akademik belum aktif</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-sm text-primary">
      <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
      <span className="font-medium">
        {periodName} • {academicYearLabel}
      </span>
    </div>
  );
}
