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
import type { GroupType } from "@/lib/services/api/groups";

const GROUP_TYPE_OPTIONS: Array<{ label: string; value: GroupType }> = [
  { label: "Tingkat", value: "GRADE" },
  { label: "Jurusan", value: "STREAM" },
  { label: "Program", value: "PROGRAM" },
  { label: "Kustom", value: "CUSTOM" },
];

const GROUP_TYPE_VALUES = ["GRADE", "STREAM", "PROGRAM", "CUSTOM"] as const;

type GroupFormValues = {
  name: string;
  type: GroupType;
};

type GroupsFormModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  allowGrade?: boolean;
  isSubmitting: boolean;
  initialValues?: GroupFormValues;
  onClose: () => void;
  onSubmit: (values: GroupFormValues) => Promise<void> | void;
};

export function GroupsFormModal({
  isOpen,
  mode,
  allowGrade = false,
  isSubmitting,
  initialValues,
  onClose,
  onSubmit,
}: GroupsFormModalProps) {
  const groupSchema = React.useMemo(() => {
    return z
      .object({
        name: z.string().trim().min(2, "Minimal 2 karakter").max(60),
        type: z.enum(GROUP_TYPE_VALUES),
      })
      .superRefine((value, ctx) => {
        if (!allowGrade && value.type === "GRADE") {
          ctx.addIssue({
            code: "custom",
            path: ["type"],
            message: "Tingkat dikelola sistem",
          });
        }
      });
  }, [allowGrade]);

  const form = useAppForm({
    defaultValues: {
      name: initialValues?.name ?? "",
      type: initialValues?.type ?? "STREAM",
    } as GroupFormValues,
    validators: {
      onChange: groupSchema,
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
            {mode === "create"
              ? "Tambah rombongan belajar"
              : "Edit rombongan belajar"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Buat rombongan belajar untuk klasifikasi kelas"
              : "Perbarui detail rombongan belajar"}
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
                label="Nama rombongan belajar"
                placeholder="mis. IPA"
              />
            )}
          </form.AppField>

          <form.AppField name="type">
            {(field) => (
              <field.Select
                label="Tipe"
                placeholder="Pilih tipe"
                values={GROUP_TYPE_OPTIONS.filter(
                  (option) => allowGrade || option.value !== "GRADE",
                )}
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
