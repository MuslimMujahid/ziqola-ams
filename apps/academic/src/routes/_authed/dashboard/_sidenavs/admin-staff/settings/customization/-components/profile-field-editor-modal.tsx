import React from "react";
import { formOptions, useStore } from "@tanstack/react-form";
import { z } from "zod";
import { CircleIcon, Loader2Icon, PlusIcon, XIcon } from "lucide-react";

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
import { Label } from "@repo/ui/label";
import { useAppForm, withForm } from "@/lib/utils/form";
import type {
  FieldType,
  FieldValidation,
  ProfileRole,
} from "@/lib/services/api/profile-custom-fields";

const FIELD_TYPES: Array<{ label: string; value: FieldType }> = [
  { label: "Teks", value: "text" },
  { label: "Angka", value: "number" },
  { label: "Tanggal", value: "date" },
  { label: "Ya/Tidak", value: "boolean" },
  { label: "Pilihan", value: "select" },
  { label: "Pilihan majemuk", value: "multiSelect" },
  { label: "File", value: "file" },
];

const EDITOR_SCHEMA = z.object({
  label: z.string().min(2, "Label wajib diisi"),
  type: z.string(),
  helpText: z.string().optional(),
  options: z.string().optional(),
  required: z.boolean().optional(),
  min: z.string().optional(),
  max: z.string().optional(),
  dateMin: z.string().optional(),
  dateMax: z.string().optional(),
  fileMaxSize: z.string().optional(),
  fileAllowedMimeTypes: z.string().optional(),
});

const OPTION_FIELD_TYPES = new Set<FieldType>(["select", "multiSelect"]);
const NUMBER_FIELD_TYPES = new Set<FieldType>(["number"]);
const DATE_FIELD_TYPES = new Set<FieldType>(["date"]);
const FILE_FIELD_TYPES = new Set<FieldType>(["file"]);

type FieldEditorValues = z.infer<typeof EDITOR_SCHEMA>;

type ProfileFieldEditorModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  role: ProfileRole;
  field?: ProfileFieldDraft | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: {
    key: string;
    label: string;
    type: FieldType;
    helpText?: string;
    options?: Array<{ label: string; value: string }>;
    validation?: FieldValidation;
  }) => Promise<void> | void;
};

type ProfileFieldDraft = {
  id?: string;
  key: string;
  label: string;
  type: FieldType;
  helpText?: string | null;
  options?: Array<{ label: string; value: string }> | null;
  validation?: FieldValidation | null;
};

function parseOptions(value?: string) {
  if (!value) return undefined;
  const entries = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (entries.length === 0) return undefined;

  return entries.map((item) => ({ label: item, value: item }));
}

