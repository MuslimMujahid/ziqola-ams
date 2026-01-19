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
import type { StudentListItem } from "@/lib/services/api/students";

const EDIT_SCHEMA = z.object({
  nis: z.string().optional(),
  nisn: z.string().optional(),
});

type StudentEditValues = {
  nis?: string;
  nisn?: string;
};

type StudentsEditModalProps = {
  isOpen: boolean;
  student?: StudentListItem | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: StudentEditValues) => Promise<void> | void;
};

export function StudentsEditModal({
  isOpen,
  student,
  isSubmitting,
  onClose,
  onSubmit,
}: StudentsEditModalProps) {
  const form = useAppForm({
    defaultValues: {
      nis: student?.nis ?? "",
      nisn: student?.nisn ?? "",
    } as StudentEditValues,
    validators: {
      onChange: EDIT_SCHEMA,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit identitas siswa</DialogTitle>
          <DialogDescription>
            Perbarui nomor identitas akademik untuk {student?.user.name ?? "-"}.
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
          <form.AppField name="nis">
            {(field) => <field.TextField label="NIS" />}
          </form.AppField>

          <form.AppField name="nisn">
            {(field) => <field.TextField label="NISN" />}
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
                    Simpan perubahan
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
