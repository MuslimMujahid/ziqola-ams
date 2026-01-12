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
        "w-full max-w-md rounded-lg border border-slate-200/80 bg-white p-6 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
