"use client";

import { z } from "zod";
import { AnimatePresence, motion } from "motion/react";
import { formOptions, useStore } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useAppForm, withForm } from "@/lib/utils/form";
import { useCreateAcademicOnboarding } from "@/lib/services/api/academic/use-create-academic-onboarding";
import { getDashboardRoute } from "@/lib/utils/auth";
import {
  StepContent,
  StepLabels,
  StepProvider,
  useStep,
  useStepContext,
} from "@/components/ui/stepper";
import { Button } from "@repo/ui/button";
import { RocketIcon } from "lucide-react";

const yearSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(4, "Nama tahun ajaran minimal 4 karakter")
      .max(50, "Nama tahun ajaran terlalu panjang"),
    startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
    endDate: z.string().min(1, "Tanggal selesai wajib diisi"),
  })
  .superRefine((value, ctx) => {
    if (value.startDate && value.endDate) {
      const start = new Date(value.startDate);
      const end = new Date(value.endDate);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return;
      }
      if (start > end) {
        ctx.addIssue({
          code: "custom",
          path: ["endDate"],
          message: "Tanggal selesai harus setelah tanggal mulai",
        });
      }
    }
  });

const periodSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Nama periode minimal 3 karakter")
      .max(50, "Nama periode terlalu panjang"),
    startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
    endDate: z.string().min(1, "Tanggal selesai wajib diisi"),
  })
  .superRefine((value, ctx) => {
    const start = new Date(value.startDate);
    const end = new Date(value.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return;
    }
    if (start > end) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "Tanggal selesai harus setelah tanggal mulai",
      });
    }
  });

const setupSchema = z
  .object({
    year: yearSchema,
    period: periodSchema,
  })
  .superRefine((value, ctx) => {
    const yearStart = new Date(value.year.startDate);
    const yearEnd = new Date(value.year.endDate);
    const periodStart = new Date(value.period.startDate);
    const periodEnd = new Date(value.period.endDate);
    if (
      !Number.isNaN(yearStart.getTime()) &&
      !Number.isNaN(yearEnd.getTime()) &&
      !Number.isNaN(periodStart.getTime()) &&
      !Number.isNaN(periodEnd.getTime())
    ) {
      if (periodStart < yearStart || periodEnd > yearEnd) {
        ctx.addIssue({
          code: "custom",
          message: "Periode akademik harus berada dalam rentang tahun ajaran",
          path: ["period", "startDate"],
        });
      }
    }
  });

type AcademicSetupInput = z.infer<typeof setupSchema>;

const setupFormOptions = formOptions({
  defaultValues: {
    year: {
      label: "",
      startDate: "",
      endDate: "",
    },
    period: {
      name: "Semester 1",
      startDate: "",
      endDate: "",
    },
  } as AcademicSetupInput,
  validators: { onChange: setupSchema },
});

const STEPS = [
  { key: "year", title: "Tahun ajaran" },
  { key: "period", title: "Periode akademik" },
] as const;

export function AcademicSetupWizard() {
  const navigate = useNavigate();

  const createOnboarding = useCreateAcademicOnboarding();
  const stepper = useStep({ steps: STEPS });

  const form = useAppForm({
    ...setupFormOptions,
    onSubmit: async ({ value }) => {
      await createOnboarding.mutateAsync({
        year: {
          label: value.year.label,
          startDate: value.year.startDate || undefined,
          endDate: value.year.endDate || undefined,
        },
        period: {
          name: value.period.name,
          startDate: value.period.startDate,
          endDate: value.period.endDate,
          makeActive: true,
          status: "DRAFT",
        },
      });
      navigate({ to: getDashboardRoute("ADMIN_STAFF"), replace: true });
    },
  });

  return (
    <StepProvider {...stepper}>
      <div className="space-y-4">
        <div className="flex w-full justify-center mb-8">
          <StepLabels />
        </div>

        <div className="rounded-2xl bg-surface-contrast p-5 shadow-none">
          <div className="flex items-center gap-2 text-base font-semibold text-ink-muted">
            <RocketIcon className="h-4 w-4" aria-hidden="true" />
            Mulai Tahun Ajaran Pertama Anda
          </div>

          <form
            className="mt-6 rounded-xl"
            onSubmit={(event) => {
              event.preventDefault();
              if (stepper.activeStep === 0) {
                stepper.goToNext();
                return;
              }

              void form.handleSubmit();
            }}
            noValidate
          >
            <AnimatePresence mode="wait">
              <StepContent stepKey="year">
                <motion.div
                  key="step-year"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="space-y-5"
                >
                  <YearStepForm form={form} />
                </motion.div>
              </StepContent>

              <StepContent stepKey="period">
                <motion.div
                  key="step-period"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="space-y-5"
                >
                  <PeriodStepForm form={form} />
                </motion.div>
              </StepContent>
            </AnimatePresence>
          </form>
        </div>
      </div>
    </StepProvider>
  );
}

const YearStepForm = withForm({
  ...setupFormOptions,
  render: function Render({ form }) {
    const isValid = useStore(form.store, (state) =>
      (["year.label", "year.startDate", "year.endDate"] as const).every(
        (field) => state.fieldMeta[field]?.isValid,
      ),
    );

    return (
      <div className="space-y-3">
        <form.AppField name="year.label">
          {(field) => (
            <field.TextField
              label="Nama tahun ajaran"
              placeholder="mis. 2025/2026"
            />
          )}
        </form.AppField>

        <div className="grid gap-3 sm:grid-cols-2">
          <form.AppField name="year.startDate">
            {(field) => (
              <field.TextField label="Mulai" type="date" placeholder="" />
            )}
          </form.AppField>
          <form.AppField name="year.endDate">
            {(field) => (
              <field.TextField label="Selesai" type="date" placeholder="" />
            )}
          </form.AppField>
        </div>

        <div className="flex items-center justify-end gap-3">
          <form.Subscribe selector={(state) => state.isPristine}>
            {(isPristine) => (
              <Button type="submit" disabled={!isValid || isPristine}>
                Lanjut
              </Button>
            )}
          </form.Subscribe>
        </div>
      </div>
    );
  },
});

const PeriodStepForm = withForm({
  ...setupFormOptions,
  render: function Render({ form }) {
    const stepCtx = useStepContext();

    return (
      <div className="space-y-5">
        <div className="space-y-3">
          <form.AppField name="period.name">
            {(field) => (
              <field.TextField
                label="Nama periode"
                placeholder="mis. Semester 1"
              />
            )}
          </form.AppField>

          <div className="grid gap-3 sm:grid-cols-2">
            <form.AppField name="period.startDate">
              {(field) => (
                <field.TextField label="Mulai" type="date" placeholder="" />
              )}
            </form.AppField>
            <form.AppField name="period.endDate">
              {(field) => (
                <field.TextField label="Selesai" type="date" placeholder="" />
              )}
            </form.AppField>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              className="text-ink-muted hover:text-ink"
              onClick={stepCtx.goToPrevious}
            >
              Kembali
            </Button>

            <form.AppForm>
              <form.SubmitButton label="Lanjut" />
            </form.AppForm>
          </div>
        </div>
      </div>
    );
  },
});
