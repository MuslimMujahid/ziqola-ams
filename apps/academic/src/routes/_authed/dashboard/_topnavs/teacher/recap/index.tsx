import React from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { z } from "zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CircleXIcon, LinkIcon, LockIcon, PencilIcon } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTrigger,
} from "@repo/ui/popover";

import {
  useRequestTeacherAssessmentRecapChange,
  useSubmitTeacherAssessmentRecap,
  useTeacherAssessmentRecap,
  useUpdateTeacherAssessmentRecapKkm,
} from "@/lib/services/api/assessment-recap";
import { cn } from "@/lib/utils/cn";
import { useConfirm } from "@/lib/utils/use-confirm";
import { useFeedbackDialog } from "@/lib/utils/use-feedback-dialog";
import { useUrlSearchState } from "@/lib/utils/use-url-state";
import { RecapEmptyState } from "./-components/recap-empty-state";
import { RecapFilters } from "./-components/recap-filters";
import { RecapKkmDialog } from "./-components/recap-kkm-dialog";
import { RecapInsights } from "./-components/recap-insights";
import { RecapSkeleton } from "./-components/recap-skeleton";
import { RecapSummaryCards } from "./-components/recap-summary-cards";
import { RecapTable, type RecapTableRow } from "./-components/recap-table";

const recapSearchSchema = z.object({
  periodId: z.string().optional(),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  search: z.string().optional(),
});

type RecapSearch = z.infer<typeof recapSearchSchema>;

export const Route = createFileRoute(
  "/_authed/dashboard/_topnavs/teacher/recap/",
)({
  staticData: { topnavId: "teacher" },
  validateSearch: (search) => recapSearchSchema.parse(search),
  component: function TeacherAssessmentRecapRoute() {
    return <TeacherAssessmentRecapPage />;
  },
  errorComponent: ({ error }: { error: Error }) => (
    <div className="rounded-lg bg-surface-contrast p-6 text-sm text-error">
      Gagal memuat data rekap: {error.message}
    </div>
  ),
});

type DistributionBucket = {
  label: string;
  count: number;
  percentage: number;
};

