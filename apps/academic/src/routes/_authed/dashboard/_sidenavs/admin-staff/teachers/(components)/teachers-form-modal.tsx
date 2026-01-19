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
import type { Gender } from "@/lib/services/api/auth";

const GENDER_OPTIONS: Array<{ label: string; value: Gender | "none" }> = [
  { label: "Tidak diisi", value: "none" },
  { label: "Laki-laki", value: "MALE" },
  { label: "Perempuan", value: "FEMALE" },
];

type TeacherFormValues = {
  name: string;
  email: string;
  password: string;
  gender?: Gender | "none";
  dateOfBirth?: string;
  phoneNumber?: string;
  nip?: string;
  nuptk?: string;
  hiredAt?: string;
};

type TeachersFormModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: TeacherFormValues) => Promise<void> | void;
};

export function TeachersFormModal({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: TeachersFormModalProps) {
  const formSchema = React.useMemo(() => {
    return z.object({
      name: z.string().trim().min(2, "Minimal 2 karakter").max(100),
      email: z.string().trim().email("Email tidak valid"),
      password: z.string().min(8, "Minimal 8 karakter"),
      gender: z.enum(["MALE", "FEMALE", "none"]).optional(),
      dateOfBirth: z.string().optional(),
      phoneNumber: z.string().optional(),
      nip: z.string().optional(),
      nuptk: z.string().optional(),
      hiredAt: z.string().optional(),
    });
  }, []);

  const form = useAppForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      gender: "none",
      dateOfBirth: "",
      phoneNumber: "",
      nip: "",
      nuptk: "",
      hiredAt: "",
    } as TeacherFormValues,
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tambah guru</DialogTitle>
          <DialogDescription>
            Buat akun guru sekaligus identitas kepegawaian.
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
          <div className="grid gap-4 sm:grid-cols-2">
            <form.AppField name="name">
              {(field) => (
                <field.TextField label="Nama guru" placeholder="Nama lengkap" />
              )}
            </form.AppField>
            <form.AppField name="email">
              {(field) => (
                <field.TextField label="Email" placeholder="email@guru.id" />
              )}
            </form.AppField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <form.AppField name="password">
              {(field) => (
                <field.PasswordField
                  label="Password"
                  placeholder="Minimal 8 karakter"
                />
              )}
            </form.AppField>
            <form.AppField name="phoneNumber">
              {(field) => (
                <field.TextField
                  label="Nomor telepon"
                  placeholder="08xxxxxxxxxx"
                />
              )}
            </form.AppField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <form.AppField name="gender">
              {(field) => (
                <field.Select
                  label="Jenis kelamin"
                  placeholder="Pilih jenis kelamin"
                  values={GENDER_OPTIONS}
                />
              )}
            </form.AppField>
            <form.AppField name="dateOfBirth">
              {(field) => <field.DateField label="Tanggal lahir" />}
            </form.AppField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <form.AppField name="nip">
              {(field) => <field.TextField label="NIP" />}
            </form.AppField>
            <form.AppField name="nuptk">
              {(field) => <field.TextField label="NUPTK" />}
            </form.AppField>
          </div>

          <form.AppField name="hiredAt">
            {(field) => <field.DateField label="Tanggal mulai bekerja" />}
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
                    Simpan guru
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
