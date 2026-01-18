import React from "react";
import { useStore } from "@tanstack/react-form";
import { z } from "zod";
import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from "lucide-react";

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
import type { AcademicPeriod } from "@/lib/services/api/academic";
import { ErrorMessages } from "../ui";

type CreateAcademicPeriodInput = {
  name: string;
  startDate: string;
  endDate: string;
  makeActive: boolean;
};

function hasDateOverlap(
  startDate: string,
  endDate: string,
  periods: AcademicPeriod[],
) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }

  return periods.some((period) => {
    if (!period.startDate || !period.endDate) {
      return false;
    }

    const periodStart = new Date(period.startDate);
    const periodEnd = new Date(period.endDate);

    if (
      Number.isNaN(periodStart.getTime()) ||
      Number.isNaN(periodEnd.getTime())
    ) {
      return false;
    }

    return start <= periodEnd && end >= periodStart;
  });
}

function buildCreteAcademicPeriodSchema(existingPeriods: AcademicPeriod[]) {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(3, "Nama periode minimal 3 karakter")
        .max(50, "Nama periode terlalu panjang"),
      startDate: z.string().min(1, { message: "Tanggal mulai wajib diisi" }),
      endDate: z.string().min(1, { message: "Tanggal selesai wajib diisi" }),
      makeActive: z.boolean(),
    })
    .superRefine((value, ctx) => {
      if (value.startDate && value.endDate) {
        const start = new Date(value.startDate);
        const end = new Date(value.endDate);
        if (
          !Number.isNaN(start.getTime()) &&
          !Number.isNaN(end.getTime()) &&
          start > end
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["endDate"],
            message: "Tanggal selesai harus setelah tanggal mulai",
          });
          return;
        }

        if (hasDateOverlap(value.startDate, value.endDate, existingPeriods)) {
          ctx.addIssue({
            code: "custom",
            path: ["startDate"],
            message: "Tanggal periode bertabrakan dengan periode akademik lain",
          });
          ctx.addIssue({
            code: "custom",
            path: ["endDate"],
            message: "Tanggal periode bertabrakan dengan periode akademik lain",
          });
        }
      }
    });
}

export type CreateAcademicPeriodModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: CreateAcademicPeriodInput) => Promise<void> | void;
  existingPeriods?: AcademicPeriod[];
};

export function CreateAcademicPeriodModal({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  existingPeriods = [],
}: CreateAcademicPeriodModalProps) {
  const createAcademicPeriodSchema = React.useMemo(
    () => buildCreteAcademicPeriodSchema(existingPeriods),
    [existingPeriods],
  );

  const form = useAppForm({
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
      makeActive: true,
    } as CreateAcademicPeriodInput,
    validators: {
      onChange: createAcademicPeriodSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  const [startDateValue, endDateValue] = useStore(form.store, (state) => [
    state.values.startDate,
    state.values.endDate,
  ]);

  const [startDateErrors, endDateErrors] = useStore(form.store, (state) => [
    state.fieldMeta.startDate?.errors,
    state.fieldMeta.endDate?.errors,
  ]);

  const showDatesStatus = startDateValue !== "" && endDateValue !== "";

  const isDatesValid =
    !(startDateErrors && startDateErrors.length > 0) &&
    !(endDateErrors && endDateErrors.length > 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah periode akademik</DialogTitle>
          <DialogDescription>
            Atur periode akademik untuk tahun ajaran aktif.
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
                label="Nama periode"
                placeholder="mis. Semester 1"
              />
            )}
          </form.AppField>

          <div className="grid gap-3 grid-cols-[1fr_1fr_auto] items-end">
            <form.AppField name="startDate">
              {(field) => <field.DateField label="Mulai" showErrors={false} />}
            </form.AppField>
            <form.AppField name="endDate">
              {(field) => (
                <field.DateField label="Selesai" showErrors={false} />
              )}
            </form.AppField>
            <div className="pb-2">
              {showDatesStatus ? (
                isDatesValid ? (
                  <CheckCircle2Icon
                    className="h-5 w-5 text-success"
                    aria-hidden="true"
                  />
                ) : (
                  <XCircleIcon
                    className="h-5 w-5 text-error"
                    aria-hidden="true"
                  />
                )
              ) : null}
            </div>
          </div>

          {(startDateErrors || endDateErrors) && (
            <ErrorMessages errors={startDateErrors ?? endDateErrors ?? []} />
          )}

          <form.AppField name="makeActive">
            {(field) => <field.Switch label="Jadikan periode aktif" />}
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
