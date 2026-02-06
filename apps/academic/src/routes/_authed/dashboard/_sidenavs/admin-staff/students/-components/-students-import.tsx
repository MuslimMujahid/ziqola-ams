"use client";

import React from "react";
import { DownloadIcon, Loader2Icon, UploadCloudIcon } from "lucide-react";

import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { validateFile } from "@/lib/constants/file-validation";
import { createDownload } from "@/lib/utils/file";
import { useAppForm } from "@/lib/utils/form";
import type { ClassItem } from "@/lib/services/api/classes";
import type { TenantProfileField } from "@/lib/services/api/profile-custom-fields";
import {
  getStudentImportTemplate,
  useImportStudents,
  type ImportStudentsError,
  type ImportStudentsRow,
} from "@/lib/services/api/students";
import {
  PreviewTable,
  type HeaderColumn,
  resolveOptionValue,
  resolveOptionValues,
  RowFieldName,
} from "./-students-imports-preview";
import {
  buildEmptyCustomFieldValues,
  getCustomFieldId,
  getCustomFieldKey,
} from "@/lib/utils/profile-custom-fields";
import {
  buildImportSchema,
  type ImportFormRow,
  studentsImportFormOptions,
} from "../-utils/-student-input-preview-form";
import { parseCsv } from "@/lib/utils";
import { useStore } from "@tanstack/react-form";

type BaseFieldKey = "name" | "className" | "nisn" | "email";

type StudentsImportProps = {
  classes: ClassItem[];
  customFields: TenantProfileField[];
  academicYearId: string;
  academicPeriodId: string;
  onImportSuccess: (createdCount: number) => void;
};

const BASE_FIELDS: Array<{ key: BaseFieldKey; label: string }> = [
  { key: "name", label: "Nama" },
  { key: "className", label: "Kelas" },
  { key: "nisn", label: "NISN" },
  { key: "email", label: "Email" },
];

function buildHeaderColumns(
  customFields: TenantProfileField[],
): HeaderColumn[] {
  const baseColumns = BASE_FIELDS.map((field) => ({
    key: field.key,
    label: field.label,
    isCustom: false,
  }));
  const customColumns = customFields.map((field) => ({
    key: getCustomFieldKey(field.id),
    label: field.label,
    isCustom: true,
  }));
  return [...baseColumns, ...customColumns];
}

function normalizeCustomFieldValue(
  field: TenantProfileField | undefined,
  rawValue: string,
) {
  const trimmed = rawValue.trim();

  if (!field) {
    return trimmed;
  }

  if (field.type === "select") {
    return resolveOptionValue(field, trimmed) ?? "";
  }

  if (field.type === "multiSelect") {
    return resolveOptionValues(field, trimmed).join(", ");
  }

  return trimmed;
}

function buildRows(
  rawRows: string[][],
  startIndex: number,
  columns: HeaderColumn[],
  customFields: TenantProfileField[],
): ImportFormRow[] {
  const emptyCustomFields = buildEmptyCustomFieldValues(customFields);
  const customFieldMap = new Map(
    customFields.map((field) => [getCustomFieldKey(field.id), field]),
  );

  return rawRows
    .slice(startIndex)
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .map((row) => {
      const values: ImportFormRow = {
        name: "",
        className: "",
        nisn: "",
        email: "",
        customFields: { ...emptyCustomFields },
      };

      columns.forEach((column, columnIndex) => {
        const rawValue = row[columnIndex]?.trim() ?? "";

        if (column.isCustom) {
          const field = customFieldMap.get(column.key);
          const fieldId = field?.id ?? getCustomFieldId(column.key);
          if (!fieldId) {
            return;
          }
          values.customFields[fieldId] = normalizeCustomFieldValue(
            field,
            rawValue,
          );
          return;
        }

        values[column.key as BaseFieldKey] = rawValue;
      });

      return values;
    });
}

function toImportPayload(
  rows: ImportFormRow[],
  customFields: TenantProfileField[],
): ImportStudentsRow[] {
  return rows.map((row) => ({
    name: row.name?.trim() ?? "",
    className: row.className?.trim() ?? "",
    nisn: row.nisn?.trim() ?? "",
    email: row.email?.trim().toLowerCase() ?? "",
    customFields: customFields.reduce<Record<string, string>>((acc, field) => {
      const value = row.customFields[field.id]?.trim();
      if (value) {
        acc[field.id] = value;
      }
      return acc;
    }, {}),
  }));
}

