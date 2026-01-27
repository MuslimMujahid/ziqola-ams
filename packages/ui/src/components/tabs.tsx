import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "group/tabs flex flex-col gap-4 data-[orientation=vertical]:flex-row",
        className,
      )}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-full flex-wrap items-center gap-1 overflow-x-auto overflow-y-hidden text-ink-muted group-data-[orientation=horizontal]/tabs:border-b group-data-[orientation=horizontal]/tabs:border-surface-2 group-data-[orientation=vertical]/tabs:h-full group-data-[orientation=vertical]/tabs:flex-col group-data-[orientation=vertical]/tabs:border-r group-data-[orientation=vertical]/tabs:border-surface-2",
  {
    variants: {
      variant: {
        line: "bg-transparent",
        subtle: "rounded-lg bg-surface-1 px-1 py-0.5",
      },
    },
    defaultVariants: {
      variant: "line",
    },
  },
);

function TabsList({
  className,
  variant = "line",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  icon: Icon,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & {
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
        "group-data-[orientation=horizontal]/tabs:-mb-px group-data-[orientation=horizontal]/tabs:border-b-2 group-data-[orientation=horizontal]/tabs:border-transparent group-data-[orientation=horizontal]/tabs:data-[state=active]:border-primary group-data-[orientation=horizontal]/tabs:data-[state=active]:text-ink-strong group-data-[orientation=horizontal]/tabs:data-[state=inactive]:text-ink-muted group-data-[orientation=horizontal]/tabs:data-[state=inactive]:hover:text-ink",
        "group-data-[orientation=vertical]/tabs:-mr-px group-data-[orientation=vertical]/tabs:border-r-2 group-data-[orientation=vertical]/tabs:border-transparent group-data-[orientation=vertical]/tabs:data-[state=active]:border-primary group-data-[orientation=vertical]/tabs:data-[state=active]:text-ink-strong group-data-[orientation=vertical]/tabs:data-[state=inactive]:text-ink-muted group-data-[orientation=vertical]/tabs:data-[state=inactive]:hover:text-ink",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
