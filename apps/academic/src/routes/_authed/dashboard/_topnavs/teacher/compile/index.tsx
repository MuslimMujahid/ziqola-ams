import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckIcon, XIcon } from "lucide-react";
import { Button } from "@repo/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";

import {
  useDecideHomeroomAssessmentRecapChange,
  useHomeroomRecapDetail,
  useHomeroomRecapOptions,
} from "@/lib/services/api/assessment-recap";
import { useConfirm } from "@/lib/utils/use-confirm";
import { useFeedbackDialog } from "@/lib/utils/use-feedback-dialog";
import { HomeroomRecapEmptyState } from "./-components/homeroom-recap-empty-state";
import { HomeroomRecapSkeleton } from "./-components/homeroom-recap-skeleton";
import { RecapSummaryCards } from "../recap/-components/recap-summary-cards";
import {
  RecapTable,
  type RecapTableRow,
} from "../recap/-components/recap-table";

const SUBMISSION_STATUS_TONE_MAP = {
  submitted: "bg-info/10 text-info",
  resubmitted: "bg-info/10 text-info",
  returned: "bg-warning/10 text-warning",
} as const;

type SubmissionStatusTone = keyof typeof SUBMISSION_STATUS_TONE_MAP;

export const Route = createFileRoute(
  "/_authed/dashboard/_topnavs/teacher/compile/",
)({
  staticData: { topnavId: "teacher" },
  component: function HomeroomRecapRoute() {
    return <HomeroomRecapPage />;
  },
  errorComponent: ({ error }: { error: Error }) => (
    <div className="rounded-lg bg-surface-contrast p-6 text-sm text-error">
      Gagal memuat rekap wali kelas: {error.message}
    </div>
  ),
});

type StatusPillProps = {
  label: string;
  tone: SubmissionStatusTone;
};

