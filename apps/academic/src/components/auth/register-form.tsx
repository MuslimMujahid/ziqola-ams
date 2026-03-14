"use client";

import React from "react";
import { z } from "zod";
import { useStore } from "@tanstack/react-form";
import { formOptions } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircleIcon, Loader2Icon, XCircleIcon } from "lucide-react";
import { useAppForm, withForm } from "@/lib/utils/form";
import { cn } from "@/lib/utils";
import { getDashboardRoute } from "@/lib/utils/auth";
import { useRegisterTenant } from "@/lib/services/api/tenant/use-register-tenant";
import { useCheckEmailAvailability } from "@/lib/services/api/tenant/use-check-email";
import { Button } from "@repo/ui/button";
import type { RegisterTenantVars } from "@/lib/services/api/tenant/tenant.types";

const EDUCATION_LEVEL_OPTIONS = [
  { label: "SD", value: "SD" },
  { label: "SMP", value: "SMP" },
  { label: "SMA", value: "SMA" },
  { label: "SMK", value: "SMK" },
  { label: "Lainnya", value: "OTHER" },
] as const;

const schoolSchema = z.object({
  schoolName: z
    .string()
    .trim()
    .min(2, "Nama sekolah wajib diisi")
    .max(160, "Nama sekolah terlalu panjang"),
  educationLevel: z.enum(["SD", "SMP", "SMA", "SMK", "OTHER"], {
    message: "Jenjang wajib diisi",
  }),
});

const adminSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Nama lengkap wajib diisi")
      .max(120, "Nama lengkap terlalu panjang"),
    email: z
      .string()
      .trim()
      .email("Format email tidak valid"),
    password: z
      .string()
      .min(8, "Minimal 8 karakter diperlakukan")
      .regex(/[0-9]/, "Harus mengandung minimal satu angka")
      .max(128, "Kata sandi terlalu panjang"),
    confirmPassword: z
      .string()
      .min(8, "Minimal 8 karakter diperlakukan")
      .max(128, "Konfirmasi terlalu panjang"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Kata sandi tidak cocok",
    path: ["confirmPassword"],
  });

const registerSchema = z.object({
  ...schoolSchema.shape,
  admin: adminSchema,
});

type SchoolInput = z.infer<typeof schoolSchema>;
type RegisterInput = z.infer<typeof registerSchema>;

const registerFormOptions = formOptions({
  defaultValues: {
    schoolName: "",
    educationLevel: "SD",
    admin: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  } as RegisterInput,
  validators: {
    onSubmit: registerSchema,
  },
});

type RegisterStep = "school" | "admin";

