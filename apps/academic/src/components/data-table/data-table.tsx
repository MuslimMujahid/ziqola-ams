import React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type Table as TableInstance,
  type TableOptions,
  type TableState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TablePagination,
  TableRow,
  TableScroll,
  TableToolbar,
} from "@repo/ui/table";

import { cn } from "@/lib/utils/cn";

type DataTableSharedProps<TData> = {
  className?: string;
  tableClassName?: string;
  toolbarClassName?: string;
  paginationClassName?: string;
  caption?: string;
  emptyMessage?: string;
  showToolbar?: boolean;
  showPagination?: boolean;
  enableSorting?: boolean;
  enablePagination?: boolean;
  enableColumnFilters?: boolean;
  enableGlobalFilter?: boolean;
  enableRowSelection?: boolean;
  searchColumnId?: string;
  globalFilterPlaceholder?: string;
  pageSizeOptions?: number[];
  renderToolbar?: (table: TableInstance<TData>) => React.ReactNode;
  renderEmptyState?: (table: TableInstance<TData>) => React.ReactNode;
};

type DataTableStateHandlers = {
  onSortingChange?: OnChangeFn<SortingState>;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  onGlobalFilterChange?: OnChangeFn<string>;
  onPaginationChange?: OnChangeFn<PaginationState>;
};

type DataTableControlledState = {
  state?: Partial<TableState>;
  initialState?: Partial<TableState>;
};

type DataTableViewProps<TData> = DataTableSharedProps<TData> & {
  table: TableInstance<TData>;
};

type DataTableOptions<TData> = Omit<
  Partial<TableOptions<TData>>,
  | "columns"
  | "data"
  | "state"
  | "getCoreRowModel"
  | "getFilteredRowModel"
  | "getSortedRowModel"
  | "getPaginationRowModel"
  | "onSortingChange"
  | "onColumnFiltersChange"
  | "onColumnVisibilityChange"
  | "onRowSelectionChange"
  | "onGlobalFilterChange"
  | "onPaginationChange"
>;

type DataTableProps<TData, TValue> = DataTableSharedProps<TData> &
  DataTableStateHandlers &
  DataTableControlledState & {
    data: TData[];
    columns: ColumnDef<TData, TValue>[];
    tableOptions?: DataTableOptions<TData>;
  };

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];