function StatusPill({ label, tone }: StatusPillProps) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${SUBMISSION_STATUS_TONE_MAP[tone]}`}
    >
      {label}
    </span>
  );
}

function HomeroomRecapPage() {
  const optionsQuery = useHomeroomRecapOptions();
  const decideMutation = useDecideHomeroomAssessmentRecapChange();
  const { confirm, ConfirmDialog } = useConfirm();
  const { showFeedback, FeedbackDialog } = useFeedbackDialog();
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = React.useState<string>("");
  const [selectedSubmissionId, setSelectedSubmissionId] =
    React.useState<string>("");

  const classes = optionsQuery.data?.classes ?? [];
  const submissions = optionsQuery.data?.submissions ?? [];
  const isLoading = optionsQuery.isLoading && !optionsQuery.data;

  const filteredSubmissions = React.useMemo(
    () => submissions.filter((item) => item.classId === selectedClassId),
    [selectedClassId, submissions],
  );

  React.useEffect(() => {
    if (!classes.length) return;

    if (!selectedClassId) {
      setSelectedClassId(classes[0].id);
      return;
    }

    if (selectedClassId && filteredSubmissions.length > 0) {
      if (selectedSubmissionId) return;

      const latestSubmission = [...filteredSubmissions].sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      )[0];

      if (latestSubmission) {
        setSelectedSubmissionId(latestSubmission.submissionId);
      }
    }
  }, [classes, filteredSubmissions, selectedClassId, selectedSubmissionId]);

  const detailQuery = useHomeroomRecapDetail(
    { submissionId: selectedSubmissionId },
    { enabled: Boolean(selectedSubmissionId) },
  );

  const detail = detailQuery.data ?? null;
  const detailLoading = detailQuery.isLoading && !detailQuery.data;
  const changeRequest = detail?.changeRequest ?? null;
  const canDecide =
    changeRequest?.status === "pending" && changeRequest.isActive;

  const handleDecision = React.useCallback(
    async (requestId: string, decision: "approved" | "rejected") => {
      if (!requestId) return;

      const isApproved = decision === "approved";
      const isConfirmed = await confirm({
        title: isApproved
          ? "Setujui perubahan nilai?"
          : "Tolak perubahan nilai?",
        description: isApproved
          ? "Permintaan akan diterima dan perubahan nilai dibuka kembali."
          : "Permintaan akan ditolak dan nilai tetap terkunci.",
        confirmText: isApproved ? "Setujui" : "Tolak",
        cancelText: "Batal",
        confirmVariant: isApproved ? "default" : "destructive",
      });

      if (!isConfirmed) return;

      try {
        setProcessingId(requestId);
        await decideMutation.mutateAsync({
          requestId,
          decision,
        });

        showFeedback({
          tone: "success",
          title: isApproved ? "Perubahan disetujui" : "Perubahan ditolak",
          description: isApproved
            ? "Nilai telah dibuka kembali untuk diperbarui."
            : "Permintaan perubahan nilai ditolak.",
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Gagal memperbarui keputusan";
        showFeedback({
          tone: "error",
          title: "Aksi gagal",
          description: message,
        });
      } finally {
        setProcessingId(null);
      }
    },
    [confirm, decideMutation, showFeedback],
  );

  const handleApprove = React.useCallback(
    async (requestId: string) => {
      await handleDecision(requestId, "approved");
    },
    [handleDecision],
  );

  const handleReject = React.useCallback(
    async (requestId: string) => {
      await handleDecision(requestId, "rejected");
    },
    [handleDecision],
  );

  const handleClassChange = React.useCallback((value: string) => {
    setSelectedClassId(value);
    setSelectedSubmissionId("");
  }, []);

  const handleSubmissionChange = React.useCallback((value: string) => {
    setSelectedSubmissionId(value);
  }, []);

  const tableRows = React.useMemo<RecapTableRow[]>(
    () =>
      (detail?.students ?? []).map((student) => ({
        id: student.id,
        studentName: student.studentName,
        assessmentTypeAverages: (detail?.assessmentTypes ?? []).reduce(
          (accumulator, type) => {
            const scores = (student.componentScores ?? [])
              .filter((score) => score.assessmentTypeId === type.id)
              .map((score) => score.score)
              .filter((score): score is number => score !== null);

            if (scores.length === 0) {
              accumulator[type.id] = null;
              return accumulator;
            }

            const total = scores.reduce((sum, score) => sum + score, 0);
            accumulator[type.id] = total / scores.length;
            return accumulator;
          },
          {} as Record<string, number | null>,
        ),
        finalScore: student.finalScore,
        classKkm: detail?.classKkm ?? 0,
      })),
    [detail],
  );

  const submissionStatusLabel =
    detail?.submission.status === "returned"
      ? "Menunggu perubahan"
      : "Terkirim";

  const submissionStatusTone: SubmissionStatusTone =
    detail?.submission.status === "returned" ? "returned" : "submitted";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-strong">
          Rekapan Nilai Wali Kelas
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Tinjau rekap nilai yang dikirim guru dan putuskan permintaan
          perubahan.
        </p>
      </div>

      {optionsQuery.isError ? (
        <div className="rounded-lg bg-surface-contrast p-6 text-sm text-error">
          Gagal memuat rekap:{" "}
          {optionsQuery.error instanceof Error
            ? optionsQuery.error.message
            : "Terjadi kesalahan"}
        </div>
      ) : isLoading ? (
        <HomeroomRecapSkeleton />
      ) : submissions.length === 0 ? (
        <HomeroomRecapEmptyState />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-muted">
                Kelas
              </label>
              <Select value={selectedClassId} onValueChange={handleClassChange}>
                <SelectTrigger className="w-full bg-surface-contrast">
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-muted">
                Mapel - Guru
              </label>
              <Select
                value={selectedSubmissionId}
                onValueChange={handleSubmissionChange}
                disabled={!selectedClassId}
              >
                <SelectTrigger className="w-full bg-surface-contrast">
                  <SelectValue placeholder="Pilih mapel dan guru" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubmissions.map((item) => (
                    <SelectItem
                      key={item.submissionId}
                      value={item.submissionId}
                    >
                      {item.subjectName} - {item.teacherName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {detailQuery.isError ? (
            <div className="rounded-lg bg-surface-contrast p-6 text-sm text-error">
              Gagal memuat detail rekap:{" "}
              {detailQuery.error instanceof Error
                ? detailQuery.error.message
                : "Terjadi kesalahan"}
            </div>
          ) : detailLoading ? (
            <HomeroomRecapSkeleton />
          ) : detail ? (
            <div className="space-y-6 mt-10">
              <div className="flex gap-2 items-center">
                <p className="text-sm">Status Nilai: </p>
                <StatusPill
                  label={submissionStatusLabel}
                  tone={submissionStatusTone}
                />
              </div>

              {canDecide ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-warning/10 p-4 rounded-md">
                  <div className="text-sm text-warning">
                    Menerima pengajuan perubahan nilai dari Guru mata pelajaran
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleReject(changeRequest.id)}
                      disabled={!canDecide || processingId === changeRequest.id}
                      className="gap-2 bg-error text-white hover:bg-error/90"
                      aria-label={`Tolak permintaan perubahan nilai untuk ${detail.className} ${detail.subjectName}`}
                    >
                      <XIcon className="h-4 w-4" aria-hidden="true" />
                      Tolak
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleApprove(changeRequest.id)}
                      disabled={!canDecide || processingId === changeRequest.id}
                      className="gap-2 bg-success text-white hover:bg-success/90"
                      aria-label={`Setujui permintaan perubahan nilai untuk ${detail.className} ${detail.subjectName}`}
                    >
                      <CheckIcon className="h-4 w-4" aria-hidden="true" />
                      Setujui
                    </Button>
                  </div>
                </div>
              ) : null}

              <RecapSummaryCards
                average={detail.summary.average}
                median={detail.summary.median}
                passRate={detail.summary.passRate}
                remedialCount={detail.summary.remedialCount}
                totalStudents={detail.summary.totalStudents}
              />

              <RecapTable
                rows={tableRows}
                assessmentTypes={detail.assessmentTypes}
                header={
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-ink-strong">
                      KKM: {detail.classKkm}
                    </div>
                    <div className="text-sm text-ink-muted">
                      {detail.summary.totalStudents} siswa
                    </div>
                  </div>
                }
              />
            </div>
          ) : (
            <HomeroomRecapEmptyState />
          )}
        </div>
      )}

      <ConfirmDialog />
      <FeedbackDialog />
    </div>
  );
}
