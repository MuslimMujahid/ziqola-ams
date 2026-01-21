import React from "react";

import { MegaphoneIcon, NewspaperIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type TenantNewsItem = {
  id: string;
  title: string;
  summary: string;
  date: string;
  category: "info" | "announcement";
};

type TenantNewsCardProps = {
  items: TenantNewsItem[];
  isLoading?: boolean;
};

const CATEGORY_STYLES: Record<
  TenantNewsItem["category"],
  { label: string; bgColor: string; textColor: string }
> = {
  info: {
    label: "Info",
    bgColor: "bg-info/10",
    textColor: "text-info",
  },
  announcement: {
    label: "Pengumuman",
    bgColor: "bg-warning/10",
    textColor: "text-warning",
  },
};

export function TenantNewsCard({ items, isLoading }: TenantNewsCardProps) {
  const totalNews = React.useMemo(() => items.length, [items.length]);

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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink-strong">Berita</h2>
          <p className="mt-0.5 text-[11px] text-ink-muted">
            Kabar terbaru dari sekolah
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-warning/10 px-2 py-1 text-[10px] font-semibold text-warning">
            {totalNews} update
          </span>
          <span className="rounded-lg bg-warning/10 p-2 text-warning">
            <MegaphoneIcon className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </div>

      <div className="my-3 h-px bg-surface-1" aria-hidden="true" />

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <NewspaperIcon
            className="mb-2 h-10 w-10 text-ink-subtle"
            aria-hidden="true"
          />
          <p className="text-xs text-ink-muted">Belum ada berita terbaru</p>
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {items.map((item) => {
            const categoryStyle = CATEGORY_STYLES[item.category];

            return (
              <div
                key={item.id}
                className="px-2 py-3 transition hover:bg-surface-1"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-ink-subtle">
                      {item.date}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-ink-strong">
                      {item.title}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-1 text-[10px] font-semibold",
                      categoryStyle.bgColor,
                      categoryStyle.textColor,
                    )}
                  >
                    {categoryStyle.label}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-ink-muted">
                  {item.summary}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
