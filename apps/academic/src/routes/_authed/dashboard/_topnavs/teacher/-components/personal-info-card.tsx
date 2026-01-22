import React from "react";

import { CalendarIcon, MailIcon, PhoneIcon } from "lucide-react";

export type PersonalInfo = {
  name?: string;
  birthDate?: string;
  email?: string;
  phone?: string | null;
  avatarUrl?: string | null;
};

type PersonalInfoCardProps = {
  info: PersonalInfo;
  isLoading?: boolean;
};

export function PersonalInfoCard({ info, isLoading }: PersonalInfoCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl bg-surface-contrast p-6">
        <div className="mb-5 h-4 w-28 animate-pulse rounded bg-surface-1" />
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 animate-pulse rounded-full bg-surface-1" />
          <div className="space-y-2">
            <div className="h-4 w-40 animate-pulse rounded bg-surface-1" />
            <div className="h-3 w-24 animate-pulse rounded bg-surface-1" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-3 w-full animate-pulse rounded bg-surface-1"
            />
          ))}
        </div>
      </div>
    );
  }

  const initials = React.useMemo(() => {
    if (!info.name) return "";
    return info.name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [info.name]);

  return (
    <section className="rounded-xl bg-surface-contrast p-6 text-center">
      <div className="flex justify-center">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xl font-semibold text-primary">
          {info.avatarUrl ? (
            <img
              src={info.avatarUrl}
              alt={`Avatar ${info.name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
      </div>

      <h2 className="mt-4 text-lg font-semibold text-ink-strong">
        {info.name}
      </h2>

      <div className="my-4 h-px bg-surface-2" />

      <div className="space-y-3 text-left text-xs text-ink-muted">
        {info.birthDate ? (
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-warning/10 p-2 text-warning">
              <CalendarIcon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-ink">{info.birthDate}</span>
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-info/10 p-2 text-info">
            <MailIcon className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-ink">{info.email}</span>
        </div>

        {info.phone ? (
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-success/10 p-2 text-success">
              <PhoneIcon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-ink">{info.phone}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
