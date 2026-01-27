import React from "react";
import { formOptions } from "@tanstack/react-form";
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

const ASSESSMENT_TYPE_SCHEMA = z.object({
  label: z.string().min(2, "Label wajib diisi"),
  description: z.string().optional(),
  order: z.string().optional(),
});

type AssessmentTypeEditorValues = z.infer<typeof ASSESSMENT_TYPE_SCHEMA>;

type AssessmentTypeDraft = {
  id?: string;
  key: string;
  label: string;
  description?: string | null;
  order?: number | null;
};

type AssessmentTypeEditorModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  type?: AssessmentTypeDraft | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: {
    key: string;
    label: string;
    description?: string;
    order?: number;
  }) => Promise<void> | void;
};

function slugifyLabel(label: string) {
  const slug = label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "assessment-type";
}

function parseOrder(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function resolveAssessmentTypeValues(
  draft?: AssessmentTypeDraft | null,
): AssessmentTypeEditorValues {
  return {
    label: draft?.label ?? "",
    description: draft?.description ?? "",
    order: draft?.order ? String(draft.order) : "",
  };
}

const assessmentTypeFormOptions = formOptions({
  defaultValues: resolveAssessmentTypeValues(null),
  validators: { onChange: ASSESSMENT_TYPE_SCHEMA },
});

export function AssessmentTypeEditorModal({
  isOpen,
  mode,
  type,
  isSubmitting,
  onClose,
  onSubmit,
}: AssessmentTypeEditorModalProps) {
  const form = useAppForm({
    ...assessmentTypeFormOptions,
    defaultValues: resolveAssessmentTypeValues(type),
    onSubmit: async ({ value }) => {
      const generatedKey = slugifyLabel(value.label);
      const key = mode === "edit" ? (type?.key ?? generatedKey) : generatedKey;

      await onSubmit({
        key,
        label: value.label.trim(),
        description: value.description?.trim() || undefined,
        order: parseOrder(value.order),
      });
    },
  });

  React.useEffect(() => {
    if (!isOpen) {
      form.reset(resolveAssessmentTypeValues(null));
      return;
    }

    form.reset(resolveAssessmentTypeValues(mode === "edit" ? type : null));
  }, [form, isOpen, mode, type]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Tambah tipe penilaian"
              : "Edit tipe penilaian"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Tambahkan kategori penilaian baru untuk sekolah Anda."
              : "Perbarui informasi tipe penilaian sesuai kebutuhan."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
          noValidate
        >
          <form.AppField name="label">
            {(fieldInput) => <fieldInput.TextField label="Label" />}
          </form.AppField>

          <form.AppField name="description">
            {(fieldInput) => <fieldInput.TextArea label="Deskripsi" rows={3} />}
          </form.AppField>

          {mode === "create" ? (
            <form.AppField name="order">
              {(fieldInput) => (
                <fieldInput.TextField label="Urutan" type="number" />
              )}
            </form.AppField>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Batal
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmittingForm]) => (
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
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
