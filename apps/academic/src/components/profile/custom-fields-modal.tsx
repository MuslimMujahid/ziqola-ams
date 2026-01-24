import React from "react";
import { Loader2Icon, PaperclipIcon, XIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { useAppForm } from "@/lib/utils/form";
import { useUploadFiles } from "@/lib/services/api/uploads/use-upload-files";
import {
  type ProfileRole,
  type TenantProfileField,
  useProfileFieldsValues,
  useUpsertProfileValues,
} from "@/lib/services/api/profile-custom-fields";

export type CustomFieldsModalProps = {
  isOpen: boolean;
  tenantId: string;
  role: ProfileRole;
  profileId: string;
  profileName: string;
  onClose: () => void;
};

type FormValues = Record<string, string | boolean>;

type FileState = {
  file: File | null;
  clear: boolean;
};

function formatDateValue(value?: string | null) {
  if (!value) return "";
  return value.split("T")[0] ?? "";
}

function resolveDefaultValue(
  field: TenantProfileField,
  value?: {
    valueText?: string | null;
    valueNumber?: number | null;
    valueDate?: string | null;
    valueBoolean?: boolean | null;
    valueSelect?: string | null;
    valueMultiSelect?: string[] | null;
  },
) {
  switch (field.type) {
    case "text":
      return value?.valueText ?? "";
    case "number":
      return value?.valueNumber !== null && value?.valueNumber !== undefined
        ? String(value.valueNumber)
        : "";
    case "date":
      return formatDateValue(value?.valueDate ?? "");
    case "boolean":
      return value?.valueBoolean ?? false;
    case "select":
      return value?.valueSelect ?? "";
    case "multiSelect":
      return value?.valueMultiSelect?.join(", ") ?? "";
    default:
      return "";
  }
}

function isFileField(field: TenantProfileField) {
  return field.type === "file";
}

function parseMultiSelect(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildValuePayload(field: TenantProfileField, value: string | boolean) {
  switch (field.type) {
    case "text":
      return { valueText: String(value).trim() };
    case "number": {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? {} : { valueNumber: parsed };
    }
    case "date":
      return value ? { valueDate: String(value) } : {};
    case "boolean":
      return { valueBoolean: Boolean(value) };
    case "select":
      return value ? { valueSelect: String(value) } : {};
    case "multiSelect":
      return { valueMultiSelect: parseMultiSelect(String(value)) };
    default:
      return {};
  }
}

export function CustomFieldsModal({
  isOpen,
  tenantId,
  role,
  profileId,
  profileName,
  onClose,
}: CustomFieldsModalProps) {
  const fieldsQuery = useProfileFieldsValues(tenantId, role, profileId, {
    enabled: isOpen && Boolean(tenantId),
  });
  const upsertMutation = useUpsertProfileValues();
  const uploadFiles = useUploadFiles();

  const fields = fieldsQuery.data?.data.fields ?? [];
  const values = fieldsQuery.data?.data.values ?? [];

  const valueMap = React.useMemo(() => {
    const map = new Map(values.map((value) => [value.fieldId, value] as const));
    return map;
  }, [values]);

  const defaultValues = React.useMemo<FormValues>(() => {
    const next: FormValues = {};
    for (const field of fields) {
      if (isFileField(field)) {
        continue;
      }
      const value = valueMap.get(field.id);
      next[field.id] = resolveDefaultValue(field, value);
    }
    return next;
  }, [fields, valueMap]);

  const [fileState, setFileState] = React.useState<Record<string, FileState>>(
    {},
  );

  React.useEffect(() => {
    const next: Record<string, FileState> = {};
    for (const field of fields) {
      if (isFileField(field)) {
        next[field.id] = { file: null, clear: false };
      }
    }
    setFileState(next);
  }, [fields]);

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const payload = [] as Array<{
        fieldId: string;
        valueText?: string;
        valueNumber?: number;
        valueDate?: string;
        valueBoolean?: boolean;
        valueSelect?: string;
        valueMultiSelect?: string[];
        valueFile?: {
          fileKey: string;
          fileName: string;
          mimeType: string;
          sizeBytes: number;
        };
      }>;

      for (const field of fields) {
        const existingValue = valueMap.get(field.id);

        if (isFileField(field)) {
          const fileStateItem = fileState[field.id];

          if (fileStateItem?.clear) {
            payload.push({ fieldId: field.id, valueFile: undefined });
            continue;
          }

          if (fileStateItem?.file) {
            const uploadResult = await uploadFiles.uploadFiles([
              fileStateItem.file,
            ]);
            const meta = uploadResult[0];
            if (meta) {
              payload.push({
                fieldId: field.id,
                valueFile: {
                  fileKey: meta.fileKey,
                  fileName: meta.fileName,
                  mimeType: meta.mimeType,
                  sizeBytes: meta.size,
                },
              });
            }
            continue;
          }

          if (existingValue?.valueFile) {
            payload.push({
              fieldId: field.id,
              valueFile: {
                fileKey: existingValue.valueFile.fileKey,
                fileName: existingValue.valueFile.fileName,
                mimeType: existingValue.valueFile.mimeType,
                sizeBytes: existingValue.valueFile.sizeBytes,
              },
            });
          }

          continue;
        }

        const rawValue = value[field.id];
        const mapped = buildValuePayload(field, rawValue ?? "");
        payload.push({ fieldId: field.id, ...mapped });
      }

      await upsertMutation.mutateAsync({
        tenantId,
        role,
        profileId,
        values: payload,
      });

      onClose();
    },
  });

  React.useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Data tambahan</DialogTitle>
          <DialogDescription>
            Lengkapi data tambahan untuk {profileName}.
          </DialogDescription>
        </DialogHeader>

        {fieldsQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden="true" />
            Memuat field tambahan...
          </div>
        ) : fields.length === 0 ? (
          <div className="rounded-lg bg-surface-1 p-4 text-sm text-ink-muted">
            Belum ada field tambahan yang aktif.
          </div>
        ) : (
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              form.handleSubmit();
            }}
            noValidate
          >
            {fields.map((field) => {
              if (field.type === "file") {
                const existingFile = valueMap.get(field.id)?.valueFile;
                const fileStateItem = fileState[field.id];

                return (
                  <div key={field.id} className="space-y-2">
                    <label className="text-sm font-medium text-ink">
                      {field.label}
                    </label>
                    {field.helpText ? (
                      <p className="text-xs text-ink-muted">{field.helpText}</p>
                    ) : null}
                    <div className="rounded-lg bg-surface-1 p-4 text-sm">
                      {existingFile ? (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <PaperclipIcon
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                            <span>{existingFile.fileName}</span>
                          </div>
                          {existingFile.url ? (
                            <a
                              href={existingFile.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary"
                            >
                              Unduh
                            </a>
                          ) : null}
                        </div>
                      ) : (
                        <p className="text-xs text-ink-muted">
                          Belum ada file.
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Input
                          type="file"
                          onChange={(event) => {
                            const file = event.target.files?.[0] ?? null;
                            setFileState((prev) => ({
                              ...prev,
                              [field.id]: { file, clear: false },
                            }));
                          }}
                        />
                        {existingFile ? (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() =>
                              setFileState((prev) => ({
                                ...prev,
                                [field.id]: { file: null, clear: true },
                              }))
                            }
                          >
                            <XIcon className="h-4 w-4" aria-hidden="true" />
                            Hapus file
                          </Button>
                        ) : null}
                      </div>
                      {fileStateItem?.file ? (
                        <p className="mt-2 text-xs text-ink-muted">
                          File baru: {fileStateItem.file.name}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              }

              if (field.type === "boolean") {
                return (
                  <form.AppField key={field.id} name={field.id}>
                    {(fieldInput) => <fieldInput.Switch label={field.label} />}
                  </form.AppField>
                );
              }

              if (field.type === "select") {
                return (
                  <form.AppField key={field.id} name={field.id}>
                    {(fieldInput) => (
                      <fieldInput.Select
                        label={field.label}
                        values={(field.options ?? []).map((option) => ({
                          label: option.label,
                          value: option.value,
                        }))}
                        placeholder="Pilih opsi"
                      />
                    )}
                  </form.AppField>
                );
              }

              return (
                <form.AppField key={field.id} name={field.id}>
                  {(fieldInput) =>
                    field.type === "multiSelect" ? (
                      <fieldInput.TextArea label={field.label} rows={4} />
                    ) : field.type === "date" ? (
                      <fieldInput.DateField label={field.label} />
                    ) : (
                      <fieldInput.TextField
                        label={field.label}
                        inputMode={
                          field.type === "number" ? "numeric" : undefined
                        }
                        type={field.type === "number" ? "number" : "text"}
                      />
                    )
                  }
                </form.AppField>
              );
            })}

            <DialogFooter>
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <>
                    <Button type="button" variant="ghost" onClick={onClose}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={!canSubmit || isSubmitting}>
                      {isSubmitting && (
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
        )}
      </DialogContent>
    </Dialog>
  );
}