export function RegisterForm() {
  const navigate = useNavigate();
  const { mutateAsync: registerTenant } = useRegisterTenant();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [step, setStep] = React.useState<RegisterStep>("school");
  const form = useAppForm({
    ...registerFormOptions,
    onSubmit: async ({ value }) => {
      setServerError(null);

      try {
        const payload: RegisterTenantVars = {
          schoolName: value.schoolName,
          educationLevel: value.educationLevel,
          admin: {
            fullName: value.admin.fullName,
            email: value.admin.email,
            password: value.admin.password,
          },
        };
        const response = await registerTenant(payload);
        const role = response.user.role;
        navigate({ to: getDashboardRoute(role), replace: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message.toLowerCase().includes("school name or generated slug")) {
          setServerError("Nama sekolah atau slug sudah digunakan. Gunakan nama lain.");
          setStep("school");
          return;
        }

        if (message.length > 0) {
          setServerError("Registrasi gagal. Periksa kembali data Anda.");
          return;
        }

        setServerError("Terjadi kesalahan. Silakan coba lagi.");
      }
    },
  });

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const isNextDisabled = isSubmitting;

  const handleNext = React.useCallback(async () => {
    const fields: Array<keyof SchoolInput> = [
      "schoolName",
      "educationLevel",
    ];

    const results = await Promise.all(
      fields.map((field) => form.validateField(field, "submit")),
    );

    const hasErrors = results.some((errors) => errors.length > 0);

    if (!hasErrors) {
      setStep("admin");
    }
  }, [form]);

  const renderStepIndicator = () => {
    const steps: Array<{ key: RegisterStep; title: string }> = [
      {
        key: "school",
        title: "Profil Sekolah",
      },
      {
        key: "admin",
        title: "Admin Staf",
      },
    ];

    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-3">
          {steps.map((item, index) => {
            const isActive = step === item.key;
            const isCompleted = step === "admin" && item.key === "school";
            const isPending = !isActive && !isCompleted;
            const barActive = step === "admin";

            return (
              <React.Fragment key={item.key}>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold",
                      isCompleted || isActive
                        ? "bg-brand text-white"
                        : "bg-neutral-200 text-ink-muted",
                    )}
                    aria-current={isActive ? "step" : undefined}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        isPending ? "text-ink" : "text-ink-strong",
                      )}
                    >
                      {item.title}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 ? (
                  <div
                    className={cn(
                      "h-0.5 w-12 shrink-0 md:w-16",
                      barActive ? "bg-brand" : "bg-neutral-300",
                    )}
                    aria-hidden="true"
                  />
                ) : null}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {renderStepIndicator()}

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (step === "school") {
            void handleNext();
            return;
          }

          void form.handleSubmit();
        }}
        className="space-y-5"
      >
        {step === "school" ? (
          <SchoolStepForm
            form={form}
            isNextDisabled={isNextDisabled}
            isSubmitting={isSubmitting}
            onNext={handleNext}
          />
        ) : (
          <AdminStepForm
            form={form}
            serverError={serverError}
            isSubmitting={isSubmitting}
            onBack={() => setStep("school")}
          />
        )}
      </form>
    </div>
  );
}

