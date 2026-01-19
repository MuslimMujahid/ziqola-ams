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
import type { TeacherProfile } from "@/lib/services/api/teachers";

const EDIT_SCHEMA = z.object({
  nip: z.string().optional(),
  nuptk: z.string().optional(),
  hiredAt: z.string().optional(),
});

type TeacherEditValues = {
  nip?: string;
  nuptk?: string;
  hiredAt?: string;
};

type TeachersEditModalProps = {
  isOpen: boolean;
  teacher?: TeacherProfile | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: TeacherEditValues) => Promise<void> | void;
};

export function TeachersEditModal({
  isOpen,
  teacher,
  isSubmitting,
  onClose,
  onSubmit,
}: TeachersEditModalProps) {
  const form = useAppForm({
    defaultValues: {
      nip: teacher?.nip ?? "",
      nuptk: teacher?.nuptk ?? "",
      hiredAt: teacher?.hiredAt ?? "",
    } as TeacherEditValues,
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
          <DialogTitle>Edit identitas guru</DialogTitle>
          <DialogDescription>
            Perbarui data kepegawaian untuk {teacher?.user.name ?? "-"}.
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
          <form.AppField name="nip">
            {(field) => <field.TextField label="NIP" />}
          </form.AppField>

          <form.AppField name="nuptk">
            {(field) => <field.TextField label="NUPTK" />}
          </form.AppField>

          <form.AppField name="hiredAt">
            {(field) => <field.DateField label="Tanggal mulai bekerja" />}
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