function parseOptionLabels(value?: string) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumberValue(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function buildValidation(
  values: FieldEditorValues,
): FieldValidation | undefined {
  const validation: FieldValidation = {};

  if (values.required) {
    validation.required = true;
  }

  const min = parseNumberValue(values.min);
  const max = parseNumberValue(values.max);

  if (min !== undefined) validation.min = min;
  if (max !== undefined) validation.max = max;

  if (values.dateMin || values.dateMax) {
    validation.dateRange = {
      min: values.dateMin || undefined,
      max: values.dateMax || undefined,
    };
  }

  if (values.fileMaxSize || values.fileAllowedMimeTypes) {
    validation.fileConstraints = {
      maxSizeBytes: parseNumberValue(values.fileMaxSize),
      allowedMimeTypes: values.fileAllowedMimeTypes
        ? values.fileAllowedMimeTypes
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : undefined,
    };
  }

  if (Object.keys(validation).length === 0) {
    return undefined;
  }

  return validation;
}

function normalizeOptions(
  options?: Array<{ label: string; value: string }> | null,
) {
  if (!options || options.length === 0) return "";
  return options.map((option) => option.label).join(", ");
}

function slugifyLabel(label: string) {
  const slug = label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "field";
}

function resolveFieldEditorValues(
  field?: ProfileFieldDraft | null,
): FieldEditorValues {
  return {
    label: field?.label ?? "",
    type: field?.type ?? "text",
    helpText: field?.helpText ?? "",
    options: normalizeOptions(field?.options ?? undefined),
    required: Boolean(field?.validation?.required),
    min: field?.validation?.min ? String(field.validation.min) : "",
    max: field?.validation?.max ? String(field.validation.max) : "",
    dateMin: field?.validation?.dateRange?.min ?? "",
    dateMax: field?.validation?.dateRange?.max ?? "",
    fileMaxSize: field?.validation?.fileConstraints?.maxSizeBytes
      ? String(field.validation.fileConstraints.maxSizeBytes)
      : "",
    fileAllowedMimeTypes: field?.validation?.fileConstraints?.allowedMimeTypes
      ? field.validation.fileConstraints.allowedMimeTypes.join(", ")
      : "",
  } as FieldEditorValues;
}

const fieldEditorFormOptions = formOptions({
  defaultValues: resolveFieldEditorValues(null),
  validators: {
    onChange: EDITOR_SCHEMA,
  },
});

const FieldTypeSections = withForm({
  ...fieldEditorFormOptions,
  props: {
    type: "text" as FieldType,
  },
  render: function Render({ form, type }) {
    const [isAddingOption, setIsAddingOption] = React.useState(false);
    const [optionDraft, setOptionDraft] = React.useState("");
    const skipCommitOnBlurRef = React.useRef(false);
    const optionsValue = useStore(
      form.store,
      (state) => state.values.options ?? "",
    );
    const options = React.useMemo(
      () => parseOptionLabels(optionsValue),
      [optionsValue],
    );

    const handleCommitOption = React.useCallback(() => {
      const nextValue = optionDraft.trim();
      if (!nextValue) {
        setOptionDraft("");
        setIsAddingOption(false);
        return;
      }

      const nextOptions = options.includes(nextValue)
        ? options
        : [...options, nextValue];

      form.setFieldValue("options", nextOptions.join(", "));
      setOptionDraft("");
      setIsAddingOption(false);
    }, [form, optionDraft, options]);

    const handleCancelOption = React.useCallback(() => {
      setOptionDraft("");
      setIsAddingOption(false);
    }, []);

    const handleRemoveOption = React.useCallback(
      (optionToRemove: string) => {
        const nextOptions = options.filter(
          (option) => option !== optionToRemove,
        );
        form.setFieldValue("options", nextOptions.join(", "));
      },
      [form, options],
    );

    const handleSkipCommitOnBlur = React.useCallback(() => {
      skipCommitOnBlurRef.current = true;
    }, []);

    const handleInputBlur = React.useCallback(() => {
      if (skipCommitOnBlurRef.current) {
        skipCommitOnBlurRef.current = false;
        return;
      }

      handleCommitOption();
    }, [handleCommitOption]);

    return (
      <>
        {OPTION_FIELD_TYPES.has(type) && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-ink">
              Opsi pilihan
            </Label>
            {options.length === 0 ? (
              <p className="text-xs text-ink-muted">Belum ada opsi.</p>
            ) : (
              options.map((option) => (
                <div
                  key={option}
                  className="flex items-center gap-2 text-sm text-ink-strong"
                >
                  <CircleIcon
                    className="h-3.5 w-3.5 text-ink-muted"
                    aria-hidden="true"
                  />
                  <span>{option}</span>
                  <button
                    type="button"
                    className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-muted transition hover:bg-muted hover:text-ink-strong"
                    onClick={() => handleRemoveOption(option)}
                    onPointerDown={handleSkipCommitOnBlur}
                    aria-label={`Hapus opsi ${option}`}
                  >
                    <XIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))
            )}

            {isAddingOption ? (
              <div className="flex flex-wrap items-center gap-2">
                <CircleIcon
                  className="h-3.5 w-3.5 text-ink-muted"
                  aria-hidden="true"
                />
                <Input
                  value={optionDraft}
                  onChange={(event) => setOptionDraft(event.target.value)}
                  placeholder="Tulis opsi"
                  className="h-8 max-w-xs"
                  onBlur={handleInputBlur}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleCommitOption();
                    }
                    if (event.key === "Escape") {
                      event.preventDefault();
                      handleCancelOption();
                    }
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <button
                type="button"
                className="flex items-center gap-2 text-sm text-primary"
                onClick={() => setIsAddingOption(true)}
              >
                <PlusIcon className="h-4 w-4" aria-hidden="true" />
                Tambahkan opsi
              </button>
            )}
          </div>
        )}

        {NUMBER_FIELD_TYPES.has(type) && (
          <div className="grid gap-4 md:grid-cols-2">
            <form.AppField name="min">
              {(fieldInput) => (
                <fieldInput.TextField label="Minimum" type="number" />
              )}
            </form.AppField>

            <form.AppField name="max">
              {(fieldInput) => (
                <fieldInput.TextField label="Maksimum" type="number" />
              )}
            </form.AppField>
          </div>
        )}

        {DATE_FIELD_TYPES.has(type) && (
          <div className="grid gap-4 md:grid-cols-2">
            <form.AppField name="dateMin">
              {(fieldInput) => <fieldInput.DateField label="Tanggal minimum" />}
            </form.AppField>
            <form.AppField name="dateMax">
              {(fieldInput) => (
                <fieldInput.DateField label="Tanggal maksimum" />
              )}
            </form.AppField>
          </div>
        )}

        {FILE_FIELD_TYPES.has(type) && (
          <div className="grid gap-4 md:grid-cols-2">
            <form.AppField name="fileMaxSize">
              {(fieldInput) => (
                <fieldInput.TextField
                  label="Max ukuran file (bytes)"
                  type="number"
                />
              )}
            </form.AppField>
            <form.AppField name="fileAllowedMimeTypes">
              {(fieldInput) => (
                <fieldInput.TextField
                  label="MIME types (pisahkan koma)"
                  placeholder="application/pdf, text/csv"
                />
              )}
            </form.AppField>
          </div>
        )}
      </>
    );
  },
});

