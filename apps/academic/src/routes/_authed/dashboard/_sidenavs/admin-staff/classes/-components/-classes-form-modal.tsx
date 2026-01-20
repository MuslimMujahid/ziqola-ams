import React from "react";
import { z } from "zod";
import { Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import { Button } from "@repo/ui/button";
import { Label } from "@repo/ui/label";
import { useAppForm } from "@/lib/utils/form";
import type { Group, GroupType } from "@/lib/services/api/groups";
import type { AcademicYear } from "@/lib/services/api/academic";

const CLASS_NAME_MAX = 60;

const GROUP_TYPE_LABELS: Record<GroupType, string> = {
  GRADE: "Tingkat",
  STREAM: "Jurusan",
  PROGRAM: "Program",
  CUSTOM: "Kustom",
};

const NONE_VALUE = "none";

type ClassFormValues = {
  name: string;
  academicYearId?: string;
  gradeGroupId?: string;
  groupId?: string;
};

type ClassesFormModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  isSubmitting: boolean;
  initialValues?: ClassFormValues;
  academicYears: AcademicYear[];
  groups: Group[];
  lockAcademicYear?: boolean;
  lockedAcademicYearLabel?: string | null;
  onClose: () => void;
  onSubmit: (values: ClassFormValues) => Promise<void> | void;
};

export function ClassesFormModal({
  isOpen,
  mode,
  isSubmitting,
  initialValues,
  academicYears,
  groups,
  lockAcademicYear = false,
  lockedAcademicYearLabel,
  onClose,
  onSubmit,
}: ClassesFormModalProps) {
  const gradeGroups = React.useMemo(
    () => groups.filter((group) => group.type === "GRADE"),
    [groups],
  );

  const nonGradeGroups = React.useMemo(
    () => groups.filter((group) => group.type !== "GRADE"),
    [groups],
  );

  const formSchema = React.useMemo(() => {
    return z
      .object({
        name: z
          .string()
          .trim()
          .min(2, "Minimal 2 karakter")
          .max(CLASS_NAME_MAX, "Maksimal 60 karakter"),
        gradeGroupId: z.string().optional(),
        groupId: z.string().min(1, "Rombongan belajar wajib dipilih"),
        academicYearId: z.string().optional(),
      })
      .superRefine((value, ctx) => {
        if (mode === "create" && !value.academicYearId) {
          ctx.addIssue({
            code: "custom",
            path: ["academicYearId"],
            message: "Tahun ajaran wajib dipilih",
          });
        }
      });
  }, [mode]);

  const form = useAppForm({
    defaultValues: {
      name: initialValues?.name ?? "",
      academicYearId: initialValues?.academicYearId ?? "",
      gradeGroupId: initialValues?.gradeGroupId ?? NONE_VALUE,
      groupId: initialValues?.groupId ?? "",
    } as ClassFormValues,
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      const normalizedValue = {
        ...value,
        gradeGroupId:
          value.gradeGroupId === NONE_VALUE ? undefined : value.gradeGroupId,
      };
      await onSubmit(normalizedValue);
    },
  });

  const selectedYearLabel = React.useMemo(() => {
    if (lockedAcademicYearLabel) {
      return lockedAcademicYearLabel;
    }

    const year = academicYears.find(
      (item) => item.id === initialValues?.academicYearId,
    );
    return year?.label ?? "-";
  }, [academicYears, initialValues?.academicYearId, lockedAcademicYearLabel]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tambah kelas" : "Edit kelas"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Tambahkan kelas baru dan pilih tingkat"
              : "Perbarui detail kelas"}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            form.handleSubmit();
          }}
          noValidate
        >
          <form.AppField name="name">
            {(field) => (
              <field.TextField label="Nama kelas" placeholder="mis. XI IPA 1" />
            )}
          </form.AppField>

          {mode === "create" && !lockAcademicYear ? (
            <form.AppField name="academicYearId">
              {(field) => (
                <field.Select
                  label="Tahun ajaran"
                  placeholder="Pilih tahun ajaran"
                  values={academicYears.map((year) => ({
                    label: year.label,
                    value: year.id,
                  }))}
                />
              )}
            </form.AppField>
          ) : (
            <div className="space-y-1">
              <Label className="text-sm font-medium">Tahun ajaran</Label>
              <div className="rounded-md bg-surface-1 px-3 py-2 text-sm text-ink">
                {selectedYearLabel}
              </div>
            </div>
          )}

          <form.AppField name="gradeGroupId">
            {(field) => (
              <div className="space-y-2">
                {gradeGroups.length === 0 ? (
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Tingkat</Label>
                    <div className="rounded-md bg-surface-1 px-3 py-2 text-sm text-ink-muted">
                      Belum ada tingkat yang tersedia.
                    </div>
                  </div>
                ) : (
                  <field.Select
                    label="Tingkat"
                    placeholder="Pilih tingkat"
                    values={[
                      { label: "Tanpa tingkat", value: NONE_VALUE },
                      ...gradeGroups.map((group) => ({
                        label: group.name,
                        value: group.id,
                      })),
                    ]}
                  />
                )}
              </div>
            )}
          </form.AppField>

          <form.AppField name="groupId">
            {(field) => (
              <div className="space-y-2">
                {nonGradeGroups.length === 0 ? (
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">
                      Rombongan Belajar
                    </Label>
                    <div className="rounded-md bg-surface-1 px-3 py-2 text-sm text-ink-muted">
                      Belum ada rombongan belajar yang tersedia.
                    </div>
                  </div>
                ) : (
                  <field.Select
                    label="Rombongan Belajar"
                    placeholder="Pilih rombongan belajar"
                    values={[
                      ...nonGradeGroups.map((group) => ({
                        label: `${group.name} · ${GROUP_TYPE_LABELS[group.type]}`,
                        value: group.id,
                      })),
                    ]}
                  />
                )}
              </div>
            )}
          </form.AppField>

          <DialogFooter>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmittingForm]) => (
                <>
                  <Button type="button" variant="ghost" onClick={onClose}>
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={!canSubmit || isSubmittingForm || isSubmitting}
                  >
                    {(isSubmittingForm || isSubmitting) && (
                      <Loader2Icon
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    )}
                    {mode === "create" ? "Simpan" : "Perbarui"}
                  </Button>
                </>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
