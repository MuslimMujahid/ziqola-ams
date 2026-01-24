import * as React from "react";

import { cn } from "@/lib/utils";

type TableContainerProps = React.ComponentProps<"div">;

type TableScrollProps = React.ComponentProps<"div">;

type TableProps = React.ComponentProps<"table">;

type TableHeaderProps = React.ComponentProps<"thead">;

type TableBodyProps = React.ComponentProps<"tbody">;

type TableFooterProps = React.ComponentProps<"tfoot">;

type TableRowProps = React.ComponentProps<"tr">;

type TableHeadProps = React.ComponentProps<"th">;

type TableCellProps = React.ComponentProps<"td">;

type TableCaptionProps = React.ComponentProps<"caption">;

type TableToolbarProps = React.ComponentProps<"div">;

type TablePaginationProps = React.ComponentProps<"div">;

function TableContainer({ className, ...props }: TableContainerProps) {
  return (
    <div
      data-slot="table-container"
      className={cn(
        "overflow-hidden rounded-lg border border-slate-200 bg-white",
        className,
      )}
      {...props}
    />
  );
}

function TableScroll({ className, ...props }: TableScrollProps) {
  return (
    <div
      data-slot="table-scroll"
      className={cn("overflow-x-auto", className)}
      {...props}
    />
  );
}

function Table({ className, ...props }: TableProps) {
  return (
    <table
      data-slot="table"
      className={cn("w-full border-collapse text-sm text-slate-700", className)}
      {...props}
    />
  );
}

function TableHeader({ className, ...props }: TableHeaderProps) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-slate-50 text-slate-700", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: TableBodyProps) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("text-slate-800", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: TableFooterProps) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("bg-slate-50 text-slate-700", className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: TableRowProps) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-slate-100 transition-colors hover:bg-slate-50 data-[state=selected]:border-blue-200 data-[state=selected]:bg-blue-50",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: TableHeadProps) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "px-3 py-2 text-left font-medium text-slate-700",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: TableCellProps) {
  return (
    <td
      data-slot="table-cell"
      className={cn("px-3 py-3 align-middle text-slate-800", className)}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: TableCaptionProps) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("px-3 pb-3 text-left text-sm text-slate-500", className)}
      {...props}
    />
  );
}

function TableToolbar({ className, ...props }: TableToolbarProps) {
  return (
    <div
      data-slot="table-toolbar"
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between",
        className,
      )}
      {...props}
    />
  );
}

function TablePagination({ className, ...props }: TablePaginationProps) {
  return (
    <div
      data-slot="table-pagination"
      className={cn(
        "flex flex-col gap-3 rounded-lg bg-white md:flex-row md:items-center md:justify-between",
        className,
      )}
      {...props}
    />
  );
}

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableHeader,
  TablePagination,
  TableRow,
  TableScroll,
  TableToolbar,
};
