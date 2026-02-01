import React from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { cn } from "@/lib/utils/cn";
import type { AssessmentRecapAssessmentType } from "@/lib/services/api/assessment-recap";

type RecapTableRow = {
  id: string;
  studentName: string;
  assessmentTypeAverages: Record<string, number | null>;
  finalScore: number;
  classKkm: number;
};

type RecapTableProps = {
  rows: RecapTableRow[];
  assessmentTypes: AssessmentRecapAssessmentType[];
  header?: React.ReactNode;
};

export function RecapTable({ rows, assessmentTypes, header }: RecapTableProps) {
  const columns = React.useMemo<ColumnDef<RecapTableRow>[]>(() => {
    const typeColumns = assessmentTypes.map<ColumnDef<RecapTableRow>>(
      (type) => ({
        id: `assessment-type-${type.id}`,
        header: type.label,
        accessorFn: (row) => row.assessmentTypeAverages[type.id] ?? null,
        cell: ({ getValue }) => {
          const value = getValue<number | null>();
          if (value === null || Number.isNaN(value)) {
            return <span className="text-sm text-ink-muted">-</span>;
          }
          return (
            <span className="text-sm font-medium text-ink-strong">
              {value.toFixed(1)}
            </span>
          );
        },
      }),
    );

    return [
      {
        accessorKey: "studentName",
        header: "Siswa",
        cell: ({ row }) => (
          <div className="text-sm font-medium text-ink-strong">
            {row.original.studentName}
          </div>
        ),
      },
      ...typeColumns,
      {
        accessorKey: "finalScore",
        header: "Nilai akhir",
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-ink-strong">
            {Number.isFinite(row.original.finalScore)
              ? row.original.finalScore.toFixed(1)
              : "-"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const isPassed = row.original.finalScore >= row.original.classKkm;
          return (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                isPassed
                  ? "bg-success/10 text-success"
                  : "bg-warning/10 text-warning",
              )}
            >
              {isPassed ? "Tercapai" : "Remedial"}
            </span>
          );
        },
      },
    ];
  }, [assessmentTypes]);

  return (
    <div className="rounded-lg bg-surface-contrast p-4">
      {header ? <div className="mb-4 flex flex-col gap-3">{header}</div> : null}
      <DataTable
        data={rows}
        columns={columns}
        emptyMessage="Belum ada data siswa"
        enablePagination
        enableSorting
        showToolbar={false}
      />
    </div>
  );
}

export type { RecapTableRow };
