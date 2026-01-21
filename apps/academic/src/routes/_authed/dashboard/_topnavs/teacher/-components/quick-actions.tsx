import React from "react";

import { Link } from "@tanstack/react-router";
import {
  ArrowRightIcon,
  ClipboardCheckIcon,
  PencilLineIcon,
  PlayCircleIcon,
  ZapIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type QuickActionsProps = {
  className?: string;
};

type QuickAction = {
  label: string;
  description: string;
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  accent: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Mulai Sesi",
    description: "Mulai sesi pembelajaran baru",
    icon: PlayCircleIcon,
    to: "/dashboard/teacher",
    accent: "bg-primary/10 text-primary",
  },
  {
    label: "Input Kehadiran",
    description: "Catat kehadiran siswa",
    icon: ClipboardCheckIcon,
    to: "/dashboard/teacher",
    accent: "bg-success/10 text-success",
  },
  {
    label: "Input Nilai",
    description: "Masukkan nilai siswa",
    icon: PencilLineIcon,
    to: "/dashboard/teacher",
    accent: "bg-info/10 text-info",
  },
];

export function QuickActions({ className }: QuickActionsProps) {
  return (
    <section
      className={cn(
        "rounded-xl bg-surface-contrast p-6 shadow-none",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-strong">Aksi Cepat</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Mulai aktivitas harian tanpa lewat menu
          </p>
        </div>
        <span className="rounded-lg bg-primary/10 p-2 text-primary">
          <ZapIcon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.label}
              to={action.to}
              className="group flex h-full flex-col justify-between gap-2 rounded-lg bg-surface-1 p-3 text-left transition hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-strong">
                    {action.label}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {action.description}
                  </p>
                </div>
                <span className={cn("rounded-md p-2", action.accent)}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                <span>Mulai</span>
                <ArrowRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