function TeacherAssessmentRecapPage() {
  const searchState = Route.useSearch() as RecapSearch;
  const { setSearch } = useUrlSearchState<RecapSearch>();
  const selectedPeriodId = searchState.periodId ?? "";
  const selectedClassId = searchState.classId ?? "";
  const selectedSubjectId = searchState.subjectId ?? "";
  const searchValue = searchState.search ?? "";

  const submitMutation = useSubmitTeacherAssessmentRecap();
  const requestChangeMutation = useRequestTeacherAssessmentRecapChange();
  const updateKkmMutation = useUpdateTeacherAssessmentRecapKkm();
  const { confirm, ConfirmDialog } = useConfirm();
  const { showFeedback, FeedbackDialog } = useFeedbackDialog();
  const [isKkmDialogOpen, setIsKkmDialogOpen] = React.useState(false);

  const recapQuery = useTeacherAssessmentRecap(
    {
      periodId: selectedPeriodId || undefined,
      classId: selectedClassId || undefined,
      subjectId: selectedSubjectId || undefined,
    },
    {
      placeholderData: keepPreviousData,
    },
  );

  const recap = recapQuery.data ?? {
    activePeriodId: null,
    periods: [],
    classes: [],
    subjects: [],
    assessmentTypes: [],
    classSubjects: [],
    students: [],
    summary: {
      average: 0,
      median: 0,
      passRate: 0,
      remedialCount: 0,
      totalStudents: 0,
      maxScore: 0,
      minScore: 0,
    },
    readiness: null,
    submission: null,
    changeRequest: null,
  };

  const {
    activePeriodId,
    periods,
    classes,
    subjects,
    assessmentTypes,
    classSubjects,
    students,
    readiness,
    submission,
  } = recap;

  React.useEffect(() => {
    if (!selectedPeriodId) {
      const activePeriod = activePeriodId
        ? periods.find((period) => period.id === activePeriodId)
        : null;
      if (activePeriod) {
        setSearch({ periodId: activePeriod.id });
      } else if (periods.length > 0) {
        setSearch({ periodId: periods[0].id });
      }
    }

    const targetPeriodId = selectedPeriodId || activePeriodId || periods[0]?.id;
    const defaultStudent = targetPeriodId
      ? students.find((student) => student.periodId === targetPeriodId)
      : students[0];

    if (!selectedClassId && defaultStudent) {
      setSearch({ classId: defaultStudent.classId });
    } else if (!selectedClassId && classes.length > 0) {
      setSearch({ classId: classes[0].id });
    }

    if (!selectedSubjectId && defaultStudent) {
      setSearch({ subjectId: defaultStudent.subjectId });
    } else if (!selectedSubjectId && subjects.length > 0) {
      setSearch({ subjectId: subjects[0].id });
    }
  }, [
    activePeriodId,
    classes,
    periods,
    selectedClassId,
    selectedPeriodId,
    selectedSubjectId,
    setSearch,
    students,
    subjects,
  ]);

  const classSubjectKkmMap = React.useMemo(
    () =>
      new Map(
        classSubjects.map((item) => [
          `${item.classId}:${item.subjectId}`,
          item.kkm,
        ]),
      ),
    [classSubjects],
  );

  const selectedClassSubjectKey = React.useMemo(() => {
    if (!selectedClassId || !selectedSubjectId) return null;
    return `${selectedClassId}:${selectedSubjectId}`;
  }, [selectedClassId, selectedSubjectId]);

  const selectedClassSubject = React.useMemo(() => {
    if (!selectedClassSubjectKey) return null;
    return (
      classSubjects.find(
        (item) =>
          `${item.classId}:${item.subjectId}` === selectedClassSubjectKey,
      ) ?? null
    );
  }, [classSubjects, selectedClassSubjectKey]);

  const selectedClassKkm = React.useMemo(() => {
    if (!selectedClassSubjectKey) return null;
    return classSubjectKkmMap.get(selectedClassSubjectKey) ?? null;
  }, [classSubjectKkmMap, selectedClassSubjectKey]);

  const effectiveKkm = React.useMemo(() => {
    return selectedClassKkm ?? 0;
  }, [selectedClassKkm]);

  const filteredStudents = React.useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return students.filter((student) => {
      if (selectedPeriodId && student.periodId !== selectedPeriodId) {
        return false;
      }
      if (selectedClassId && student.classId !== selectedClassId) {
        return false;
      }
      if (selectedSubjectId && student.subjectId !== selectedSubjectId) {
        return false;
      }
      if (normalizedSearch) {
        const matchesName = student.studentName
          .toLowerCase()
          .includes(normalizedSearch);
        if (!matchesName) return false;
      }
      return true;
    });
  }, [
    searchValue,
    selectedClassId,
    selectedPeriodId,
    selectedSubjectId,
    students,
  ]);
  const handlePeriodChange = React.useCallback(
    (value: string) => {
      setSearch({ periodId: value });
    },
    [setSearch],
  );

  const handleClassChange = React.useCallback(
    (value: string) => {
      setSearch({ classId: value });
    },
    [setSearch],
  );

  const handleSubjectChange = React.useCallback(
    (value: string) => {
      setSearch({ subjectId: value });
    },
    [setSearch],
  );

  const summary = React.useMemo(() => {
    if (filteredStudents.length === 0) {
      return {
        average: 0,
        median: 0,
        passRate: 0,
        remedialCount: 0,
        totalStudents: 0,
      };
    }

    const scores = filteredStudents.map((student) => student.finalScore);
    const total = scores.reduce((sum, score) => sum + score, 0);
    const average = total / scores.length;
    const sorted = [...scores].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 === 0
        ? (sorted[middle - 1] + sorted[middle]) / 2
        : sorted[middle];

    const passCount = filteredStudents.filter((student) => {
      const kkm = selectedClassSubjectKey
        ? effectiveKkm
        : (classSubjectKkmMap.get(`${student.classId}:${student.subjectId}`) ??
          0);
      return student.finalScore >= kkm;
    }).length;

    const remedialCount = filteredStudents.length - passCount;
    const passRate = (passCount / filteredStudents.length) * 100;

    return {
      average,
      median,
      passRate,
      remedialCount,
      totalStudents: filteredStudents.length,
    };
  }, [
    classSubjectKkmMap,
    effectiveKkm,
    filteredStudents,
    selectedClassSubjectKey,
  ]);

  const distribution = React.useMemo<DistributionBucket[]>(() => {
    const buckets = [
      { label: "0-59", min: 0, max: 59 },
      { label: "60-69", min: 60, max: 69 },
      { label: "70-79", min: 70, max: 79 },
      { label: "80-89", min: 80, max: 89 },
      { label: "90-100", min: 90, max: 100 },
    ];

    if (summary.totalStudents === 0) {
      return buckets.map((bucket) => ({
        label: bucket.label,
        count: 0,
        percentage: 0,
      }));
    }

    return buckets.map((bucket) => {
      const count = filteredStudents.filter(
        (student) =>
          student.finalScore >= bucket.min && student.finalScore <= bucket.max,
      ).length;
      const percentage = (count / summary.totalStudents) * 100;
      return { label: bucket.label, count, percentage };
    });
  }, [filteredStudents, summary.totalStudents]);

  const tableRows = React.useMemo<RecapTableRow[]>(
    () =>
      filteredStudents.map((student) => ({
        id: student.id,
        studentName: student.studentName,
        assessmentTypeAverages: assessmentTypes.reduce(
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
        classKkm: selectedClassSubjectKey
          ? effectiveKkm
          : (classSubjectKkmMap.get(
              `${student.classId}:${student.subjectId}`,
            ) ?? 0),
      })),
    [
      assessmentTypes,
      classSubjectKkmMap,
      effectiveKkm,
      filteredStudents,
      selectedClassSubjectKey,
    ],
  );

  const hasData = filteredStudents.length > 0;
  const isInitialLoading = recapQuery.isLoading && !recapQuery.data;
  const errorMessage =
    recapQuery.error instanceof Error
      ? recapQuery.error.message
      : "Gagal memuat data rekap";

  const selectedClass = React.useMemo(
    () => classes.find((item) => item.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  );

  const selectedSubject = React.useMemo(
    () => subjects.find((item) => item.id === selectedSubjectId) ?? null,
    [subjects, selectedSubjectId],
  );

  const hasSelection = Boolean(
    selectedPeriodId && selectedClassId && selectedSubjectId,
  );

  const fallbackReadiness = {
    missingScoreCount: 0,
    missingStudentCount: 0,
    weightTotal: 0,
    isWeightValid: false,
    isReady: false,
  };

  const effectiveReadiness = readiness ?? fallbackReadiness;
  const submissionStatus = submission?.status ?? "draft";
  const isSubmitted =
    submissionStatus === "submitted" || submissionStatus === "resubmitted";
  const hasPendingChangeRequest = recap.changeRequest?.status === "pending";
  const canSubmit = hasSelection && effectiveReadiness.isReady && !isSubmitted;
  const submitLabel = isSubmitted
    ? "Terkirim ke Wali Kelas"
    : "Kirim ke Wali Kelas";

  const assessmentFilterSearch = React.useMemo(
    () => ({
      subjectId: selectedSubjectId || undefined,
      classId: selectedClassId || undefined,
    }),
    [selectedClassId, selectedSubjectId],
  );

  const readinessItems = React.useMemo(() => {
    const items: Array<{
      label: string;
      tone: string;
      href?: string;
      search?: { classId?: string; subjectId?: string };
    }> = [];

    if (!hasSelection) {
      items.push({
        label: "Filter",
        tone: "text-warning",
      });
    }

    if (hasSelection && effectiveReadiness.missingScoreCount > 0) {
      items.push({
        label: "Nilai belum lengkap",
        tone: "text-error",
        href: "/dashboard/teacher/assessments",
        search: assessmentFilterSearch,
      });
    }

    if (hasSelection && !effectiveReadiness.isWeightValid) {
      items.push({
        label: "Bobot penilaian tidak valid",
        tone: "text-error",
        href: "/dashboard/teacher/assessments",
        search: assessmentFilterSearch,
      });
    }

    return items;
  }, [
    assessmentFilterSearch,
    effectiveReadiness.isWeightValid,
    effectiveReadiness.missingScoreCount,
    hasSelection,
  ]);

  const invalidItemCount = readinessItems.length;
  const showReadinessPopover = invalidItemCount > 0;

  const handleSubmitRecap = React.useCallback(async () => {
    if (!hasSelection || !selectedClass || !selectedSubject) {
      showFeedback({
        tone: "warning",
        title: "Lengkapi filter",
        description: "Pilih periode, kelas, dan mata pelajaran terlebih dulu.",
      });
      return;
    }

    if (!effectiveReadiness.isReady) {
      showFeedback({
        tone: "warning",
        title: "Rekap belum siap",
        description:
          "Lengkapi nilai dan bobot penilaian sebelum mengirim ke wali kelas.",
      });
      return;
    }

    const isConfirmed = await confirm({
      title: "Kirim rekap nilai?",
      description: `Rekap ${selectedSubject.name} untuk ${selectedClass.name} akan dikirim ke wali kelas dan nilai akan terkunci. Anda akan memerlukan persetujuan wali kelas untuk melakukan perubahan nilai lebih lanjut.`,
      confirmText: "Kirim",
      cancelText: "Batal",
      confirmVariant: "destructive",
    });

    if (!isConfirmed) return;

    try {
      await submitMutation.mutateAsync({
        periodId: selectedPeriodId,
        classId: selectedClassId,
        subjectId: selectedSubjectId,
      });

      showFeedback({
        tone: "success",
        title: "Rekap terkirim",
        description:
          "Rekap nilai berhasil dikirim ke wali kelas. Nilai sekarang terkunci.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal mengirim rekap nilai";
      showFeedback({
        tone: "error",
        title: "Pengiriman gagal",
        description: message,
      });
    }
  }, [
    confirm,
    effectiveReadiness.isReady,
    hasSelection,
    selectedClass,
    selectedClassId,
    selectedPeriodId,
    selectedSubject,
    selectedSubjectId,
    showFeedback,
    submitMutation,
  ]);

  const handleRequestScoreChange = React.useCallback(async () => {
    if (!hasSelection || !selectedClassSubject) {
      showFeedback({
        tone: "warning",
        title: "Lengkapi filter",
        description: "Pilih periode, kelas, dan mata pelajaran terlebih dulu.",
      });
      return;
    }

    try {
      await requestChangeMutation.mutateAsync({
        classSubjectId: selectedClassSubject.id,
        periodId: selectedPeriodId,
      });

      showFeedback({
        tone: "success",
        title: "Permintaan terkirim",
        description: "Permintaan perubahan nilai telah dikirim ke wali kelas.",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal mengirim permintaan perubahan nilai";
      showFeedback({
        tone: "error",
        title: "Permintaan gagal",
        description: message,
      });
    }
  }, [
    hasSelection,
    requestChangeMutation,
    selectedClassSubject,
    selectedPeriodId,
    showFeedback,
  ]);

  const handleUpdateKkm = React.useCallback(
    async (nextKkm: number) => {
      if (!selectedClassSubject) {
        showFeedback({
          tone: "warning",
          title: "Pilih kelas dan mapel",
          description: "Pastikan kelas dan mata pelajaran sudah dipilih.",
        });
        return;
      }

      try {
        await updateKkmMutation.mutateAsync({
          classSubjectId: selectedClassSubject.id,
          kkm: nextKkm,
        });

        showFeedback({
          tone: "success",
          title: "KKM diperbarui",
          description:
            "Rekapitulasi nilai siswa telah diperbarui dengan KKM baru.",
        });
        setIsKkmDialogOpen(false);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Gagal memperbarui KKM kelas";
        showFeedback({
          tone: "error",
          title: "Update gagal",
          description: message,
        });
      }
    },
    [selectedClassSubject, showFeedback, updateKkmMutation],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-strong">
            Rekap Nilai
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Tinjau nilai akhir dan identifikasi kebutuhan remedial per kelas.
          </p>
        </div>
      </div>

      {recapQuery.isError ? (
        <div className="rounded-lg bg-surface-contrast p-6 text-sm text-error">
          Gagal memuat data rekap: {errorMessage}
        </div>
      ) : isInitialLoading ? (
        <RecapSkeleton />
      ) : (
        <>
          <RecapFilters
            periods={periods}
            classes={classes}
            subjects={subjects}
            selectedPeriodId={selectedPeriodId}
            selectedClassId={selectedClassId}
            selectedSubjectId={selectedSubjectId}
            onPeriodChange={handlePeriodChange}
            onClassChange={handleClassChange}
            onSubjectChange={handleSubjectChange}
          />

          {!hasData ? (
            <RecapEmptyState />
          ) : (
            <>
              <RecapSummaryCards
                average={summary.average}
                median={summary.median}
                passRate={summary.passRate}
                remedialCount={summary.remedialCount}
                totalStudents={summary.totalStudents}
              />

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <RecapTable
                    rows={tableRows}
                    assessmentTypes={assessmentTypes}
                    header={
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                        <div className="flex items-center">
                          <div className="h-9 py-2 px-4 flex items-center rounded-md rounded-r-none bg-primary">
                            <span className="text-sm h-fit font-semibold text-white">
                              KKM
                            </span>
                          </div>
                          <Input
                            id="kkm-readonly"
                            readOnly
                            value={
                              selectedClassKkm !== null
                                ? String(selectedClassKkm)
                                : ""
                            }
                            placeholder="Pilih kelas dan mata pelajaran"
                            className="sm:w-56 rounded-l-none"
                          />
                        </div>
                        {isSubmitted ? null : (
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={!selectedClassSubject}
                            onClick={() => setIsKkmDialogOpen(true)}
                            className="inline-flex items-center gap-2"
                          >
                            <PencilIcon
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                            Ubah
                          </Button>
                        )}
                      </div>
                    }
                  />
                </div>
                <div className="space-y-3">
                  <RecapInsights
                    distribution={distribution}
                    totalStudents={summary.totalStudents}
                  />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        disabled={!canSubmit || submitMutation.isPending}
                        onClick={handleSubmitRecap}
                        className="flex-1"
                      >
                        {submitMutation.isPending ? (
                          "Mengirim..."
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            {isSubmitted ? (
                              <LockIcon
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            ) : null}
                            {submitLabel}
                          </span>
                        )}
                      </Button>
                      {showReadinessPopover ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              size="icon"
                              aria-label={`Detail kesiapan pengiriman: ${invalidItemCount} item`}
                              className="rounded-full bg-error text-xs font-semibold text-white hover:bg-error/90 w-8 h-8"
                            >
                              {invalidItemCount}!!
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="border-0 bg-surface-contrast p-3 shadow-sm">
                            <PopoverHeader>
                              <PopoverDescription className="text-ink-strong text-xs">
                                Lengkapi data-data berikut untuk melanjutkan
                              </PopoverDescription>
                            </PopoverHeader>
                            <div className="space-y-3 text-sm mt-4">
                              <div className="space-y-2">
                                {readinessItems.map((item) => (
                                  <div key={item.label}>
                                    {item.href ? (
                                      <Link
                                        to={item.href}
                                        search={item.search}
                                        className="group flex items-center justify-between gap-3 text-xs"
                                      >
                                        <span className="flex items-center gap-2 text-primary underline-offset-4 group-hover:underline">
                                          <LinkIcon
                                            className="h-3.5 w-3.5"
                                            aria-hidden="true"
                                          />
                                          {item.label}
                                        </span>
                                        <CircleXIcon
                                          className={cn("h-4 w-4", item.tone)}
                                          aria-hidden="true"
                                        />
                                      </Link>
                                    ) : (
                                      <div className="flex items-center justify-between gap-3 text-xs">
                                        <span className="text-ink-muted">
                                          {item.label}
                                        </span>
                                        <CircleXIcon
                                          className={cn("h-4 w-4", item.tone)}
                                          aria-hidden="true"
                                        />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : null}
                    </div>
                    {isSubmitted ? (
                      hasPendingChangeRequest ? (
                        <div className="rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">
                          Pengajuan perubahan nilai telah dikirim. Menunggu
                          persetujuan dari wali kelas
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleRequestScoreChange}
                          disabled={requestChangeMutation.isPending}
                          className="w-full bg-warning text-white hover:bg-warning/90"
                        >
                          {requestChangeMutation.isPending
                            ? "Mengirim permintaan..."
                            : "Ajukan Perubahan Nilai"}
                        </Button>
                      )
                    ) : null}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
      <ConfirmDialog />
      <FeedbackDialog />
      <RecapKkmDialog
        isOpen={isKkmDialogOpen}
        isSubmitting={updateKkmMutation.isPending}
        currentKkm={selectedClassKkm}
        onClose={() => setIsKkmDialogOpen(false)}
        onSubmit={handleUpdateKkm}
      />
    </div>
  );
}
