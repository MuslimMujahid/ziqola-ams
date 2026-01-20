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

const SUBJECT_SCHEMA = z.object({
  name: z.string().trim().min(2, "Minimal 2 karakter").max(60),
});

export type SubjectFormValues = z.infer<typeof SUBJECT_SCHEMA>;

type SubjectsFormModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  isSubmitting: boolean;
  initialValues?: SubjectFormValues;
  onClose: () => void;
  onSubmit: (values: SubjectFormValues) => Promise<void> | void;
};

export function SubjectsFormModal({
  isOpen,
  mode,
  isSubmitting,
  initialValues,
  onClose,
  onSubmit,
}: SubjectsFormModalProps) {
  const form = useAppForm({
    defaultValues: {
      name: initialValues?.name ?? "",
    } as SubjectFormValues,
    validators: {
      onChange: SUBJECT_SCHEMA,
    },
    onSubmit: async ({ value }) => {
      await onSubmit({ name: value.name.trim() });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Tambah mata pelajaran"
              : "Edit mata pelajaran"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Buat mata pelajaran baru"
              : "Perbarui nama mata pelajaran"}
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
              <field.TextField
                label="Nama mata pelajaran"
                placeholder="mis. Matematika"
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
