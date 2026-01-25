"use client";

import React from "react";
import { z } from "zod";
import { formOptions } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useAppForm } from "@/lib/utils/form";
import { useAcceptInvite } from "@/lib/services/api/auth";
import { Button } from "@repo/ui/button";

const acceptInviteSchema = z
  .object({
    password: z
      .string()
      .min(8, "Kata sandi minimal 8 karakter")
      .max(128, "Kata sandi terlalu panjang"),
    confirmPassword: z
      .string()
      .min(8, "Konfirmasi minimal 8 karakter")
      .max(128, "Konfirmasi terlalu panjang"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi harus sama",
    path: ["confirmPassword"],
  });

type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

const acceptInviteFormOptions = formOptions({
  defaultValues: {
    password: "",
    confirmPassword: "",
  } as AcceptInviteInput,
  validators: {
    onSubmit: acceptInviteSchema,
  },
});

type AcceptInviteFormProps = {
  token?: string;
};

export function AcceptInviteForm({ token }: AcceptInviteFormProps) {
  const navigate = useNavigate();
  const { mutateAsync: acceptInvite } = useAcceptInvite();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const form = useAppForm({
    ...acceptInviteFormOptions,
    onSubmit: async ({ value }) => {
      if (!token) {
        setServerError("Token undangan tidak ditemukan.");
        return;
      }

      try {
        await acceptInvite({ token, password: value.password });
        setServerError(null);
        setIsSuccess(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : "";

        if (message.toLowerCase().includes("expired")) {
          setServerError("Link undangan sudah kedaluwarsa.");
          return;
        }

        if (message.toLowerCase().includes("invalid")) {
          setServerError("Token undangan tidak valid.");
          return;
        }

        if (message.length > 0) {
          setServerError("Aktivasi gagal. Silakan coba lagi.");
          return;
        }

        setServerError("Terjadi kesalahan. Silakan coba lagi.");
      }
    },
  });

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-success/10 px-4 py-3 text-sm text-success">
          Akun berhasil diaktifkan. Silakan masuk menggunakan email Anda.
        </div>
        <Button
          type="button"
          onClick={() => navigate({ to: "/auth/login", replace: true })}
        >
          Masuk ke akun
        </Button>
      </div>
    );
  }

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
          className="rounded-md bg-error/10 px-4 py-3 text-sm text-error"
        >
          {serverError}
        </div>
      ) : null}

      <form.AppField name="password">
        {(field) => (
          <field.PasswordField
            id="password"
            label="Kata Sandi"
            placeholder="Minimal 8 karakter"
          />
        )}
      </form.AppField>

      <form.AppField name="confirmPassword">
        {(field) => (
          <field.PasswordField
            id="confirm-password"
            label="Konfirmasi Kata Sandi"
            placeholder="Ulangi kata sandi"
          />
        )}
      </form.AppField>

      <div className="text-xs text-ink-muted">
        Gunakan kata sandi yang kuat dengan minimal 8 karakter.
      </div>

      <form.AppForm>
        <form.SubmitButton label="Aktifkan Akun" />
      </form.AppForm>
    </form>
  );
}
