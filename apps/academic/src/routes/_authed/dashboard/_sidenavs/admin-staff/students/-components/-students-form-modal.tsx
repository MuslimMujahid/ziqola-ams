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
import type { ClassItem } from "@/lib/services/api/classes";

const STUDENT_ROLE = "STUDENT" as const;

const GENDER_OPTIONS: Array<{ label: string; value: Gender | "none" }> = [
  { label: "Tidak diisi", value: "none" },
  { label: "Laki-laki", value: "MALE" },
  { label: "Perempuan", value: "FEMALE" },
];

type StudentFormValues = {
  name: string;
  email: string;
  password: string;
  classId: string;
  gender?: Gender | "none";
  dateOfBirth?: string;
  phoneNumber?: string;
  nis?: string;
  nisn?: string;
};

type StudentsFormModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  classes: ClassItem[];
  defaultClassId: string;
  onClose: () => void;
  onSubmit: (values: StudentFormValues) => Promise<void> | void;
};

export function StudentsFormModal({
  isOpen,
  isSubmitting,
  classes,
  defaultClassId,
  onClose,
  onSubmit,
}: StudentsFormModalProps) {
  const formSchema = React.useMemo(() => {
    return z.object({
      name: z.string().trim().min(2, "Minimal 2 karakter").max(100),
      email: z.string().trim().email("Email tidak valid"),
      password: z.string().min(8, "Minimal 8 karakter"),
      classId: z.string().min(1, "Kelas wajib dipilih"),
      gender: z.enum(["MALE", "FEMALE", "none"]).optional(),
      dateOfBirth: z.string().optional(),
      phoneNumber: z.string().optional(),
      nis: z.string().optional(),
      nisn: z.string().optional(),
    });
  }, []);

  const form = useAppForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      classId: defaultClassId,
      gender: "none",
      dateOfBirth: "",
      phoneNumber: "",
      nis: "",
      nisn: "",
    } as StudentFormValues,
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
          <DialogTitle>Tambah siswa</DialogTitle>
          <DialogDescription>
            Buat akun siswa sekaligus identitas akademik.
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
                <field.TextField
                  label="Nama siswa"
                  placeholder="Nama lengkap"
                />
              )}
            </form.AppField>
            <form.AppField name="email">
              {(field) => (
                <field.TextField label="Email" placeholder="email@siswa.id" />
              )}
            </form.AppField>
          </div>

          <form.AppField name="classId">
            {(field) => (
              <field.Select
                label="Kelas"
                placeholder="Pilih kelas"
                values={classes.map((classItem) => ({
                  label: classItem.name,
                  value: classItem.id,
                }))}
              />
            )}
          </form.AppField>

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
            <form.AppField name="nis">
              {(field) => (
                <field.TextField label="NIS" placeholder="Nomor induk" />
              )}
            </form.AppField>
            <form.AppField name="nisn">
              {(field) => (
                <field.TextField label="NISN" placeholder="Nomor nasional" />
              )}
            </form.AppField>
          </div>

          <input type="hidden" name="role" value={STUDENT_ROLE} />

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
                    Simpan siswa
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
