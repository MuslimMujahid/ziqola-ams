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

const ASSIGNMENT_SCHEMA = z.object({
  classId: z.string().min(1, "Pilih kelas"),
  subjectId: z.string().min(1, "Pilih mata pelajaran"),
  teacherProfileId: z.string().min(1, "Pilih guru"),
});

type AssignmentFormValues = z.infer<typeof ASSIGNMENT_SCHEMA>;

type AssignmentFormModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  isSubmitting: boolean;
  initialValues: AssignmentFormValues;
  classOptions: Array<{ label: string; value: string }>;
  subjectOptions: Array<{ label: string; value: string }>;
  teacherOptions: Array<{ label: string; value: string }>;
  academicYearLabel: string;
  onClose: () => void;
  onSubmit: (values: AssignmentFormValues) => Promise<void> | void;
};

export function AssignmentFormModal({
  isOpen,
  mode,
  isSubmitting,
  initialValues,
  classOptions,
  subjectOptions,
  teacherOptions,
  academicYearLabel,
  onClose,
  onSubmit,
}: AssignmentFormModalProps) {
  const isCreateMode = React.useMemo(() => mode === "create", [mode]);

  const form = useAppForm({
    defaultValues: initialValues,
    validators: {
      onChange: ASSIGNMENT_SCHEMA,
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
            {isCreateMode ? "Tambah penugasan" : "Ubah guru pengajar"}
          </DialogTitle>
          <DialogDescription>
            {isCreateMode
              ? "Tetapkan mata pelajaran untuk kelas yang dipilih"
              : "Perbarui guru pengajar untuk mata pelajaran ini"}
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
            <Label htmlFor="assignment-academic-year">Tahun ajaran</Label>
            <Input
              id="assignment-academic-year"
              value={academicYearLabel}
              disabled
              className="mt-2"
            />
          </div>

          {isCreateMode ? (
            <form.AppField name="classId">
              {(field) => (
                <field.Select
                  label="Kelas"
                  placeholder="Pilih kelas"
                  values={classOptions}
                />
              )}
            </form.AppField>
          ) : null}

          {isCreateMode ? (
            <form.AppField name="subjectId">
              {(field) => (
                <field.Select
                  label="Mata pelajaran"
                  placeholder="Pilih mata pelajaran"
                  values={subjectOptions}
                />
              )}
            </form.AppField>
          ) : null}

          <form.AppField name="teacherProfileId">
            {(field) => (
              <field.Select
                label="Guru pengajar"
                placeholder="Pilih guru"
                values={teacherOptions}
              />
            )}
          </form.AppField>

          {!subjectOptions.length && isCreateMode ? (
            <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
              Tambahkan mata pelajaran terlebih dahulu sebelum membuat
              penugasan.
            </p>
          ) : null}

          <DialogFooter className={cn(!isCreateMode && "pt-2")}>
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