const SchoolStepForm = withForm({
  ...registerFormOptions,
  props: {
    isNextDisabled: false,
    isSubmitting: false,
    onNext: async () => {},
  },
  render: function Render({
    form,
    isNextDisabled,
    isSubmitting,
    onNext,
  }) {
    return (
      <div className="space-y-5">
        <div className="space-y-4 rounded-lg py-4">

          <form.AppField name="schoolName">
            {(field) => (
              <field.TextField
                id="school-name"
                label="Nama Sekolah"
                placeholder="Nama resmi sekolah"
              />
            )}
          </form.AppField>

          <form.AppField name="educationLevel">
            {(field) => (
              <field.Select
                id="education-level"
                label="Jenjang"
                placeholder="Pilih jenjang"
                values={EDUCATION_LEVEL_OPTIONS.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
              />
            )}
          </form.AppField>
        </div>

        <Button
          type="button"
          className={cn(
            "w-full",
            isNextDisabled
              ? "cursor-not-allowed bg-brand/50"
              : "hover:bg-brand/90",
          )}
          disabled={isNextDisabled}
          onClick={onNext}
        >
          {isSubmitting ? (
            <Loader2Icon className="h-4 w-4 animate-spin" />
          ) : (
            "Lanjut ke Admin"
          )}
        </Button>
      </div>
    );
  },
});

const AdminStepForm = withForm({
  ...registerFormOptions,
  props: {
    serverError: null as string | null,
    isSubmitting: false,
    onBack: () => {},
  },
  render: function Render({ form, serverError, isSubmitting, onBack }) {
    const adminEmail = useStore(form.store, (state) => state.values.admin.email);
    const [debouncedEmail, setDebouncedEmail] = React.useState("");

    React.useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedEmail(adminEmail.trim());
      }, 400);

      return () => clearTimeout(timer);
    }, [adminEmail]);

    // Check if email is valid according to Zod first, so we don't send malformed requests
    const emailResult = adminSchema.shape.email.safeParse(debouncedEmail);
    const isEmailValid = emailResult.success;

    const { data: emailAvailability, isFetching: isCheckingEmail } = useCheckEmailAvailability(
      debouncedEmail,
      { enabled: isEmailValid },
    );

    const isEmailAvailable = emailAvailability?.available ?? true;
    const shouldShowEmailAvailability = isEmailValid && debouncedEmail.length > 0;

    const canSubmit = useStore(form.store, (state) => state.canSubmit);

    // Disable if submitting, or form has zod errors, or email is taken, or email check is running
    const isNextDisabled = isSubmitting || !canSubmit || (shouldShowEmailAvailability && !isEmailAvailable) || isCheckingEmail;

    return (
      <div className="space-y-5">
        {serverError ? (
          <div
            role="alert"
            className="rounded-md bg-error/10 px-4 py-3 text-sm text-error"
          >
            {serverError}
          </div>
        ) : null}

        <div className="space-y-4 rounded-lg py-4">
          <form.AppField name="admin.fullName">
            {(field) => (
              <div>
                <field.TextField
                  id="admin-full-name"
                  label="Nama Lengkap"
                  placeholder="Nama lengkap admin"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="mt-1 text-xs text-error">
                    {typeof field.state.meta.errors[0] === 'string' 
                      ? field.state.meta.errors[0] 
                      : (field.state.meta.errors[0] as any)?.message}
                  </p>
                )}
              </div>
            )}
          </form.AppField>

          <form.AppField name="admin.email">
            {(field) => (
              <div>
                <field.TextField
                  id="admin-email"
                  type="email"
                  label="Email"
                  placeholder="admin@sekolah.id"
                  className={cn((field.state.meta.errors.length > 0 || (shouldShowEmailAvailability && !isEmailAvailable)) && "border-error focus-visible:ring-error")}
                />
                {field.state.meta.errors.length > 0 ? (
                  <p className="mt-1 text-xs text-error">
                    {typeof field.state.meta.errors[0] === 'string' 
                      ? field.state.meta.errors[0] 
                      : (field.state.meta.errors[0] as any)?.message}
                  </p>
                ) : shouldShowEmailAvailability ? (
                  <div
                    className={cn(
                      "mt-1 flex items-center gap-1 text-xs",
                      isEmailAvailable ? "text-success" : "text-error",
                    )}
                  >
                    {isCheckingEmail ? (
                      <Loader2Icon className="h-3 w-3 animate-spin" />
                    ) : isEmailAvailable ? (
                      <CheckCircleIcon className="h-3 w-3" />
                    ) : (
                      <XCircleIcon className="h-3 w-3" />
                    )}
                    <span>
                      {isCheckingEmail
                        ? "Memeriksa email..."
                        : isEmailAvailable
                          ? "Email tersedia"
                          : "Email sudah terdaftar"}
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </form.AppField>

          <form.AppField name="admin.password">
            {(field) => (
              <div>
                <field.PasswordField
                  id="admin-password"
                  label="Kata Sandi"
                  placeholder="Minimal 8 karakter"
                  className={cn(field.state.meta.errors.length > 0 && "border-error focus-visible:ring-error")}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="mt-1 text-xs text-error">
                    {typeof field.state.meta.errors[0] === 'string' 
                      ? field.state.meta.errors[0] 
                      : (field.state.meta.errors[0] as any)?.message}
                  </p>
                )}
              </div>
            )}
          </form.AppField>

          <form.AppField name="admin.confirmPassword">
            {(field) => (
              <div>
                <field.PasswordField
                  id="admin-confirm-password"
                  label="Konfirmasi Kata Sandi"
                  placeholder="Ulangi kata sandi"
                  className={cn(field.state.meta.errors.length > 0 && "border-error focus-visible:ring-error")}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="mt-1 text-xs text-error">
                    {typeof field.state.meta.errors[0] === 'string' 
                      ? field.state.meta.errors[0] 
                      : (field.state.meta.errors[0] as any)?.message}
                  </p>
                )}
              </div>
            )}
          </form.AppField>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            className="text-ink-muted hover:text-ink"
            onClick={onBack}
          >
            Kembali
          </Button>

          <Button
            type="submit"
            className={cn(
              "flex-1",
              isNextDisabled
                ? "cursor-not-allowed bg-brand/50"
                : "hover:bg-brand/90",
            )}
            disabled={isNextDisabled}
          >
            {isSubmitting || isCheckingEmail ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              "Buat Akun"
            )}
          </Button>
        </div>

        <p className="text-xs text-ink-muted">
          Dengan mendaftar, Anda menyetujui syarat layanan dan kebijakan
          privasi.
        </p>
      </div>
    );
  },
});
