import React from "react";
import { cn } from "@/lib/utils";

type AuthCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-md rounded-lg bg-surface-contrast p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
