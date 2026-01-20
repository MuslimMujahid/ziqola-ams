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
import type { ClassItem } from "@/lib/services/api/classes";
import type { StudentListItem } from "@/lib/services/api/students";

const enrollmentSchema = z.object({
  classId: z.string().min(1, "Kelas wajib dipilih"),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  endDate: z.string().optional(),
});

type EnrollmentFormValues = {
  classId: string;
  startDate: string;
};

type StudentsEnrollmentModalProps = {
  isOpen: boolean;
  mode: "assign" | "change";
  student: StudentListItem | null;
  classes: ClassItem[];
  academicYearLabel?: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: EnrollmentFormValues) => Promise<void> | void;
};

function getTodayValue() {
  return new Date().toISOString().slice(0, 10);
}

export function StudentsEnrollmentModal({
  isOpen,
  mode,
  student,
  classes,
  academicYearLabel,
  isSubmitting,
  onClose,
  onSubmit,
}: StudentsEnrollmentModalProps) {
  const formSchema = React.useMemo(() => enrollmentSchema, []);
  const form = useAppForm({
    defaultValues: {
      classId: "",
      startDate: getTodayValue(),
    } as EnrollmentFormValues,
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "assign" ? "Tetapkan kelas" : "Ganti kelas"}
          </DialogTitle>
          <DialogDescription>
            {student
              ? `Atur kelas untuk ${student.user.name}.`
              : "Pilih kelas untuk siswa."}
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
          <div className="space-y-1">
            <Label className="text-sm font-medium">Tahun ajaran</Label>
            <div className="rounded-md bg-surface-1 px-3 py-2 text-sm text-ink">
              {academicYearLabel ?? "-"}
            </div>
          </div>

          <form.AppField name="classId">
            {(field) => (
              <field.Select
                label="Kelas"
                placeholder="Pilih kelas"
                values={classes.map((classItem) => ({
                  label: classItem.name,
                  value: classItem.id,
                }))}
              />
            )}
          </form.AppField>

          <form.AppField name="startDate">
            {(field) => <field.DateField label="Mulai berlaku" />}
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
                    Simpan
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
