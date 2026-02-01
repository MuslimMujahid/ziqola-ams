import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeftIcon, LockIcon, SaveIcon } from "lucide-react";
import { z } from "zod";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { DataTable } from "@/components/data-table/data-table";
import { isApiError } from "@/lib/services/api/api";
import { useAppForm } from "@/lib/utils/form";
import { useFeedbackDialog } from "@/lib/utils/use-feedback-dialog";
import {
  useSuspenseAssessmentScores,
  useUpsertAssessmentScores,
  type AssessmentScoreStudent,
} from "@/lib/services/api/assessment-scores";
import { TeacherAssessmentScoresSkeleton } from "./-components/teacher-assessment-scores-skeleton";

const scoreEntrySchema = z.object({
  scores: z.array(
    z.object({
      studentProfileId: z.string().uuid(),
      score: z
        .number()
        .min(0, "Nilai harus antara 0 dan 100")
        .max(100, "Nilai harus antara 0 dan 100")
        .nullable(),
    }),
  ),
});

type ScoreEntryInput = z.infer<typeof scoreEntrySchema>;

type AssessmentScoreRow = AssessmentScoreStudent;

export const Route = createFileRoute(
  "/_authed/dashboard/_topnavs/teacher/assessments/scores/$componentId",
)({
  staticData: { topnavId: "teacher" },
  component: function TeacherAssessmentScoresRoute() {
    const { componentId } = Route.useParams();

    return (
      <React.Suspense fallback={<TeacherAssessmentScoresSkeleton />}>
        <TeacherAssessmentScoresPage componentId={componentId} />
      </React.Suspense>
    );
  },
  errorComponent: ({ error }: { error: Error }) => (
    <div className="rounded-lg bg-surface-contrast p-6 text-sm text-error">
      Terjadi kesalahan: {error.message}
    </div>
  ),
  pendingComponent: () => <TeacherAssessmentScoresSkeleton />,
});

type TeacherAssessmentScoresPageProps = {
  componentId: string;
};

function TeacherAssessmentScoresPage({
  componentId,
}: TeacherAssessmentScoresPageProps) {
  const { showFeedback, FeedbackDialog } = useFeedbackDialog();

  const scoresQuery = useSuspenseAssessmentScores({ componentId });
  const upsertScores = useUpsertAssessmentScores();

  const students = scoresQuery.data?.students ?? [];
  const hasUnlockedScores = students.some((student) => !student.isLocked);

  const initialValues = React.useMemo<ScoreEntryInput>(
    () => ({
      scores: students.map((student) => ({
        studentProfileId: student.studentProfileId,
        score: student.score ?? null,
      })),
    }),
    [students],
  );

  const form = useAppForm({
    defaultValues: initialValues,
    validators: {
      onChange: scoreEntrySchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await upsertScores.mutateAsync({
          componentId,
          items: value.scores,
        });
        showFeedback({
          tone: "success",
          title: "Nilai disimpan",
          description: "Semua nilai berhasil diperbarui.",
        });
      } catch (error) {
        const description = isApiError(error)
          ? error.response?.data?.message
          : "Gagal menyimpan nilai. Coba lagi.";

        showFeedback({
          tone: "error",
          title: "Gagal menyimpan nilai",
          description: description ?? "Gagal menyimpan nilai. Coba lagi.",
        });
      }
    },
  });

  React.useEffect(() => {
    if (!scoresQuery.data) return;
    form.reset(initialValues);
  }, [form, initialValues, scoresQuery.data]);

  const columns = React.useMemo<ColumnDef<AssessmentScoreRow>[]>(
    () => [
      {
        accessorKey: "studentName",
        header: "Nama Siswa",
        cell: ({ row }) => (
          <div className="text-sm font-medium text-ink-strong">
            {row.original.studentName}
          </div>
        ),
      },
      {
        id: "score",
        header: "Nilai",
        cell: ({ row }) => {
          const rowIndex = row.index;
          const fieldName = `scores[${rowIndex}].score` as const;
          const isLocked = row.original.isLocked;
          const inputId = `score-${row.original.studentProfileId}`;

          return (
            <form.AppField name={fieldName}>
              {(field) => {
                const errorMessage = field.state.meta.errors?.[0]?.message;
                const value = field.state.value;
                const displayValue =
                  value === null || typeof value === "undefined"
                    ? ""
                    : String(value);

                return (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Input
                        id={inputId}
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={displayValue}
                        aria-label={`Nilai untuk ${row.original.studentName}`}
                        aria-invalid={Boolean(errorMessage)}
                        aria-describedby={
                          errorMessage ? `${inputId}-error` : undefined
                        }
                        disabled={isLocked}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          if (nextValue === "") {
                            field.handleChange(null);
                            return;
                          }

                          const parsed = Number(nextValue);
                          if (Number.isNaN(parsed)) return;
                          field.handleChange(parsed);
                        }}
                      />
                      {isLocked ? (
                        <LockIcon
                          className="h-4 w-4 text-ink-muted"
                          aria-hidden="true"
                        />
                      ) : null}
                    </div>
                    {errorMessage ? (
                      <p
                        id={`${inputId}-error`}
                        className="text-xs text-error"
                        role="alert"
                      >
                        {errorMessage}
                      </p>
                    ) : null}
                  </div>
                );
              }}
            </form.AppField>
          );
        },
      },
    ],
    [form],
  );

  const componentInfo = scoresQuery.data?.component;
  const classInfo = scoresQuery.data?.class;
  const subjectInfo = scoresQuery.data?.subject;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="rounded-full">
            <Link to="/dashboard/teacher/assessments">
              <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Kembali</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-ink-strong">
              Kelola Nilai
            </h1>
            <p className="text-sm text-ink-muted">
              Isi nilai untuk masing-masing siswa.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-surface-contrast p-5 max-w-md">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-ink-subtle">Kelas</p>
              <p className="text-sm font-semibold text-ink-strong">
                {classInfo?.name ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-subtle">
                Mata Pelajaran
              </p>
              <p className="text-sm font-semibold text-ink-strong">
                {subjectInfo?.name ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-subtle">
                Jumlah Siswa
              </p>
              <p className="text-sm font-semibold text-ink-strong">
                {students.length}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-subtle">
                Nama Penilaian
              </p>
              <p className="text-sm font-semibold text-ink-strong">
                {componentInfo?.name ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-subtle">
                Tipe Penilaian
              </p>
              <p className="text-sm font-semibold text-ink-strong">
                {componentInfo?.assessmentTypeLabel ?? "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-surface-contrast p-4">
        <DataTable
          data={students}
          columns={columns}
          searchColumnId="studentName"
          globalFilterPlaceholder="Cari siswa..."
          emptyMessage="Tidak ada siswa"
          enablePagination
          renderToolbar={() =>
            hasUnlockedScores ? (
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <Button
                    type="button"
                    className="ml-auto"
                    onClick={() => form.handleSubmit()}
                    disabled={!canSubmit || isSubmitting}
                  >
                    <SaveIcon className="h-4 w-4" aria-hidden="true" />
                    {isSubmitting ? "Menyimpan..." : "Simpan nilai"}
                  </Button>
                )}
              </form.Subscribe>
            ) : null
          }
        />
      </div>

      <FeedbackDialog />
    </div>
  );
}
