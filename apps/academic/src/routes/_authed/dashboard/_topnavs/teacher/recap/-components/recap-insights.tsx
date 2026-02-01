import { cn } from "@/lib/utils/cn";

type RecapDistributionBucket = {
  label: string;
  count: number;
  percentage: number;
};

type RecapInsightsProps = {
  distribution: RecapDistributionBucket[];
  totalStudents: number;
};

export function RecapInsights({
  distribution,
  totalStudents,
}: RecapInsightsProps) {
  return (
    <div className="rounded-lg bg-surface-contrast p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink-strong">
            Distribusi nilai
          </h3>
          <p className="text-xs text-ink-muted">
            {totalStudents} siswa dalam filter terpilih
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {distribution.map((bucket) => (
          <div key={bucket.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>{bucket.label}</span>
              <span>{bucket.count} siswa</span>
            </div>
            <div className="h-2 rounded-full bg-surface-1">
              <div
                className={cn(
                  "h-2 rounded-full",
                  bucket.percentage >= 40
                    ? "bg-success/70"
                    : bucket.percentage >= 20
                      ? "bg-info/70"
                      : "bg-warning/70",
                )}
                style={{ width: `${bucket.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
