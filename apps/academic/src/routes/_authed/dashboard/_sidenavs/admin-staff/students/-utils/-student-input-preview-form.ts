import { TenantProfileField } from "@/lib/services/api/profile-custom-fields";
import { zx } from "@/lib/utils/zod";
import {
  formOptions,
  type FormAsyncValidateOrFn,
  type FormOptions,
  type FormValidateOrFn,
} from "@tanstack/react-form";
import { z } from "zod";

export type ImportFormRow = {
  name: string;
  className: string;
  nisn: string;
  email: string;
  customFields: Record<string, string>;
};

function resolveBooleanValue(raw: string) {
  const normalized = raw.trim().toLowerCase();
  if (["true", "ya", "yes", "1"].includes(normalized)) {
    return true;
  }
  if (["false", "tidak", "no", "0"].includes(normalized)) {
    return false;
  }
  return null;
}

function buildCustomFieldSchema(field: TenantProfileField) {
  return z.string().superRefine((value, ctx) => {
    const validation = field.validation ?? null;
    const required = Boolean(validation?.required);
    const trimmed = value.trim();

    if (field.type === "file") {
      ctx.addIssue({
        code: "custom",
        message: `${field.label} tidak mendukung import CSV.`,
      });
      return;
    }

    if (required && trimmed.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: `${field.label} wajib diisi.`,
      });
      return;
    }

    if (!trimmed) {
      return;
    }

    switch (field.type) {
      case "text": {
        const min = validation?.min;
        const max = validation?.max;
        const regex = validation?.regex;
        if (typeof min === "number" && trimmed.length < min) {
          ctx.addIssue({
            code: "custom",
            message: `${field.label} minimal ${min} karakter.`,
          });
        }
        if (typeof max === "number" && trimmed.length > max) {
          ctx.addIssue({
            code: "custom",
            message: `${field.label} maksimal ${max} karakter.`,
          });
        }
        if (regex) {
          const pattern = new RegExp(regex);
          if (!pattern.test(trimmed)) {
            ctx.addIssue({
              code: "custom",
              message: `${field.label} tidak sesuai format.`,
            });
          }
        }
        break;
      }
      case "number": {
        const parsed = Number(trimmed);
        if (Number.isNaN(parsed)) {
          ctx.addIssue({
            code: "custom",
            message: `${field.label} harus berupa angka.`,
          });
          return;
        }
        const min = validation?.min;
        const max = validation?.max;
        if (typeof min === "number" && parsed < min) {
          ctx.addIssue({
            code: "custom",
            message: `${field.label} minimal ${min}.`,
          });
        }
        if (typeof max === "number" && parsed > max) {
          ctx.addIssue({
            code: "custom",
            message: `${field.label} maksimal ${max}.`,
          });
        }
        break;
      }
      case "date": {
        const parsed = new Date(trimmed);
        if (Number.isNaN(parsed.getTime())) {
          ctx.addIssue({
            code: "custom",
            message: `${field.label} tanggal tidak valid.`,
          });
          return;
        }
        const dateRange = validation?.dateRange;
        if (dateRange?.min) {
          const minDate = new Date(dateRange.min);
          if (parsed < minDate) {
            ctx.addIssue({
              code: "custom",
              message: `${field.label} lebih kecil dari batas minimum.`,
            });
          }
        }
        if (dateRange?.max) {
          const maxDate = new Date(dateRange.max);
          if (parsed > maxDate) {
            ctx.addIssue({
              code: "custom",
              message: `${field.label} melebihi batas maksimum.`,
            });
          }
        }
        break;
      }
      case "boolean": {
        const boolValue = resolveBooleanValue(trimmed);
        if (boolValue === null) {
          ctx.addIssue({
            code: "custom",
            message: `${field.label} harus Ya/Tidak.`,
          });
        }
        break;
      }
      case "select": {
        const options = field.options ?? [];
        if (options.length === 0) {
          break;
        }
        const matches = options.some(
          (option) => option.value === trimmed || option.label === trimmed,
        );
        if (!matches) {
          ctx.addIssue({
            code: "custom",
            message: `${field.label} tidak sesuai opsi.`,
          });
        }
        break;
      }
      case "multiSelect": {
        const values = trimmed
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
        if (required && values.length === 0) {
          ctx.addIssue({
            code: "custom",
            message: `${field.label} wajib diisi.`,
          });
          break;
        }
        const options = field.options ?? [];
        if (options.length === 0) {
          break;
        }
        const allowed = new Set(
          options.map((option) => option.label || option.value),
        );
        const invalid = values.find((item) => !allowed.has(item));
        if (invalid) {
          ctx.addIssue({
            code: "custom",
            message: `${field.label} tidak sesuai opsi.`,
          });
        }
        break;
      }
      default:
        break;
    }
  });
}

function buildRowSchema(
  customFields: TenantProfileField[],
  classSet: Set<string>,
) {
  const customFieldShape = customFields.reduce(
    (acc, field) => {
      acc[field.id] = buildCustomFieldSchema(field);
      return acc;
    },
    {} as Record<string, z.ZodString>,
  );

  return z.object({
    name: z.string().min(1, "Nama wajib diisi."),
    className: z.enum(Array.from(classSet), "Kelas tidak ditemukan."),
    nisn: zx.nisn(),
    email: z.email("Email tidak valid."),
    customFields: z.object(customFieldShape).catchall(z.string()),
  });
}

export function buildImportSchema(
  customFields: TenantProfileField[],
  classSet: Set<string>,
) {
  const rowSchema = buildRowSchema(customFields, classSet);

  return z
    .object({
      rows: z.array(rowSchema).max(300),
    })
    .superRefine((value, ctx) => {
      const emailCounts = new Map<string, number>();
      const nisnCounts = new Map<string, number>();

      value.rows.forEach((row) => {
        const emailKey = row.email.trim().toLowerCase();
        const nisnKey = row.nisn.trim();

        if (emailKey) {
          emailCounts.set(emailKey, (emailCounts.get(emailKey) ?? 0) + 1);
        }

        if (nisnKey) {
          nisnCounts.set(nisnKey, (nisnCounts.get(nisnKey) ?? 0) + 1);
        }
      });

      value.rows.forEach((row, index) => {
        const emailKey = row.email.trim().toLowerCase();
        const nisnKey = row.nisn.trim();

        if (emailKey && (emailCounts.get(emailKey) ?? 0) > 1) {
          ctx.addIssue({
            code: "custom",
            path: ["rows", index, "email"],
            message: "Email duplikat di dalam file.",
          });
        }

        if (nisnKey && (nisnCounts.get(nisnKey) ?? 0) > 1) {
          ctx.addIssue({
            code: "custom",
            path: ["rows", index, "nisn"],
            message: "NISN duplikat di dalam file.",
          });
        }
      });
    });
}

export type StudentsImportFormValues = z.infer<
  ReturnType<typeof buildImportSchema>
>;

type StudentsImportFormOptions = FormOptions<
  StudentsImportFormValues,
  undefined,
  undefined,
  undefined,
  FormValidateOrFn<StudentsImportFormValues>,
  undefined,
  undefined,
  FormAsyncValidateOrFn<StudentsImportFormValues>,
  undefined,
  undefined,
  undefined,
  never
>;

export const studentsImportFormOptions = formOptions({
  defaultValues: {
    rows: [],
  },
}) as StudentsImportFormOptions;
