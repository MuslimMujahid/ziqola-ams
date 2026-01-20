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
import { cn } from "@/lib/utils";

const scheduleSchema = z
  .object({
    academicPeriodId: z.string().min(1, "Pilih periode"),
    classId: z.string().min(1, "Pilih kelas"),
    subjectId: z.string().min(1, "Pilih mata pelajaran"),
    teacherProfileId: z.string().min(1, "Pilih guru"),
    dayOfWeek: z.string().min(1, "Pilih hari"),
    startTime: z.string().min(1, "Isi jam mulai"),
    endTime: z.string().min(1, "Isi jam selesai"),
  })
  .refine(
    (values) => {
      if (!values.startTime || !values.endTime) return true;
      return values.startTime < values.endTime;
    },
    {
      path: ["endTime"],
      message: "Jam selesai harus setelah jam mulai",
    },
  );

export type ScheduleFormValues = z.infer<typeof scheduleSchema>;

type ScheduleFormModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  isSubmitting: boolean;
  initialValues: ScheduleFormValues;
  academicPeriodLabel: string;
  classOptions: Array<{ label: string; value: string }>;
  subjectOptions: Array<{ label: string; value: string }>;
  teacherOptions: Array<{ label: string; value: string }>;
  dayOptions: Array<{ label: string; value: string }>;
  onDelete?: () => void;
  isDeleting?: boolean;
  onClose: () => void;
  onSubmit: (values: ScheduleFormValues) => Promise<void> | void;
};

export function ScheduleFormModal({
  isOpen,
  mode,
  isSubmitting,
  initialValues,
  academicPeriodLabel,
  classOptions,
  subjectOptions,
  teacherOptions,
  dayOptions,
  onDelete,
  isDeleting,
  onClose,
  onSubmit,
}: ScheduleFormModalProps) {
  const isCreateMode = React.useMemo(() => mode === "create", [mode]);

  const form = useAppForm({
    defaultValues: initialValues,
    validators: {
      onChange: scheduleSchema,
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
            {isCreateMode ? "Tambah jadwal mengajar" : "Ubah jadwal mengajar"}
          </DialogTitle>
          <DialogDescription>
            {isCreateMode
              ? "Atur slot waktu pengajaran pada periode yang dipilih"
              : "Perbarui slot waktu atau penugasan guru untuk jadwal ini"}
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
            <Label htmlFor="schedule-academic-period">Periode akademik</Label>
            <Input
              id="schedule-academic-period"
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

          <form.AppField name="subjectId">
            {(field) => (
              <field.Select
                label="Mata pelajaran"
                placeholder="Pilih mata pelajaran"
                values={subjectOptions}
              />
            )}
          </form.AppField>

          <form.AppField name="teacherProfileId">
            {(field) => (
              <field.Select
                label="Guru"
                placeholder="Pilih guru"
                values={teacherOptions}
              />
            )}
          </form.AppField>

          <form.AppField name="dayOfWeek">
            {(field) => (
              <field.Select
                label="Hari"
                placeholder="Pilih hari"
                values={dayOptions}
              />
            )}
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
                      Hapus jadwal
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