function DataTableView<TData>({
  table,
  className,
  tableClassName,
  toolbarClassName,
  paginationClassName,
  caption,
  emptyMessage = "No results.",
  showToolbar = true,
  showPagination = true,
  enableSorting = true,
  enablePagination = true,
  enableColumnFilters = true,
  enableGlobalFilter = false,
  enableRowSelection = false,
  searchColumnId,
  globalFilterPlaceholder = "Search...",
  pageSizeOptions,
  renderToolbar,
  renderEmptyState,
}: DataTableViewProps<TData>) {
  const resolvedPageSizeOptions =
    pageSizeOptions && pageSizeOptions.length > 0
      ? pageSizeOptions
      : DEFAULT_PAGE_SIZE_OPTIONS;

  const searchColumn = searchColumnId
    ? table.getColumn(searchColumnId)
    : undefined;
  const showSearchInput = Boolean(
    (searchColumn && enableColumnFilters) || enableGlobalFilter,
  );

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {showToolbar && (showSearchInput || renderToolbar) && (
        <TableToolbar className={toolbarClassName}>
          {showSearchInput ? (
            <div className="w-full md:max-w-sm">
              <Input
                value={
                  searchColumn
                    ? String(searchColumn.getFilterValue() ?? "")
                    : String(table.getState().globalFilter ?? "")
                }
                onChange={(event) => {
                  const value = event.target.value;
                  if (searchColumn) {
                    searchColumn.setFilterValue(value);
                  } else {
                    table.setGlobalFilter(value);
                  }
                }}
                placeholder={globalFilterPlaceholder}
                aria-label={globalFilterPlaceholder}
              />
            </div>
          ) : (
            <span className="sr-only">Toolbar</span>
          )}
          {renderToolbar?.(table)}
        </TableToolbar>
      )}

      <TableContainer>
        <TableScroll>
          <Table className={tableClassName}>
            {caption ? <TableCaption>{caption}</TableCaption> : null}
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-slate-200">
                  {headerGroup.headers.map((header) => {
                    if (header.isPlaceholder) {
                      return <TableHead key={header.id} />;
                    }

                    const canSort = enableSorting && header.column.getCanSort();
                    const sortDirection = header.column.getIsSorted();
                    const SortIcon = !canSort
                      ? null
                      : sortDirection === "asc"
                        ? ArrowUpIcon
                        : sortDirection === "desc"
                          ? ArrowDownIcon
                          : ChevronsUpDownIcon;

                    return (
                      <TableHead key={header.id}>
                        {canSort ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={header.column.getToggleSortingHandler()}
                            className="-ml-2 h-8 gap-1 px-2 text-slate-700"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {SortIcon ? (
                              <SortIcon className="h-3.5 w-3.5" />
                            ) : null}
                          </Button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
                        )}
                      </TableHead>
                    );
                  })}
                </tr>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={
                      enableRowSelection && row.getIsSelected()
                        ? "selected"
                        : undefined
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={table.getAllLeafColumns().length}
                    className="px-3 py-8 text-center text-sm text-slate-500"
                  >
                    {renderEmptyState ? renderEmptyState(table) : emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableScroll>
      </TableContainer>

      {showPagination && enablePagination ? (
        <TablePagination className={paginationClassName}>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Baris per halaman</span>
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger size="sm" className="w-22">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {resolvedPageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>
              Halaman {table.getState().pagination.pageIndex + 1} dari{" "}
              {Math.max(table.getPageCount(), 1)}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Previous</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Next</span>
              </Button>
            </div>
          </div>
        </TablePagination>
      ) : null}

      {enableRowSelection ? (
        <div className="text-xs text-slate-500">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
      ) : null}
    </div>
  );
}

function DataTable<TData, TValue>({
  data,
  columns,
  tableOptions,
  enableSorting = true,
  enablePagination = true,
  enableColumnFilters = true,
  enableGlobalFilter = false,
  enableRowSelection = false,
  state,
  initialState,
  onSortingChange,
  onColumnFiltersChange,
  onColumnVisibilityChange,
  onRowSelectionChange,
  onGlobalFilterChange,
  onPaginationChange,
  ...viewProps
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(
    initialState?.sorting ?? [],
  );
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    initialState?.columnFilters ?? [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialState?.columnVisibility ?? {});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    initialState?.rowSelection ?? {},
  );
  const [globalFilter, setGlobalFilter] = React.useState<string>(
    (initialState?.globalFilter as string | undefined) ?? "",
  );
  const [pagination, setPagination] = React.useState<PaginationState>(
    initialState?.pagination ?? { pageIndex: 0, pageSize: 10 },
  );

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    if (state?.sorting === undefined) {
      setSorting(updater);
    }
    onSortingChange?.(updater);
  };

  const handleColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (
    updater,
  ) => {
    if (state?.columnFilters === undefined) {
      setColumnFilters(updater);
    }
    onColumnFiltersChange?.(updater);
  };

  const handleColumnVisibilityChange: OnChangeFn<VisibilityState> = (
    updater,
  ) => {
    if (state?.columnVisibility === undefined) {
      setColumnVisibility(updater);
    }
    onColumnVisibilityChange?.(updater);
  };

  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (updater) => {
    if (state?.rowSelection === undefined) {
      setRowSelection(updater);
    }
    onRowSelectionChange?.(updater);
  };

  const handleGlobalFilterChange: OnChangeFn<string> = (updater) => {
    if (state?.globalFilter === undefined) {
      setGlobalFilter(updater);
    }
    onGlobalFilterChange?.(updater);
  };

  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    if (state?.pagination === undefined) {
      setPagination(updater);
    }
    onPaginationChange?.(updater);
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: state?.sorting ?? sorting,
      columnFilters: state?.columnFilters ?? columnFilters,
      columnVisibility: state?.columnVisibility ?? columnVisibility,
      rowSelection: state?.rowSelection ?? rowSelection,
      globalFilter: state?.globalFilter ?? globalFilter,
      pagination: state?.pagination ?? pagination,
    },
    enableSorting,
    enableColumnFilters,
    enableRowSelection,
    enableGlobalFilter,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onRowSelectionChange: handleRowSelectionChange,
    onGlobalFilterChange: handleGlobalFilterChange,
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: enablePagination
      ? getPaginationRowModel()
      : undefined,
    ...tableOptions,
  });

  return (
    <DataTableView
      {...viewProps}
      table={table}
      enableSorting={enableSorting}
      enablePagination={enablePagination}
      enableColumnFilters={enableColumnFilters}
      enableGlobalFilter={enableGlobalFilter}
      enableRowSelection={enableRowSelection}
    />
  );
}

export { DataTable, DataTableView };
export type { DataTableProps, DataTableViewProps };
