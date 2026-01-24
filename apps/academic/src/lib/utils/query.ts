import type {
  FilterCondition,
  TenantProfileField,
} from "@/lib/services/api/profile-custom-fields";

type QueryFilterInput = {
  fieldKey: string;
  op: string;
  value: string;
};

function toArray(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildCustomFieldFilters(
  filters: QueryFilterInput[],
  fields: TenantProfileField[],
): FilterCondition[] {
  return filters
    .map((filter) => {
      const field = fields.find((item) => item.key === filter.fieldKey);
      if (!field) return null;

      const rawValue = filter.value.trim();
      if (!rawValue) return null;

      const parseValue = () => {
        if (filter.op === "in" || filter.op === "between") {
          const items = toArray(rawValue);
          if (field.type === "number") {
            return items.map((item) => Number(item));
          }
          return items;
        }

        if (field.type === "boolean") {
          return rawValue === "true";
        }

        if (field.type === "number") {
          return Number(rawValue);
        }

        if (field.type === "multiSelect") {
          return toArray(rawValue);
        }

        return rawValue;
      };

      const parsedValue = parseValue();
      const normalizedOp =
        field.type === "select" &&
        filter.op === "in" &&
        Array.isArray(parsedValue) &&
        parsedValue.length === 1
          ? "eq"
          : filter.op;
      const normalizedValue =
        normalizedOp === "eq" && Array.isArray(parsedValue)
          ? parsedValue[0]
          : parsedValue;

      return {
        fieldKey: filter.fieldKey,
        op: normalizedOp,
        value: normalizedValue,
      } satisfies FilterCondition;
    })
    .filter(Boolean) as FilterCondition[];
}
