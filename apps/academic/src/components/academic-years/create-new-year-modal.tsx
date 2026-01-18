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
import { useAppForm } from "@/lib/utils/form";
import { Button } from "@repo/ui/button";
import type { AcademicYear } from "@/lib/services/api/academic";
import { ErrorMessages } from "../ui";

type CreateNewYearInput = {
  label: string;
  startDate: string;
  endDate: string;
  makeActive: boolean;
};

export type CreateNewYearModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: CreateNewYearInput) => Promise<void> | void;
  existingYears?: AcademicYear[];
};

function hasYearOverlap(
  startDate: string,
  endDate: string,
  years: AcademicYear[],
) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }

  return years.some((year) => {
    if (!year.startDate || !year.endDate) {
      return false;
    }

    const yearStart = new Date(year.startDate);
    const yearEnd = new Date(year.endDate);

    if (Number.isNaN(yearStart.getTime()) || Number.isNaN(yearEnd.getTime())) {
      return false;
    }

    return start <= yearEnd && end >= yearStart;
  });
}

const buildCreateNewYearSchema = (existingYears: AcademicYear[]) => {
  return z
    .object({
      label: z
        .string()
        .trim()
        .min(4, "Minimal 4 karakter")
        .max(50, "Maksimal 50 karakter"),
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

        if (hasYearOverlap(value.startDate, value.endDate, existingYears)) {
          ctx.addIssue({
            code: "custom",
            path: ["startDate"],
            message: "Tanggal tahun ajaran bertabrakan dengan tahun lain",
          });
          ctx.addIssue({
            code: "custom",
            path: ["endDate"],
            message: "Tanggal tahun ajaran bertabrakan dengan tahun lain",
          });
        }
      }
    });
};

export function CreateNewYearModal({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  existingYears = [],
}: CreateNewYearModalProps) {
  const createNewYearSchema = React.useMemo(
    () => buildCreateNewYearSchema(existingYears),
    [existingYears],
  );

  const form = useAppForm({
    defaultValues: {
      label: "",
      startDate: "",
      endDate: "",
      makeActive: true,
    } as CreateNewYearInput,
    validators: {
      onChange: createNewYearSchema,
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
          <DialogTitle>Buat tahun ajaran baru</DialogTitle>
          <DialogDescription>Masukkan detail tahun ajaran</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            form.handleSubmit();
          }}
          noValidate
        >
          <form.AppField name="label">
            {(field) => (
              <field.TextField
                label="Nama tahun ajaran"
                placeholder="mis. 2025/2026"
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

          <div className="pt-2">
            <form.AppField name="makeActive">
              {(field) => <field.Switch label="Jadikan tahun ajaran aktif" />}
            </form.AppField>
          </div>

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
                    Buat
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
