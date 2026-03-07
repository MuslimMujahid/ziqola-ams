"use client";

import React from "react";
import { useStore } from "@tanstack/react-form";
import { Loader2Icon, Trash2Icon } from "lucide-react";

import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { cn, getCustomFieldId, getErrorMessage, withForm } from "@/lib/utils";
import type { ClassItem } from "@/lib/services/api/classes";
import type { TenantProfileField } from "@/lib/services/api/profile-custom-fields";
import { studentsImportFormOptions } from "../-utils/-student-input-preview-form";

export type HeaderColumn = {
  key: string;
  label: string;
  isCustom: boolean;
};

export type RowFieldName =
  | `rows[${number}].name`
  | `rows[${number}].className`
  | `rows[${number}].nisn`
  | `rows[${number}].email`
  | `rows[${number}].customFields.${string}`;

type PreviewTableProps = {
  headerColumns: HeaderColumn[];
  classes: ClassItem[];
  customFieldMap: Map<string, TenantProfileField>;
};

type PreviewCellProps = {
  fieldName: RowFieldName;
  column: HeaderColumn;
  classes: ClassItem[];
  customFieldMap: Map<string, TenantProfileField>;
  value: string;
  onChange: (_value: string) => void;
  onBlur: () => void;
  error: unknown;
};

export function resolveOptionValue(
  field: TenantProfileField,
  rawValue: string,
) {
  const options = field.options ?? [];
  if (options.length === 0) {
    return rawValue.trim() || null;
  }

  const trimmed = rawValue.trim();
  const match = options.find(
    (option) => option.value === trimmed || option.label === trimmed,
  );
  return match?.value ?? (trimmed ? trimmed : null);
}

export function resolveOptionValues(
  field: TenantProfileField,
  rawValue: string,
) {
  const options = field.options ?? [];
  const tokens = rawValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (options.length === 0) {
    return tokens;
  }

  return tokens.map((token) => {
    const match = options.find(
      (option) => option.value === token || option.label === token,
    );
    return match?.value ?? token;
  });
}

