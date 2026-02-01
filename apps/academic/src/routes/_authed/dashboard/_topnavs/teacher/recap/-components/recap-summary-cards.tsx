import React from "react";
import {
  AlertTriangleIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  UsersIcon,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";

type RecapSummaryCardsProps = {
  average: number;
  median: number;
  passRate: number;
  remedialCount: number;
  totalStudents: number;
};

type SummaryCardItem = {
  label: string;
  value: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  accent: string;
};

export function RecapSummaryCards({
  average,
  median,
  passRate,
  remedialCount,
  totalStudents,
}: RecapSummaryCardsProps) {
  const formatScore = React.useCallback((value: number) => {
    if (!Number.isFinite(value)) return "0";
    return value.toFixed(1);
  }, []);

  const formatPercent = React.useCallback((value: number) => {
    if (!Number.isFinite(value)) return "0%";
    return `${value.toFixed(0)}%`;
  }, []);

  const cards: SummaryCardItem[] = [
    {
      label: "Rata-rata kelas",
      value: formatScore(average),
      description: `Berdasarkan ${totalStudents} siswa`,
      icon: BarChart3Icon,
      accent: "bg-primary/10 text-primary",
    },
    {
      label: "Nilai median",
      value: formatScore(median),
      description: "Nilai tengah setelah diurutkan",
      icon: UsersIcon,
      accent: "bg-info/10 text-info",
    },
    {
      label: "Persentase tercapai",
      value: formatPercent(passRate),
      description: "Memenuhi atau melampaui KKM",
      icon: CheckCircle2Icon,
      accent: "bg-success/10 text-success",
    },
    {
      label: "Remedial",
      value: String(remedialCount),
      description: "Di bawah KKM kelas",
      icon: AlertTriangleIcon,
      accent: "bg-warning/10 text-warning",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="rounded-lg bg-surface-contrast p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-ink-muted">
                  {card.label}
                </p>
                <p className="mt-1 text-2xl font-semibold text-ink-strong">
                  {card.value}
                </p>
              </div>
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  card.accent,
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-xs text-ink-muted">{card.description}</p>
          </div>
        );
      })}
    </div>
  );
}
