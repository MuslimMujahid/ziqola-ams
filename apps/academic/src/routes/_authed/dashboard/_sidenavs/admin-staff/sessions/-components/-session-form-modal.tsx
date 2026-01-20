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
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { useAppForm } from "@/lib/utils/form";
import type { ClassSubject } from "@/lib/services/api/class-subjects";
import { cn } from "@/lib/utils";

const sessionSchema = z
  .object({
    academicPeriodId: z.string().min(1, "Periode akademik wajib diisi"),
    classId: z.string().min(1, "Pilih kelas"),
    subjectId: z.string().min(1, "Pilih mata pelajaran"),
    date: z.string().min(1, "Pilih tanggal"),
    startTime: z.string().min(1, "Isi jam mulai"),
    endTime: z.string().min(1, "Isi jam selesai"),
  })
  .superRefine((values, context) => {
    if (values.startTime && values.endTime) {
      if (values.startTime >= values.endTime) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endTime"],
          message: "Jam selesai harus setelah jam mulai",
        });
      }
    }
  });

export type SessionFormValues = z.infer<typeof sessionSchema>;

type SessionFormModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  isSubmitting: boolean;
  initialValues: SessionFormValues;
  academicPeriodLabel: string;
  classOptions: Array<{ label: string; value: string }>;
  subjectOptions: Array<{ label: string; value: string }>;
  classSubjects: ClassSubject[];
  onDelete?: () => void;
  isDeleting?: boolean;
  onClose: () => void;
  onSubmit: (values: SessionFormValues) => Promise<void> | void;
};

export function SessionFormModal({
  isOpen,
  mode,
  isSubmitting,
  initialValues,
  academicPeriodLabel,
  classOptions,
  subjectOptions,
  classSubjects,
  onDelete,
  isDeleting,
  onClose,
  onSubmit,
}: SessionFormModalProps) {
  const isCreateMode = React.useMemo(() => mode === "create", [mode]);

  const form = useAppForm({
    defaultValues: initialValues,
    validators: {
      onChange: sessionSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isCreateMode
              ? "Tambah sesi pembelajaran"
              : "Ubah sesi pembelajaran"}
          </DialogTitle>
          <DialogDescription>
            {isCreateMode
              ? "Catat sesi pembelajaran berdasarkan jadwal atau input manual"
              : "Perbarui waktu atau detail sesi pembelajaran"}
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
          <div>
            <Label htmlFor="session-academic-period">Periode akademik</Label>
            <Input
              id="session-academic-period"
              value={academicPeriodLabel}
              disabled
              className="mt-2"
            />
          </div>

          <form.AppField name="classId">
            {(field) => (
              <field.Select
                label="Kelas"
                placeholder="Pilih kelas"
                values={classOptions}
              />
            )}
          </form.AppField>

          <form.Subscribe selector={(state) => state.values.classId}>
            {(selectedClassId) => {
              const filteredSubjects = selectedClassId
                ? Array.from(
                    new Map(
                      classSubjects
                        .filter((item) => item.classId === selectedClassId)
                        .map((item) => [item.subjectId, item.subjectName]),
                    ).entries(),
                  ).map(([value, label]) => ({ value, label }))
                : subjectOptions;

              return (
                <div>
                  <form.AppField name="subjectId">
                    {(field) => (
                      <field.Select
                        label="Mata pelajaran"
                        placeholder="Pilih mata pelajaran"
                        values={filteredSubjects}
                      />
                    )}
                  </form.AppField>
                  {selectedClassId && filteredSubjects.length === 0 ? (
                    <p className="mt-2 text-xs text-error">
                      Belum ada mata pelajaran untuk kelas ini.
                    </p>
                  ) : null}
                </div>
              );
            }}
          </form.Subscribe>

          <form.Subscribe
            selector={(state) => [state.values.classId, state.values.subjectId]}
          >
            {([classId, subjectId]) => {
              const selectedAssignment = classSubjects.find(
                (item) =>
                  item.classId === classId && item.subjectId === subjectId,
              );

              return (
                <div>
                  <Label htmlFor="session-teacher">Guru</Label>
                  <Input
                    id="session-teacher"
                    value={selectedAssignment?.teacherName ?? "-"}
                    disabled
                    className="mt-2"
                  />
                  {!selectedAssignment && classId && subjectId ? (
                    <p className="mt-2 text-xs text-error">
                      Penugasan guru untuk kelas dan mata pelajaran ini belum
                      dibuat.
                    </p>
                  ) : null}
                </div>
              );
            }}
          </form.Subscribe>

          <form.AppField name="date">
            {(field) => <field.DateField label="Tanggal" />}
          </form.AppField>

          <div className="grid gap-4 sm:grid-cols-2">
            <form.AppField name="startTime">
              {(field) => (
                <field.TextField
                  label="Jam mulai"
                  placeholder="07:00"
                  type="time"
                  step={60}
                  lang="id-ID"
                />
              )}
            </form.AppField>

            <form.AppField name="endTime">
              {(field) => (
                <field.TextField
                  label="Jam selesai"
                  placeholder="08:00"
                  type="time"
                  step={60}
                  lang="id-ID"
                />
              )}
            </form.AppField>
          </div>

          <DialogFooter className={cn(!isCreateMode && "pt-2")}>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmittingForm]) => (
                <>
                  {!isCreateMode && onDelete ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-error hover:text-error"
                      onClick={onDelete}
                      disabled={isDeleting}
                    >
                      Hapus sesi
                    </Button>
                  ) : null}
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
                    {isCreateMode ? "Simpan" : "Perbarui"}
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
