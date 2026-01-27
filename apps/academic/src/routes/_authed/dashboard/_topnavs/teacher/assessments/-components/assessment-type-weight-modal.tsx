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

const WEIGHT_SCHEMA = z.object({
  weight: z.string().min(1, "Bobot wajib diisi"),
});

type WeightFormValues = z.infer<typeof WEIGHT_SCHEMA>;

type AssessmentTypeWeightModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  assessmentTypeLabel: string;
  initialWeight?: number | null;
  onClose: () => void;
  onSubmit: (weight: number) => Promise<void> | void;
};

function parseWeight(value: string) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function AssessmentTypeWeightModal({
  isOpen,
  isSubmitting,
  assessmentTypeLabel,
  initialWeight,
  onClose,
  onSubmit,
}: AssessmentTypeWeightModalProps) {
  const form = useAppForm({
    defaultValues: {
      weight: initialWeight ? String(initialWeight) : "",
    } as WeightFormValues,
    validators: { onChange: WEIGHT_SCHEMA },
    onSubmit: async ({ value }) => {
      const parsed = parseWeight(value.weight.trim());
      if (parsed === null) return;
      await onSubmit(parsed);
    },
  });

  React.useEffect(() => {
    if (!isOpen) {
      form.reset({ weight: "" });
      return;
    }

    form.reset({ weight: initialWeight ? String(initialWeight) : "" });
  }, [form, initialWeight, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Atur bobot tipe penilaian</DialogTitle>
          <DialogDescription>
            Tetapkan bobot untuk tipe {assessmentTypeLabel}.
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
          <form.AppField name="weight">
            {(field) => (
              <field.TextField
                label="Bobot (%)"
                type="number"
                inputMode="numeric"
                min="1"
                max="100"
                placeholder="mis. 30"
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