function toErrorFields(
  errors: ImportStudentsError[],
  customFields: TenantProfileField[],
) {
  const customFieldMap = new Set(customFields.map((field) => field.id));
  const errorFields = {} as Record<RowFieldName | `rows[${number}]`, string>;

  errors.forEach((error) => {
    if (error.rowIndex === null) {
      return;
    }

    const rowIndex = error.rowIndex - 1;
    if (rowIndex < 0) {
      return;
    }

    const fieldName = customFieldMap.has(error.field)
      ? (`rows[${rowIndex}].customFields.${error.field}` as RowFieldName)
      : (`rows[${rowIndex}].${error.field}` as RowFieldName);

    if (!errorFields[fieldName]) {
      errorFields[`rows[${rowIndex}]`] = "Terdapat kesalahan pada baris ini.";
      errorFields[fieldName] = error.message;
    }
  });

  return errorFields;
}

export function StudentsImport({
  classes,
  customFields,
  academicYearId,
  academicPeriodId,
  onImportSuccess,
}: StudentsImportProps) {
  const sortedCustomFields = React.useMemo(() => {
    return [...customFields].sort((first, second) => {
      const orderA = first.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = second.order ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return (
        new Date(first.createdAt).getTime() -
        new Date(second.createdAt).getTime()
      );
    });
  }, [customFields]);

  const headerColumns = React.useMemo(
    () => buildHeaderColumns(sortedCustomFields),
    [sortedCustomFields],
  );

  const customFieldMap = React.useMemo(
    () =>
      new Map(
        sortedCustomFields.map((field) => [getCustomFieldKey(field.id), field]),
      ),
    [sortedCustomFields],
  );

  const classSet = React.useMemo(
    () => new Set(classes.map((classItem) => classItem.name)),
    [classes],
  );

  const formSchema = React.useMemo(
    () => buildImportSchema(sortedCustomFields, classSet),
    [sortedCustomFields, classSet],
  );

  const [fileError, setFileError] = React.useState<string | null>(null);
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [isParsing, setIsParsing] = React.useState(false);
  const [isPreviewMode, setIsPreviewMode] = React.useState(false);
  const submitAbortRef = React.useRef<AbortController | null>(null);

  const importMutation = useImportStudents();

  const form = useAppForm({
    ...studentsImportFormOptions,
    listeners: {
      onChange: ({ formApi, fieldApi }) => {
        // Reset row-level error (server errors) when any field changes
        const match = fieldApi.name.match(/rows\[(\d+)\]\.[^.]+/);
        if (match) {
          const rowIndex = Number(match[1]);
          formApi.setFieldMeta(`rows[${rowIndex}]`, (meta) => ({
            ...meta,
            errorMap: {},
          }));
        }
      },
      onChangeDebounceMs: 300,
    },
    validators: {
      onBlur: formSchema,
      onSubmitAsync: async ({ value, formApi }) => {
        const controller = new AbortController();
        submitAbortRef.current = controller;

        // Send import request
        const response = await importMutation.mutateAsync({
          data: {
            academicYearId,
            academicPeriodId,
            rows: toImportPayload(value.rows, sortedCustomFields),
          },
          signal: controller.signal,
        });

        // Returned errors will be populated to the form error state
        if (response.data.errors.length > 0) {
          return {
            form: "Invalid data",
            fields: toErrorFields(response.data.errors, sortedCustomFields),
          };
        }

        // Successful import
        onImportSuccess(response.data.createdCount);
        formApi.setFieldValue("rows", []);
        setIsPreviewMode(false);

        submitAbortRef.current = null;
        return null;
      },
    },
  });

  const handleDownloadTemplate = React.useCallback(async () => {
    setGeneralError(null);
    try {
      const blob = await getStudentImportTemplate();
      createDownload(blob, "template-import-siswa.csv");
    } catch (error) {
      setGeneralError(
        error instanceof Error ? error.message : "Gagal mengunduh template.",
      );
    }
  }, []);

  const handleFileChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      setGeneralError(null);
      const validationError = validateFile(file);
      const isCsv =
        file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv");

      if (validationError) {
        setFileError(validationError);
        form.setFieldValue("rows", []);
        return;
      }

      if (!isCsv) {
        setFileError("Gunakan file CSV untuk impor siswa.");
        form.setFieldValue("rows", []);
        return;
      }

      setFileError(null);
      setIsParsing(true);

      try {
        const text = await file.text();
        const parsed = parseCsv(text);
        const header = parsed[0]?.map((cell) => cell.trim()) ?? [];
        const expectedHeaders = headerColumns.map((column) => column.label);

        if (header.length < expectedHeaders.length) {
          setGeneralError("Header CSV tidak lengkap.");
          form.setFieldValue("rows", []);
          return;
        }

        const matchesHeader = expectedHeaders.every(
          (label, index) => header[index] === label,
        );

        if (!matchesHeader) {
          setGeneralError(`Header CSV harus: ${expectedHeaders.join(", ")}.`);
          form.setFieldValue("rows", []);
          return;
        }

        const builtRows = buildRows(
          parsed,
          3,
          headerColumns,
          sortedCustomFields,
        );

        if (builtRows.length === 0) {
          setGeneralError("Tidak ada data siswa di file CSV.");
          form.setFieldValue("rows", []);
          return;
        }

        if (builtRows.length > 300) {
          setGeneralError("Maksimal 300 baris per impor.");
          form.setFieldValue("rows", []);
          return;
        }

        form.setFieldValue("rows", builtRows);
        setIsPreviewMode(true);
      } catch (error) {
        setGeneralError(
          error instanceof Error ? error.message : "Gagal membaca file CSV.",
        );
        form.setFieldValue("rows", []);
      } finally {
        setIsParsing(false);
        event.target.value = "";
      }
    },
    [form, headerColumns, sortedCustomFields],
  );

  const handleCancelPreview = React.useCallback(() => {
    if (importMutation.isPending) {
      submitAbortRef.current?.abort();
    }
    submitAbortRef.current = null;
    form.setFieldValue("rows", []);
    setFileError(null);
    setGeneralError(null);
    setIsPreviewMode(false);
  }, [form, importMutation.isPending]);

  const [errors, errorMap] = useStore(form.store, (state) => [
    state.errors,
    state.errorMap,
  ]);
  console.log("form errors:", errors);
  console.log("form errorMap:", errorMap);

  return (
    <div className="space-y-4">
      {!isPreviewMode ? (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-lg p-4">
            <div>
              <h3 className="text-sm font-semibold text-ink-strong">
                Template
              </h3>
              <p className="text-xs text-ink-muted">
                Unduh template dan mulai mengisi data.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleDownloadTemplate}
            >
              <DownloadIcon className="h-4 w-4" aria-hidden="true" />
              Unduh
            </Button>
          </div>

          <div className="rounded-lg bg-surface-1 p-4">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg bg-surface-2 px-6 py-8 text-center text-sm text-ink-muted transition-colors hover:bg-surface-1">
              <UploadCloudIcon className="h-6 w-6" aria-hidden="true" />
              <span>Seret file CSV ke sini atau klik untuk memilih file.</span>
              <Input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            {fileError ? (
              <p className="mt-2 text-xs text-error" role="alert">
                {fileError}
              </p>
            ) : null}
          </div>
        </>
      ) : null}

      {isParsing ? (
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden="true" />
          Memproses file CSV...
        </div>
      ) : null}

      {generalError ? (
        <div
          className="rounded-lg bg-error/10 px-4 py-3 text-xs text-error"
          role="alert"
        >
          {generalError}
        </div>
      ) : null}

      {isPreviewMode ? (
        <>
          <PreviewTable
            form={form}
            headerColumns={headerColumns}
            classes={classes}
            customFieldMap={customFieldMap}
          />

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="text-error hover:text-error"
              onClick={handleCancelPreview}
            >
              Batal
            </Button>
            <form.Subscribe
              selector={(state) =>
                [
                  state.canSubmit,
                  state.isSubmitting,
                  state.values.rows.length,
                ] as const
              }
            >
              {([canSubmit, isSubmittingForm, rowCount]) => {
                const canSubmitForm = Boolean(canSubmit);
                const isSubmitting = Boolean(isSubmittingForm);
                const hasRows = rowCount > 0;

                return (
                  <Button
                    type="button"
                    onClick={() => {
                      if (!canSubmitForm || !hasRows) {
                        setGeneralError(
                          "Perbaiki semua data yang tidak valid terlebih dahulu.",
                        );
                        return;
                      }
                      form.handleSubmit();
                    }}
                    disabled={
                      !canSubmitForm ||
                      isSubmitting ||
                      importMutation.isPending ||
                      !hasRows
                    }
                    className="gap-2"
                  >
                    {importMutation.isPending || isSubmitting ? (
                      <Loader2Icon
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : null}
                    Impor siswa
                  </Button>
                );
              }}
            </form.Subscribe>
          </div>
        </>
      ) : null}
    </div>
  );
}
