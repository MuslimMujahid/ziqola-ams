import React from "react";
import {
  ChevronDownIcon,
  GripVerticalIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@repo/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { Input } from "@repo/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { cn } from "@/lib/utils";
import type {
  FieldType,
  TenantProfileField,
} from "@/lib/services/api/profile-custom-fields";

export type FilterInput = {
  fieldKey: string;
  op: string;
  value: string;
};

type CustomFieldFilterBuilderProps = {
  fields: TenantProfileField[];
  filters: FilterInput[];
  onChange: (filters: FilterInput[]) => void;
};

const OPERATORS_BY_TYPE: Record<
  FieldType,
  Array<{ value: string; label: string }>
> = {
  text: [
    { value: "eq", label: "Sama dengan" },
    { value: "neq", label: "Tidak sama" },
    { value: "contains", label: "Mengandung" },
    { value: "startsWith", label: "Diawali" },
    { value: "endsWith", label: "Diakhiri" },
  ],
  number: [
    { value: "eq", label: "Sama dengan" },
    { value: "neq", label: "Tidak sama" },
    { value: "gt", label: ">" },
    { value: "gte", label: ">=" },
    { value: "lt", label: "<" },
    { value: "lte", label: "<=" },
    { value: "between", label: "Di antara" },
    { value: "in", label: "Dalam daftar" },
  ],
  date: [
    { value: "eq", label: "Sama dengan" },
    { value: "before", label: "Sebelum" },
    { value: "after", label: "Sesudah" },
    { value: "between", label: "Di antara" },
  ],
  boolean: [{ value: "eq", label: "Sama dengan" }],
  select: [{ value: "in", label: "Dalam daftar" }],
  multiSelect: [
    { value: "hasAny", label: "Memiliki salah satu" },
    { value: "hasAll", label: "Memiliki semua" },
  ],
  file: [{ value: "eq", label: "Sama dengan" }],
};

function resolveFieldType(fields: TenantProfileField[], key: string) {
  return fields.find((field) => field.key === key)?.type ?? "text";
}

function resolveFieldOptions(fields: TenantProfileField[], key: string) {
  return fields.find((field) => field.key === key)?.options ?? [];
}

function parseMultiValue(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function CustomFieldFilterBuilder({
  fields,
  filters,
  onChange,
}: CustomFieldFilterBuilderProps) {
  const enabledFields = React.useMemo(
    () => fields.filter((field) => field.isEnabled),
    [fields],
  );

  const handleAdd = React.useCallback(() => {
    if (enabledFields.length === 0) return;
    const nextField = enabledFields[0];
    const operators = OPERATORS_BY_TYPE[nextField.type];
    const nextFilters = [
      ...filters,
      {
        fieldKey: nextField.key,
        op: operators[0]?.value ?? "eq",
        value: "",
      },
    ];
    onChange(nextFilters);
  }, [enabledFields, filters, onChange]);

  const handleRemove = React.useCallback(
    (index: number) => {
      const next = filters.filter((_, idx) => idx !== index);
      onChange(next);
    },
    [filters, onChange],
  );

  const updateFilter = React.useCallback(
    (index: number, patch: Partial<FilterInput>) => {
      const next = filters.map((filter, idx) =>
        idx === index ? { ...filter, ...patch } : filter,
      );
      onChange(next);
    },
    [filters, onChange],
  );

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="secondary"
          className="w-full justify-center gap-2 sm:w-auto"
          onClick={handleAdd}
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Tambah filter
        </Button>
      </div>

      {filters.length > 0 ? (
        <div className="mt-4 space-y-3">
          {filters.map((filter, index) => {
            const fieldType = resolveFieldType(enabledFields, filter.fieldKey);
            const operators = OPERATORS_BY_TYPE[fieldType] ?? [];
            const options = resolveFieldOptions(enabledFields, filter.fieldKey);
            const shouldUseMultiSelectDropdown =
              options.length > 0 &&
              (fieldType === "multiSelect" ||
                (fieldType === "select" && filter.op === "in"));
            const showCommaHint =
              !shouldUseMultiSelectDropdown &&
              (fieldType === "multiSelect" ||
                filter.op === "in" ||
                filter.op === "hasAny" ||
                filter.op === "hasAll");

            return (
              <div key={`${filter.fieldKey}-${index}`}>
                <div className="grid items-center gap-3 md:grid-cols-[auto_1.2fr_1fr_1.4fr_auto]">
                  <div className="flex h-9 w-9 items-center justify-center text-ink-quiet">
                    <GripVerticalIcon className="h-4 w-4" aria-hidden="true" />
                  </div>

                  <Select
                    value={filter.fieldKey}
                    onValueChange={(value) => {
                      const nextType = resolveFieldType(enabledFields, value);
                      const nextOperators = OPERATORS_BY_TYPE[nextType];
                      updateFilter(index, {
                        fieldKey: value,
                        op: nextOperators[0]?.value ?? "eq",
                        value: "",
                      });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih field" />
                    </SelectTrigger>
                    <SelectContent>
                      {enabledFields.map((field) => (
                        <SelectItem key={field.key} value={field.key}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filter.op}
                    onValueChange={(value) =>
                      updateFilter(index, { op: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map((operator) => (
                        <SelectItem key={operator.value} value={operator.value}>
                          {operator.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div
                    className={cn(
                      "w-full",
                      fieldType === "boolean" && "max-w-xs",
                    )}
                  >
                    {fieldType === "boolean" ? (
                      <Select
                        value={filter.value}
                        onValueChange={(value) =>
                          updateFilter(index, { value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih nilai" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Ya</SelectItem>
                          <SelectItem value="false">Tidak</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : shouldUseMultiSelectDropdown ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-between"
                          >
                            <span className="truncate text-left">
                              {parseMultiValue(filter.value).length > 0
                                ? parseMultiValue(filter.value)
                                    .map((value) => {
                                      const option = options.find(
                                        (item) => item.value === value,
                                      );
                                      return option?.label ?? value;
                                    })
                                    .join(", ")
                                : "Pilih nilai"}
                            </span>
                            <ChevronDownIcon
                              className="h-4 w-4 text-ink-quiet"
                              aria-hidden="true"
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64">
                          {options.map((option) => {
                            const currentValues = parseMultiValue(filter.value);
                            const isChecked = currentValues.includes(
                              option.value,
                            );
                            return (
                              <DropdownMenuCheckboxItem
                                key={option.value}
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  const nextValues = checked
                                    ? [...currentValues, option.value]
                                    : currentValues.filter(
                                        (value) => value !== option.value,
                                      );
                                  updateFilter(index, {
                                    value: nextValues.join(", "),
                                  });
                                }}
                                onSelect={(event) => event.preventDefault()}
                              >
                                {option.label}
                              </DropdownMenuCheckboxItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : fieldType === "select" ? (
                      <Select
                        value={filter.value}
                        onValueChange={(value) =>
                          updateFilter(index, { value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih nilai" />
                        </SelectTrigger>
                        <SelectContent>
                          {options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-1">
                        <Input
                          value={filter.value}
                          onChange={(event) =>
                            updateFilter(index, { value: event.target.value })
                          }
                          placeholder={
                            showCommaHint
                              ? "Pisahkan dengan koma"
                              : "Masukkan nilai"
                          }
                          type={fieldType === "number" ? "number" : "text"}
                        />
                        {showCommaHint ? (
                          <p className="text-xs text-ink-quiet">
                            Gunakan koma untuk memisahkan beberapa nilai.
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(index)}
                    aria-label="Hapus filter"
                  >
                    <Trash2Icon className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
