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
import { useTeacherProfiles } from "@/lib/services/api/teachers";
import {
  type ProfileFieldValue,
  useTenantProfileFields,
} from "@/lib/services/api/profile-custom-fields";
import { formatProfileValue } from "@/lib/utils/profile-custom-fields";
import type { ClassItem } from "@/lib/services/api/classes";

const assignSchema = z.object({
  teacherProfileId: z.string().min(1, "Guru wajib dipilih"),
});

type AssignHomeroomValues = {
  teacherProfileId: string;
};

type AssignHomeroomModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  classItem: ClassItem | null;
  onClose: () => void;
  onSubmit: (values: AssignHomeroomValues) => Promise<void> | void;
};

export function AssignHomeroomModal({
  isOpen,
  isSubmitting,
  classItem,
  onClose,
  onSubmit,
}: AssignHomeroomModalProps) {
  const tenantId = classItem?.tenantId ?? "";
  const teacherProfilesQuery = useTeacherProfiles(
    {
      offset: 0,
      limit: 50,
      includeCustomFields: true,
    },
    { enabled: isOpen },
  );

  const tenantFieldsQuery = useTenantProfileFields(tenantId, "teacher", {
    enabled: isOpen && Boolean(tenantId),
  });
  const tenantFields = tenantFieldsQuery.data?.data ?? [];

  const form = useAppForm({
    defaultValues: {
      teacherProfileId: "",
    } as AssignHomeroomValues,
    validators: {
      onChange: assignSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  const resolveIdentifier = (
    values: ProfileFieldValue[] | undefined,
    key: string,
  ) => {
    const field = tenantFields.find((item) => item.key === key);
    if (!field) return null;
    const valueMap = new Map(
      (values ?? []).map((value) => [value.fieldId, value] as const),
    );
    const formatted = formatProfileValue(field, valueMap.get(field.id));
    return formatted === "-" ? null : formatted;
  };

  const teacherOptions = (teacherProfilesQuery.data?.data ?? []).map(
    (profile) => {
      const helper =
        resolveIdentifier(profile.customFieldValues, "nip") ??
        resolveIdentifier(profile.customFieldValues, "nuptk") ??
        profile.user.email;

      return {
        label: profile.user.name,
        value: profile.id,
        helper,
      };
    },
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tetapkan wali kelas</DialogTitle>
          <DialogDescription>
            {classItem
              ? `Pilih guru untuk ${classItem.name}.`
              : "Pilih guru untuk wali kelas."}
          </DialogDescription>
        </DialogHeader>

        {classItem?.homeroomTeacher ? (
          <div className="rounded-lg bg-surface-1 px-3 py-2 text-sm text-ink">
            Wali kelas saat ini: {classItem.homeroomTeacher.name}
          </div>
        ) : null}

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            form.handleSubmit();
          }}
          noValidate
        >
          <form.AppField name="teacherProfileId">
            {(field) => (
              <field.Select
                label="Guru"
                placeholder={
                  teacherProfilesQuery.isLoading
                    ? "Memuat daftar guru..."
                    : "Pilih guru"
                }
                values={teacherOptions.map((option) => ({
                  label: option.helper
                    ? `${option.label} · ${option.helper}`
                    : option.label,
                  value: option.value,
                }))}
              />
            )}
          </form.AppField>

          {teacherOptions.length === 0 && !teacherProfilesQuery.isLoading ? (
            <div className="rounded-lg bg-surface-1 px-3 py-2 text-sm text-ink-muted">
              Tidak ada guru yang ditemukan.
            </div>
          ) : null}

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
