"use client";

import React from "react";
import { z } from "zod";
import { useNavigate } from "@tanstack/react-router";
import { useAppForm } from "@/lib/utils/form";
import { useLogin } from "@/lib/services/api/auth/use-login";
import { getDashboardRoute } from "@/lib/utils/auth";
import { formOptions } from "@tanstack/react-form";

const ROLE_VALUES = ["PRINCIPAL", "ADMIN_STAFF", "TEACHER", "STUDENT"] as const;

const ROLE_OPTIONS = [
  { label: "Kepala Sekolah", value: "PRINCIPAL" },
  { label: "Staf Administrasi", value: "ADMIN_STAFF" },
  { label: "Guru", value: "TEACHER" },
  { label: "Siswa", value: "STUDENT" },
] as const;

const loginSchema = z.object({
  tenantSlug: z.string().min(1, "Kode sekolah tidak boleh kosong"),
  role: z.enum(ROLE_VALUES, { message: "Peran tidak boleh kosong" }),
  email: z.email("Email tidak valid"),
  password: z.string().min(1, "Kata sandi tidak boleh kosong"),
});

type LoginInput = z.infer<typeof loginSchema>;

const loginFormOptions = formOptions({
  defaultValues: {
    tenantSlug: "",
    role: "PRINCIPAL",
    email: "",
    password: "",
  } as LoginInput,
  validators: {
    onSubmit: loginSchema,
  },
});

export function LoginForm() {
  const navigate = useNavigate();
  const { mutateAsync: login } = useLogin();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useAppForm({
    ...loginFormOptions,
    onSubmit: async ({ value }) => {
      try {
        const response = await login({
          tenantSlug: value.tenantSlug,
          role: value.role,
          email: value.email,
          password: value.password,
        });
        const role = response.user.role;
        navigate({ to: getDashboardRoute(role), replace: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : "";

        if (message.includes("Tenant not found")) {
          setServerError("Gagal masuk. Kode sekolah tidak ditemukan.");
          return;
        }

        if (message.length > 0) {
          setServerError("Gagal masuk. Email atau kata sandi salah.");
          return;
        }

        setServerError("Terjadi kesalahan. Silakan coba lagi.");
      }
    },
  });

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      {serverError ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {serverError}
        </div>
      ) : null}

      <div className="space-y-2">
        <form.AppField name="tenantSlug">
          {(field) => (
            <field.TextField
              id="tenant-slug"
              label="Kode Sekolah"
              placeholder="contoh: sma-1-bdg"
            />
          )}
        </form.AppField>
        <p className="text-xs text-slate-500">
          Gunakan kode sekolah yang diberikan admin.
        </p>
      </div>

      <div className="space-y-2">
        <form.AppField name="role">
          {(field) => (
            <field.Select
              label="Peran"
              placeholder="Pilih peran"
              values={ROLE_OPTIONS.map((role) => ({
                label: role.label,
                value: role.value,
              }))}
            />
          )}
        </form.AppField>
        <p className="text-xs text-slate-500">
          Pilih peran sesuai akun Anda di sekolah.
        </p>
      </div>

      <form.AppField name="email">
        {(field) => (
          <field.TextField
            id="email"
            type="email"
            label="Email"
            placeholder="nama@sekolah.id"
          />
        )}
      </form.AppField>

      <form.AppField name="password">
        {(field) => (
          <field.TextField
            id="password"
            type="password"
            label="Kata Sandi"
            placeholder="Masukkan kata sandi"
          />
        )}
      </form.AppField>

      <form.AppForm>
        <form.SubmitButton label="Masuk" />
      </form.AppForm>
    </form>
  );
}