const PreviewCell = React.memo(function Render({
  column,
  classes,
  customFieldMap,
  error,
  value,
  onChange,
  onBlur,
}: PreviewCellProps) {
  const [localValue, setLocalValue] = React.useState(value);
  const errorMessage = getErrorMessage(error);
  const hasError = Boolean(errorMessage);

  const renderError = () => (
    <p className="min-h-3.5 text-[11px] text-error" role="alert">
      {errorMessage}
    </p>
  );

  const onChangeBlur = (value: string) => {
    onBlur();
    onChange(value);
    setLocalValue(value);
  };

  React.useEffect(() => {
    setLocalValue(value ?? "");
  }, [value]);

  if (column.key === "className") {
    return (
      <div className="space-y-1">
        <Select value={localValue || undefined} onValueChange={onChangeBlur}>
          <SelectTrigger
            className={cn(
              "h-8",
              hasError ? "border-error text-error" : "border-surface-2",
            )}
          >
            <SelectValue placeholder="Pilih kelas" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((classItem) => (
              <SelectItem key={classItem.id} value={classItem.name}>
                {classItem.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {renderError()}
      </div>
    );
  }

  const customField = customFieldMap.get(column.key);
  const hasOptions = Boolean(
    customField?.options && customField.options.length > 0,
  );

  if (customField?.type === "select" && hasOptions) {
    const resolvedValue = resolveOptionValue(customField, value || "");

    return (
      <div className="space-y-1">
        <Select
          defaultValue={resolvedValue ?? undefined}
          onValueChange={onChangeBlur}
        >
          <SelectTrigger
            className={cn(
              "h-8",
              hasError ? "border-error text-error" : "border-surface-2",
            )}
          >
            <SelectValue placeholder="Pilih opsi" />
          </SelectTrigger>
          <SelectContent>
            {(customField.options ?? []).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label || option.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {renderError()}
      </div>
    );
  }

  if (customField?.type === "multiSelect" && hasOptions) {
    const values = resolveOptionValues(customField, value || "");

    return (
      <div className="space-y-1">
        <select
          multiple
          value={values}
          onBlur={onBlur}
          onChange={(event) => {
            const selected = Array.from(event.target.selectedOptions).map(
              (option) => option.value,
            );
            onChange(selected.join(", "));
          }}
          className={cn(
            "h-20 w-full rounded-md bg-surface-contrast px-2 py-1 text-sm text-ink",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            hasError
              ? "border border-error text-error"
              : "border border-surface-2",
          )}
        >
          {(customField.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label || option.value}
            </option>
          ))}
        </select>
        {renderError()}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Input
        defaultValue={value}
        onBlur={() => {
          onBlur();
          onChange(localValue);
        }}
        onChange={(event) => {
          setLocalValue(event.target.value);
        }}
        className={cn(
          "h-8",
          hasError ? "border-error text-error" : "border-surface-2",
        )}
      />
      {renderError()}
    </div>
  );
});

const PreviewRow = React.memo(
  withForm({
    ...studentsImportFormOptions,
    props: {
      rowIndex: 0,
      columns: [] as HeaderColumn[],
      classes: [] as ClassItem[],
      customFieldMap: new Map<string, TenantProfileField>(),
      onRemove: (_index: number) => {},
      style: {} as React.CSSProperties,
      measureRef: (_element: HTMLElement | null) => {},
    },
    render: function Render({
      form,
      rowIndex,
      columns,
      classes,
      customFieldMap,
      onRemove,
      style,
      measureRef,
    }) {
      const isInvalid = useStore(form.store, (state) => {
        const fieldMeta = state.fieldMeta[`rows[${rowIndex}]`];
        return fieldMeta ? !fieldMeta.isValid : false;
      });

      return (
        <tr
          ref={measureRef}
          data-index={rowIndex}
          className={cn(
            "table w-full table-fixed border-t border-surface-2",
            isInvalid && "bg-error/5",
          )}
          style={style}
        >
          <td className="px-3 pt-2 pb-6 text-xs text-ink-muted">
            {rowIndex + 1}
          </td>

          {columns.map((column) => {
            const customFieldId = column.isCustom
              ? getCustomFieldId(column.key)
              : null;
            const fieldName = column.isCustom
              ? customFieldId
                ? (`rows[${rowIndex}].customFields.${customFieldId}` as RowFieldName)
                : null
              : (`rows[${rowIndex}].${column.key}` as RowFieldName);

            if (!fieldName) {
              return (
                <td key={column.key} className="px-3 py-2">
                  -
                </td>
              );
            }

            return (
              <td key={column.key} className="px-3 py-2">
                <form.Field key={fieldName} name={fieldName}>
                  {(field) => (
                    <PreviewCell
                      fieldName={fieldName}
                      column={column}
                      classes={classes}
                      customFieldMap={customFieldMap}
                      value={field.state.value}
                      onChange={field.handleChange}
                      onBlur={field.handleBlur}
                      error={field.state.meta.errors?.[0]}
                    />
                  )}
                </form.Field>
              </td>
            );
          })}
          <td className="px-3 py-2 text-right">
            <Button
              type="button"
              variant="ghost"
              className="text-error hover:text-error"
              onClick={() => onRemove(rowIndex)}
            >
              <Trash2Icon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </td>
        </tr>
      );
    },
  }),
);

export const PreviewTable = withForm({
  ...studentsImportFormOptions,
  props: {
    headerColumns: [] as HeaderColumn[],
    classes: [] as ClassItem[],
    customFieldMap: new Map<string, TenantProfileField>(),
  } satisfies PreviewTableProps,
  render: function Render({ form, headerColumns, classes, customFieldMap }) {
    const rowsLength = useStore(
      form.store,
      (state) => state.values.rows.length,
    );
    const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

    const handleRemoveRow = React.useCallback(
      (rowIndex: number) => {
        form.deleteField(`rows[${rowIndex}]`);
      },
      [form],
    );

    return (
      <div className="space-y-3">
        <div className="relative max-h-240 overflow-auto rounded-lg bg-surface-contrast">
          {isSubmitting ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-surface-1/70 text-sm text-ink-muted">
              <Loader2Icon
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              <span role="status" aria-live="polite">
                Mengimpor data...
              </span>
            </div>
          ) : null}
          <table className="min-w-full table-fixed text-left text-sm">
            <thead className="table w-full table-fixed bg-surface-1 text-xs text-ink-muted">
              <tr>
                <th className="px-3 py-2">#</th>
                {headerColumns.map((column) => (
                  <th key={column.key} className="px-3 py-2">
                    {column.label}
                  </th>
                ))}
                <th className="px-3 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rowsLength }).map((_, rowIndex) => (
                <PreviewRow
                  key={rowIndex}
                  form={form}
                  rowIndex={rowIndex}
                  columns={headerColumns}
                  classes={classes}
                  customFieldMap={customFieldMap}
                  onRemove={handleRemoveRow}
                  style={{}}
                  measureRef={() => {}}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  },
});