export function ProfileFieldEditorModal({
  isOpen,
  mode,
  role,
  field,
  isSubmitting,
  onClose,
  onSubmit,
}: ProfileFieldEditorModalProps) {
  const form = useAppForm({
    ...fieldEditorFormOptions,
    defaultValues: resolveFieldEditorValues(field),
    onSubmit: async ({ value }) => {
      const generatedKey = slugifyLabel(value.label);
      const key = mode === "edit" ? (field?.key ?? generatedKey) : generatedKey;

      await onSubmit({
        key,
        label: value.label.trim(),
        type: value.type as FieldType,
        helpText: value.helpText?.trim() || undefined,
        options: parseOptions(value.options),
        validation: buildValidation(value),
      });
    },
  });

  React.useEffect(() => {
    if (!isOpen) {
      form.reset(resolveFieldEditorValues(null));
      return;
    }

    form.reset(resolveFieldEditorValues(mode === "edit" ? field : null));
  }, [field, form, isOpen, mode]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tambah kolom" : "Edit kolom"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? `Tambahkan kolom baru untuk profil ${
                  role === "student" ? "siswa" : "guru"
                }.`
              : "Perbarui konfigurasi kolom sesuai kebutuhan."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
          noValidate
        >
          <form.AppField name="label">
            {(fieldInput) => <fieldInput.TextField label="Label" />}
          </form.AppField>

          <form.AppField name="type">
            {(fieldInput) => (
              <fieldInput.Select
                label="Tipe"
                values={FIELD_TYPES}
                placeholder="Pilih tipe"
              />
            )}
          </form.AppField>

          <form.AppField name="helpText">
            {(fieldInput) => <fieldInput.TextArea label="Deskripsi" rows={3} />}
          </form.AppField>

          <form.Subscribe selector={(state) => state.values.type}>
            {(selectedType) => (
              <FieldTypeSections
                form={form}
                type={(selectedType || "text") as FieldType}
              />
            )}
          </form.Subscribe>

          <DialogFooter className="items-center">
            <form.AppField name="required">
              {(fieldInput) => (
                <fieldInput.Switch label="Wajib diisi" className="mr-auto" />
              )}
            </form.AppField>
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
