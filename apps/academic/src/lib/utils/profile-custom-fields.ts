import type {
  ProfileFieldValue,
  TenantProfileField,
} from "@/lib/services/api/profile-custom-fields";

const EMPTY_VALUE_LABEL = "-" as const;

export function buildEmptyCustomFieldValues(
  customFields: TenantProfileField[],
) {
  return customFields.reduce<Record<string, string>>((acc, field) => {
    acc[field.id] = "";
    return acc;
  }, {});
}

export function formatProfileValue(
  field: TenantProfileField,
  value?: ProfileFieldValue,
) {
  if (!value) return EMPTY_VALUE_LABEL;

  const optionLabel = (raw?: string | null) => {
    if (!raw) return EMPTY_VALUE_LABEL;
    const match = field.options?.find((option) => option.value === raw);
    return match?.label ?? raw;
  };

  switch (field.type) {
    case "text":
      return value.valueText ?? EMPTY_VALUE_LABEL;
    case "number":
      return value.valueNumber !== null && value.valueNumber !== undefined
        ? String(value.valueNumber)
        : EMPTY_VALUE_LABEL;
    case "date":
      return value.valueDate ? (value.valueDate.split("T")[0] ?? "-") : "-";
    case "boolean":
      return value.valueBoolean === undefined || value.valueBoolean === null
        ? EMPTY_VALUE_LABEL
        : value.valueBoolean
          ? "Ya"
          : "Tidak";
    case "select":
      return optionLabel(value.valueSelect ?? undefined);
    case "multiSelect":
      return value.valueMultiSelect && value.valueMultiSelect.length > 0
        ? value.valueMultiSelect
            .map((item) => optionLabel(item))
            .filter(Boolean)
            .join(", ")
        : EMPTY_VALUE_LABEL;
    case "file":
      return value.valueFile?.fileName ?? EMPTY_VALUE_LABEL;
    default:
      return EMPTY_VALUE_LABEL;
  }
}

export function getCustomFieldId(fieldKey: string) {
  if (!fieldKey.startsWith("field:")) {
    return null;
  }
  return fieldKey.slice("field:".length);
}

export function getCustomFieldKey(fieldId: string) {
  return `field:${fieldId}`;
}
