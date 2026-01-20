import React from "react";

import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  onChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("TabsTrigger must be used within TabsRoot");
  }
  return context;
}

type TabsRootProps = {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
};

export function TabsRoot({
  value,
  onValueChange,
  children,
  className,
}: TabsRootProps) {
  const contextValue = React.useMemo(
    () => ({ value, onChange: onValueChange }),
    [value, onValueChange],
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

type TabsListProps = React.HTMLAttributes<HTMLDivElement>;

export function TabsList({ className, ...props }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn("flex border-b border-surface-2", className)}
      {...props}
    />
  );
}

type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

export function TabsTrigger({
  value,
  icon: Icon,
  className,
  children,
  ...props
}: TabsTriggerProps) {
  const { value: activeValue, onChange } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      className={cn(
        "-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition",
        isActive
          ? "border-primary text-ink-strong"
          : "border-transparent text-ink-muted hover:text-ink",
        className,
      )}
      onClick={() => onChange(value)}
      {...props}
    >
      <span className="inline-flex items-center gap-2">
        {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
        {children}
      </span>
    </button>
  );
}
