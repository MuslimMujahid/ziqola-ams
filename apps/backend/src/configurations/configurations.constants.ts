export const PROFILE_ROLES = ["student", "teacher"] as const;
export type ProfileRole = (typeof PROFILE_ROLES)[number];

export const PROFILE_FIELD_TYPES = [
  "text",
  "number",
  "date",
  "boolean",
  "select",
  "multiSelect",
  "file",
] as const;
export type ProfileFieldType = (typeof PROFILE_FIELD_TYPES)[number];

export const PROFILE_FILTER_OPERATORS = {
  text: ["eq", "neq", "contains", "startsWith", "endsWith", "in"],
  number: ["eq", "neq", "gt", "gte", "lt", "lte", "between", "in"],
  date: ["eq", "before", "after", "between"],
  boolean: ["eq"],
  select: ["eq", "neq", "in"],
  multiSelect: ["hasAny", "hasAll"],
} as const;

export type ProfileFilterOperator =
  (typeof PROFILE_FILTER_OPERATORS)[keyof typeof PROFILE_FILTER_OPERATORS][number];
