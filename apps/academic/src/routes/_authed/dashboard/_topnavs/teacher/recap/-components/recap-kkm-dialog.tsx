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

const KKM_SCHEMA = z.object({
  kkm: z
    .string()
    .min(1, "KKM wajib diisi")
    .refine((value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100;
    }, "KKM harus antara 0-100"),
});

type KkmFormValues = z.infer<typeof KKM_SCHEMA>;

type RecapKkmDialogProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  currentKkm: number | null;
  onClose: () => void;
  onSubmit: (kkm: number) => Promise<void> | void;
};

function parseKkmValue(value: string) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function RecapKkmDialog({
  isOpen,
  isSubmitting,
  currentKkm,
  onClose,
  onSubmit,
}: RecapKkmDialogProps) {
  const form = useAppForm({
    defaultValues: {
      kkm: currentKkm !== null ? String(currentKkm) : "",
    } as KkmFormValues,
    validators: { onChange: KKM_SCHEMA },
    onSubmit: async ({ value }) => {
      const parsed = parseKkmValue(value.kkm.trim());
      if (parsed === null) return;
      await onSubmit(parsed);
    },
  });

  React.useEffect(() => {
    if (!isOpen) {
      form.reset({ kkm: "" });
      return;
    }

    form.reset({ kkm: currentKkm !== null ? String(currentKkm) : "" });
  }, [currentKkm, form, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ubah KKM Kelas</DialogTitle>
          <DialogDescription>
            Masukkan nilai KKM baru untuk kelas yang dipilih.
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
          <form.AppField name="kkm">
            {(field) => (
              <field.TextField
                type="number"
                inputMode="numeric"
                min="0"
                max="100"
                placeholder="mis. 75"
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
