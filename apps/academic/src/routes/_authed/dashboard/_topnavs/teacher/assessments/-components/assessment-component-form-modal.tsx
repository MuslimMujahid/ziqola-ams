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
import { useAppForm } from "@/lib/utils/form";

const COMPONENT_SCHEMA = z.object({
  assessmentTypeId: z.string().min(1, "Pilih tipe penilaian"),
  name: z.string().trim().min(2, "Minimal 2 karakter").max(100),
});

export type AssessmentComponentFormValues = z.infer<typeof COMPONENT_SCHEMA>;

export type AssessmentComponentDraft = {
  id: string;
  assessmentTypeId: string;
  name: string;
};

type AssessmentComponentFormModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  isSubmitting: boolean;
  assessmentTypes: Array<{ label: string; value: string }>;
  initialValues?: AssessmentComponentFormValues;
  onClose: () => void;
  onSubmit: (values: AssessmentComponentFormValues) => Promise<void> | void;
};

export function AssessmentComponentFormModal({
  isOpen,
  mode,
  isSubmitting,
  assessmentTypes,
  initialValues,
  onClose,
  onSubmit,
}: AssessmentComponentFormModalProps) {
  const form = useAppForm({
    defaultValues: {
      assessmentTypeId: initialValues?.assessmentTypeId ?? "",
      name: initialValues?.name ?? "",
    } as AssessmentComponentFormValues,
    validators: { onChange: COMPONENT_SCHEMA },
    onSubmit: async ({ value }) => {
      await onSubmit({
        assessmentTypeId: value.assessmentTypeId,
        name: value.name.trim(),
      });
    },
  });

  React.useEffect(() => {
    if (!isOpen) {
      form.reset({ assessmentTypeId: "", name: "" });
      return;
    }

    form.reset({
      assessmentTypeId: initialValues?.assessmentTypeId ?? "",
      name: initialValues?.name ?? "",
    });
  }, [form, initialValues?.assessmentTypeId, initialValues?.name, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tambah komponen" : "Edit komponen"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Tambahkan komponen penilaian baru untuk kelas ini"
              : "Perbarui informasi komponen penilaian"}
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
          <form.AppField name="assessmentTypeId">
            {(field) => (
              <field.Select
                label="Tipe penilaian"
                placeholder="Pilih tipe"
                values={assessmentTypes}
              />
            )}
          </form.AppField>

          <form.AppField name="name">
            {(field) => (
              <field.TextField
                label="Nama komponen"
                placeholder="mis. Kuis 1"
              />
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
