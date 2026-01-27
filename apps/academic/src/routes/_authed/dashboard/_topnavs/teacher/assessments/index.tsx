import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { FileTextIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { Button } from "@repo/ui/button";
import { cn } from "@/lib/utils/cn";
import { DataTable } from "@/components/data-table/data-table";
import { useAuthStore } from "@/stores/auth.store";
import { useConfirm } from "@/lib/utils/use-confirm";
import { useFeedbackDialog } from "@/lib/utils/use-feedback-dialog";
import { useSuspenseAcademicContext } from "@/lib/services/api/academic";
import { useSuspenseClassSubjects } from "@/lib/services/api/class-subjects";
import { useSuspenseTeacherSubjects } from "@/lib/services/api/teacher-subjects";
import { useSuspenseTenantAssessmentTypes } from "@/lib/services/api/profile-custom-fields";
import {
  type AssessmentComponent,
  type AssessmentTypeWeight,
  useSuspenseAssessmentComponents,
  useSuspenseAssessmentTypeWeights,
  useCreateAssessmentComponent,
  useDeleteAssessmentComponent,
  useUpdateAssessmentComponent,
  useUpsertAssessmentTypeWeight,
} from "@/lib/services/api/assessment-components";
import {
  AssessmentComponentFormModal,
  type AssessmentComponentFormValues,
} from "./-components/assessment-component-form-modal";
import { AssessmentTypeWeightModal } from "./-components/assessment-type-weight-modal";
import { TeacherAssessmentsSkeleton } from "./-components/teacher-assessments-skeleton";

export const Route = createFileRoute(
  "/_authed/dashboard/_topnavs/teacher/assessments/",
)({
  staticData: { topnavId: "teacher" },
  component: TeacherAssessmentComponentsPage,
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  ),
  pendingComponent: () => <TeacherAssessmentsSkeleton />,
});

function TeacherAssessmentComponentsPage() {
  return (
    <React.Suspense fallback={<TeacherAssessmentsSkeleton />}>
      <TeacherAssessmentComponentsContent />
    </React.Suspense>
  );
}

type AssessmentTypeOption = {
  label: string;
  value: string;
};

function TeacherAssessmentComponentsContent() {
  const user = useAuthStore((state) => state.user);
  if (!user?.tenantId) {
    return (
      <div className="rounded-lg bg-surface-contrast p-6 text-sm text-ink-muted">
        Data akun belum tersedia. Silakan muat ulang halaman.
      </div>
    );
  }

  return <TeacherAssessmentComponentsWithTenant tenantId={user.tenantId} />;
}

function TeacherAssessmentComponentsWithTenant({
  tenantId,
}: {
  tenantId: string;
}) {
  const { confirm, ConfirmDialog } = useConfirm();
  const { showFeedback, FeedbackDialog } = useFeedbackDialog();

  const academicContextQuery = useSuspenseAcademicContext();
  const activePeriod = academicContextQuery.data?.period ?? null;
  const activeYear = academicContextQuery.data?.year ?? null;

  if (!activeYear?.id) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink-strong">
              Kelola Nilai
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Kelola komponen penilaian untuk kelas yang Anda ajar.
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-surface-contrast p-6 text-sm text-ink-muted">
          Tahun ajaran aktif belum tersedia. Hubungi admin sekolah untuk
          mengatur tahun ajaran.
        </div>
      </div>
    );
  }

  return (
    <TeacherAssessmentComponentsWithYear
      tenantId={tenantId}
      activePeriod={activePeriod}
      activeYearId={activeYear.id}
      confirm={confirm}
      showFeedback={showFeedback}
      ConfirmDialog={ConfirmDialog}
      FeedbackDialog={FeedbackDialog}
    />
  );
}

type TeacherAssessmentComponentsWithYearProps = {
  tenantId: string;
  activePeriod: { id: string } | null;
  activeYearId: string;
  confirm: ReturnType<typeof useConfirm>["confirm"];
  showFeedback: ReturnType<typeof useFeedbackDialog>["showFeedback"];
  ConfirmDialog: ReturnType<typeof useConfirm>["ConfirmDialog"];
  FeedbackDialog: ReturnType<typeof useFeedbackDialog>["FeedbackDialog"];
};

type AssessmentTypeWeightsCardProps = {
  assessmentTypes: { id: string; label: string }[];
  weightMap: Map<string, AssessmentTypeWeight>;
  totalWeight: number;
  showWeightEmptyState: boolean;
  onOpenWeightModal: (
    type: { id: string; label: string },
    weight: AssessmentTypeWeight | null,
  ) => void;
};

function TeacherAssessmentComponentsWithYear({
  tenantId,
  activePeriod,
  activeYearId,
  confirm,
  showFeedback,
  ConfirmDialog,
  FeedbackDialog,
}: TeacherAssessmentComponentsWithYearProps) {
  const classSubjectsQuery = useSuspenseClassSubjects({
    academicYearId: activeYearId,
    limit: 100,
  });

  const classSubjects = classSubjectsQuery.data?.data ?? [];
  const [selectedClassId, setSelectedClassId] = React.useState("");
  const [selectedSubjectId, setSelectedSubjectId] = React.useState("");

  const teacherSubjectsQuery = useSuspenseTeacherSubjects({
    academicYearId: activeYearId,
  });

  const teacherSubjects = teacherSubjectsQuery.data?.data ?? [];

  const assessmentTypesQuery = useSuspenseTenantAssessmentTypes({
    tenantId,
    includeDisabled: false,
  });

  const assessmentTypes = assessmentTypesQuery.data?.data ?? [];

  const subjectOptions = React.useMemo(() => {
    const options = new Map<string, { id: string; name: string }>();
    teacherSubjects.forEach((item) => {
      if (!options.has(item.subjectId)) {
        options.set(item.subjectId, {
          id: item.subjectId,
          name: item.subjectName,
        });
      }
    });
    return Array.from(options.values());
  }, [teacherSubjects]);

  const classOptions = React.useMemo(() => {
    if (!selectedSubjectId) return [];
    const options = new Map<string, { id: string; name: string }>();
    classSubjects
      .filter((item) => item.subjectId === selectedSubjectId)
      .forEach((item) => {
        if (!options.has(item.classId)) {
          options.set(item.classId, { id: item.classId, name: item.className });
        }
      });
    return Array.from(options.values());
  }, [classSubjects, selectedSubjectId]);

  React.useEffect(() => {
    if (
      !selectedSubjectId ||
      !subjectOptions.some((option) => option.id === selectedSubjectId)
    ) {
      setSelectedSubjectId(subjectOptions[0]?.id ?? "");
    }
  }, [selectedSubjectId, subjectOptions]);

  React.useEffect(() => {
    if (!selectedSubjectId) {
      setSelectedClassId("");
      return;
    }

    if (
      !selectedClassId ||
      !classOptions.some((option) => option.id === selectedClassId)
    ) {
      setSelectedClassId(classOptions[0]?.id ?? "");
    }
  }, [classOptions, selectedClassId, selectedSubjectId]);

  const selectedClassSubjectId = React.useMemo(() => {
    if (!selectedClassId || !selectedSubjectId) return "";
    return (
      classSubjects.find(
        (item) =>
          item.classId === selectedClassId &&
          item.subjectId === selectedSubjectId,
      )?.id ?? ""
    );
  }, [classSubjects, selectedClassId, selectedSubjectId]);

  const selectedTeacherSubject = React.useMemo(
    () =>
      teacherSubjects.find((item) => item.subjectId === selectedSubjectId) ??
      null,
    [selectedSubjectId, teacherSubjects],
  );

  const selectedTeacherSubjectId = selectedTeacherSubject?.id ?? "";

  const createComponent = useCreateAssessmentComponent();
  const updateComponent = useUpdateAssessmentComponent();
  const deleteComponent = useDeleteAssessmentComponent();
  const upsertTypeWeight = useUpsertAssessmentTypeWeight();

  const [componentModalOpen, setComponentModalOpen] = React.useState(false);
  const [componentModalMode, setComponentModalMode] = React.useState<
    "create" | "edit"
  >("create");
  const [editingComponent, setEditingComponent] =
    React.useState<AssessmentComponent | null>(null);

  const [weightModalOpen, setWeightModalOpen] = React.useState(false);
  const [weightModalType, setWeightModalType] = React.useState<{
    id: string;
    label: string;
    weight?: AssessmentTypeWeight | null;
  } | null>(null);

  const assessmentTypeOptions = React.useMemo<AssessmentTypeOption[]>(
    () =>
      assessmentTypes.map((type) => ({
        label: type.label,
        value: type.id,
      })),
    [assessmentTypes],
  );

  const handleOpenCreate = React.useCallback(() => {
    setComponentModalMode("create");
    setEditingComponent(null);
    setComponentModalOpen(true);
  }, []);

  const handleOpenEdit = React.useCallback((component: AssessmentComponent) => {
    setComponentModalMode("edit");
    setEditingComponent(component);
    setComponentModalOpen(true);
  }, []);

  const handleDelete = React.useCallback(
    async (component: AssessmentComponent) => {
      const confirmed = await confirm({
        title: `Hapus ${component.name}?`,
        description:
          "Semua nilai yang terkait akan ikut dihapus. Tindakan ini tidak bisa dibatalkan.",
        confirmText: "Hapus",
        cancelText: "Batal",
        confirmVariant: "destructive",
      });

      if (!confirmed) return;

      await deleteComponent.mutateAsync({ id: component.id });
      showFeedback({
        tone: "success",
        title: "Penilaian dihapus",
        description: `${component.name} berhasil dihapus.`,
      });
    },
    [confirm, deleteComponent, showFeedback],
  );

  const columns = React.useMemo<ColumnDef<AssessmentComponent>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nama Penilaian",
        cell: ({ row }) => row.original.name,
      },
      {
        accessorKey: "assessmentTypeId",
        header: "Tipe Penilaian",
        cell: ({ row }) => row.original.assessmentType.label,
        filterFn: (row, _id, value) => {
          if (!value) return true;
          return row.original.assessmentTypeId === value;
        },
      },
      {
        id: "scoreStatus",
        header: "Status Nilai",
        cell: ({ row }) => {
          const summary = row.original.scoreSummary;
          const totalStudents = summary?.totalStudents ?? 0;
          const isComplete = summary?.isComplete ?? false;

          const statusLabel = totalStudents
            ? isComplete
              ? "Lengkap"
              : "Belum lengkap"
            : "Belum ada siswa";

          const statusTone = totalStudents
            ? isComplete
              ? "bg-success/10 text-success"
              : "bg-warning/10 text-warning"
            : "bg-surface-2 text-ink-muted";

          return (
            <div className="flex flex-col">
              <span
                className={cn(
                  "inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium",
                  statusTone,
                )}
              >
                {statusLabel}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary">
              <Link
                to="/dashboard/teacher/assessments/scores/$componentId"
                params={{ componentId: row.original.id }}
              >
                <FileTextIcon className="h-4 w-4" aria-hidden="true" />
                <span>Kelola nilai</span>
              </Link>
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleOpenEdit(row.original)}
            >
              <PencilIcon className="h-4 w-4" aria-hidden="true" />
              <span>Edit</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-error hover:text-error"
              onClick={() => handleDelete(row.original)}
            >
              <Trash2Icon className="h-4 w-4" aria-hidden="true" />
              <span>Hapus</span>
            </Button>
          </div>
        ),
      },
    ],
    [handleDelete, handleOpenEdit],
  );

  const handleWeightModal = React.useCallback(
    (
      type: { id: string; label: string },
      weight: AssessmentTypeWeight | null,
    ) => {
      setWeightModalType({
        id: type.id,
        label: type.label,
        weight,
      });
      setWeightModalOpen(true);
    },
    [],
  );

  const handleSubmitComponent = React.useCallback(
    async (values: AssessmentComponentFormValues) => {
      if (!selectedClassSubjectId || !activePeriod?.id) return;

      if (componentModalMode === "create") {
        await createComponent.mutateAsync({
          classSubjectId: selectedClassSubjectId,
          academicPeriodId: activePeriod.id,
          assessmentTypeId: values.assessmentTypeId,
          name: values.name,
        });
        showFeedback({
          tone: "success",
          title: "Penilaian ditambahkan",
          description: `${values.name} berhasil dibuat.`,
        });
      } else if (editingComponent) {
        await updateComponent.mutateAsync({
          id: editingComponent.id,
          name: values.name,
          assessmentTypeId: values.assessmentTypeId,
        });
        showFeedback({
          tone: "success",
          title: "Penilaian diperbarui",
          description: `${values.name} berhasil diperbarui.`,
        });
      }

      setComponentModalOpen(false);
    },
    [
      activePeriod?.id,
      componentModalMode,
      createComponent,
      editingComponent,
      selectedClassSubjectId,
      showFeedback,
      updateComponent,
    ],
  );

  const handleSubmitWeight = React.useCallback(
    async (weight: number) => {
      if (!weightModalType || !selectedTeacherSubjectId || !activePeriod?.id) {
        return;
      }

      await upsertTypeWeight.mutateAsync({
        teacherSubjectId: selectedTeacherSubjectId,
        academicPeriodId: activePeriod.id,
        assessmentTypeId: weightModalType.id,
        weight,
      });

      showFeedback({
        tone: "success",
        title: "Bobot diperbarui",
        description: `Bobot ${weightModalType.label} berhasil disimpan.`,
      });

      setWeightModalOpen(false);
    },
    [
      activePeriod?.id,
      selectedTeacherSubjectId,
      showFeedback,
      upsertTypeWeight,
      weightModalType,
    ],
  );

  const showWeightEmptyState = !activePeriod?.id || !selectedTeacherSubjectId;
  const showComponentEmptyState = !activePeriod?.id || !selectedClassSubjectId;

  const renderToolbar = React.useCallback(
    (table: import("@tanstack/react-table").Table<AssessmentComponent>) => (
      <>
        <div className="flex gap-3">
          <Select
            value={selectedClassId}
            onValueChange={setSelectedClassId}
            disabled={!selectedSubjectId}
          >
            <SelectTrigger id="class-selector" className="w-full">
              <SelectValue placeholder="Pilih kelas" />
            </SelectTrigger>
            <SelectContent>
              {classOptions.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={
              (table.getColumn("assessmentTypeId")?.getFilterValue() as
                | string
                | undefined) ?? "all"
            }
            onValueChange={(value) => {
              table
                .getColumn("assessmentTypeId")
                ?.setFilterValue(value === "all" ? "" : value);
            }}
          >
            <SelectTrigger className="w-50">
              <SelectValue placeholder="Semua tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua tipe</SelectItem>
              {assessmentTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          className="ml-auto"
          onClick={handleOpenCreate}
          disabled={!selectedClassSubjectId || !activePeriod?.id}
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Tambah Penilaian
        </Button>
      </>
    ),
    [
      activePeriod?.id,
      assessmentTypes,
      classOptions,
      handleOpenCreate,
      selectedClassId,
      selectedClassSubjectId,
      selectedSubjectId,
    ],
  );

  const assessmentWeightsSection = showWeightEmptyState ? (
    <AssessmentTypeWeightsCard
      assessmentTypes={assessmentTypes}
      weightMap={new Map()}
      totalWeight={0}
      showWeightEmptyState
      onOpenWeightModal={handleWeightModal}
    />
  ) : (
    <React.Suspense fallback={<AssessmentTypeWeightsSectionSkeleton />}>
      <AssessmentTypeWeightsData
        assessmentTypes={assessmentTypes}
        teacherSubjectId={selectedTeacherSubjectId}
        academicPeriodId={activePeriod?.id ?? ""}
        onOpenWeightModal={handleWeightModal}
      />
    </React.Suspense>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-strong">
            Kelola Nilai
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Kelola komponen penilaian untuk kelas yang Anda ajar.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-4 rounded-lg bg-surface-contrast p-5">
          <div className="min-w-55 flex-1">
            <label
              htmlFor="subject-selector"
              className="mb-2 block text-sm font-medium text-ink-muted"
            >
              Mata Pelajaran
            </label>
            <Select
              value={selectedSubjectId}
              onValueChange={setSelectedSubjectId}
            >
              <SelectTrigger id="subject-selector" className="w-full">
                <SelectValue placeholder="Pilih mata pelajaran" />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {assessmentWeightsSection}
      </div>

      <div className="space-y-4">
        {showComponentEmptyState ? (
          <div className="rounded-lg bg-surface-contrast p-6 text-sm text-ink-muted">
            Komponen penilaian akan muncul setelah kelas dan periode aktif
            dipilih.
          </div>
        ) : (
          <React.Suspense fallback={<AssessmentComponentsTableSkeleton />}>
            <AssessmentComponentsTableData
              classSubjectId={selectedClassSubjectId}
              academicPeriodId={activePeriod?.id ?? ""}
              columns={columns}
              renderToolbar={renderToolbar}
            />
          </React.Suspense>
        )}
      </div>

      {componentModalOpen ? (
        <AssessmentComponentFormModal
          isOpen={componentModalOpen}
          mode={componentModalMode}
          isSubmitting={createComponent.isPending || updateComponent.isPending}
          assessmentTypes={assessmentTypeOptions}
          initialValues={
            editingComponent
              ? {
                  assessmentTypeId: editingComponent.assessmentTypeId,
                  name: editingComponent.name,
                }
              : undefined
          }
          onClose={() => setComponentModalOpen(false)}
          onSubmit={handleSubmitComponent}
        />
      ) : null}

      {weightModalOpen && weightModalType ? (
        <AssessmentTypeWeightModal
          isOpen={weightModalOpen}
          isSubmitting={upsertTypeWeight.isPending}
          assessmentTypeLabel={weightModalType.label}
          initialWeight={weightModalType.weight?.weight ?? null}
          onClose={() => setWeightModalOpen(false)}
          onSubmit={handleSubmitWeight}
        />
      ) : null}

      <FeedbackDialog />
      <ConfirmDialog />
    </div>
  );
}

function AssessmentTypeWeightsData({
  assessmentTypes,
  teacherSubjectId,
  academicPeriodId,
  onOpenWeightModal,
}: {
  assessmentTypes: { id: string; label: string }[];
  teacherSubjectId: string;
  academicPeriodId: string;
  onOpenWeightModal: (
    type: { id: string; label: string },
    weight: AssessmentTypeWeight | null,
  ) => void;
}) {
  const typeWeightQuery = useSuspenseAssessmentTypeWeights({
    teacherSubjectId,
    academicPeriodId,
  });

  const weightPayload = typeWeightQuery.data?.data;
  const typeWeights = weightPayload?.weights ?? [];
  const totalWeight = weightPayload?.totalWeight ?? 0;

  const weightMap = React.useMemo(() => {
    return new Map(
      typeWeights.map((weight) => [weight.assessmentTypeId, weight]),
    );
  }, [typeWeights]);

  return (
    <AssessmentTypeWeightsCard
      assessmentTypes={assessmentTypes}
      weightMap={weightMap}
      totalWeight={totalWeight}
      showWeightEmptyState={false}
      onOpenWeightModal={onOpenWeightModal}
    />
  );
}

function AssessmentTypeWeightsCard({
  assessmentTypes,
  weightMap,
  totalWeight,
  showWeightEmptyState,
  onOpenWeightModal,
}: AssessmentTypeWeightsCardProps) {
  const totalTone = React.useMemo(() => {
    if (totalWeight === 100) return "text-success";
    if (totalWeight > 100) return "text-error";
    return "text-warning";
  }, [totalWeight]);

  return (
    <div className="space-y-4 rounded-lg bg-surface-contrast p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink-strong">
            Bobot Komponen Penilaian
          </h2>
          <p className="text-sm text-ink-muted">
            Nilai ini akan digunakan untuk perhitungan nilai akhir siswa. Total
            bobot harus tepat 100%.
          </p>
        </div>
        <div className={cn("text-lg font-semibold", totalTone)}>
          {totalWeight}%
        </div>
      </div>

      <div className="space-y-2">
        {assessmentTypes.length === 0 ? (
          <div className="text-sm text-ink-muted">
            Tipe penilaian belum tersedia.
          </div>
        ) : (
          assessmentTypes.map((type) => {
            const weight = weightMap.get(type.id)?.weight ?? 0;
            return (
              <div
                key={type.id}
                className="flex items-center justify-between rounded-md bg-surface-1 px-3 py-2"
              >
                <div>
                  <div className="text-sm font-medium text-ink-strong">
                    {type.label}
                  </div>
                  <div className="text-xs text-ink-muted">{weight}%</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onOpenWeightModal(type, weightMap.get(type.id) ?? null)
                  }
                  disabled={showWeightEmptyState}
                >
                  Atur bobot
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function AssessmentTypeWeightsSectionSkeleton() {
  return (
    <div className="space-y-4 rounded-lg bg-surface-contrast p-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 w-40 rounded-md bg-surface-1" />
          <div className="h-4 w-64 rounded-md bg-surface-1" />
        </div>
        <div className="h-6 w-16 rounded-md bg-surface-1" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`weight-section-skeleton-${index}`}
            className="h-12 rounded-md bg-surface-1"
          />
        ))}
      </div>
    </div>
  );
}

function AssessmentComponentsTableData({
  classSubjectId,
  academicPeriodId,
  columns,
  renderToolbar,
}: {
  classSubjectId: string;
  academicPeriodId: string;
  columns: ColumnDef<AssessmentComponent>[];
  renderToolbar: (
    table: import("@tanstack/react-table").Table<AssessmentComponent>,
  ) => React.ReactNode;
}) {
  const componentQuery = useSuspenseAssessmentComponents({
    classSubjectId,
    academicPeriodId,
  });

  const components = componentQuery.data?.data ?? [];

  return (
    <div className="rounded-lg bg-surface-contrast p-4">
      <div className="mt-4">
        <DataTable
          data={components}
          columns={columns}
          searchColumnId="name"
          globalFilterPlaceholder="Cari penilaian..."
          renderToolbar={renderToolbar}
          emptyMessage="Belum ada penilaian"
          enablePagination
          enableSorting
        />
      </div>
    </div>
  );
}

function AssessmentComponentsTableSkeleton() {
  return (
    <div className="rounded-lg bg-surface-contrast p-4 space-y-4 animate-pulse">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-3">
          <div className="h-10 w-40 rounded-md bg-surface-1" />
          <div className="h-10 w-32 rounded-md bg-surface-1" />
        </div>
        <div className="h-10 w-40 rounded-md bg-surface-1" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`table-skeleton-${index}`}
            className="h-12 rounded-md bg-surface-1"
          />
        ))}
      </div>
    </div>
  );
}
