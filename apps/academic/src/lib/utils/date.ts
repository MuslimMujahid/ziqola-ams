/**
 * Format a date to Indonesian locale string.
 * @param value Date or date string
 * @returns Formatted date string in "dd MMM yyyy" format or empty string if invalid
 */
export function formatDateLocal(value?: Date | string | null) {
  if (!value) return "";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Render a date range in Indonesian locale.
 * @param start Start date or date string
 * @param end End date or date string
 * @returns Formatted date range string or "—" if both dates are missing
 */
export function renderDateRange(
  start?: Date | string | null,
  end?: Date | string | null,
) {
  if (!start && !end) return "—";
  const startLabel = formatDateLocal(start);
  const endLabel = formatDateLocal(end);
  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`;
  return startLabel || endLabel;
}

/**
 * Get a YYYY-MM-DD string based on the user's local timezone.
 */
export function getLocalDateInputValue(date: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Parse a YYYY-MM-DD string into a Date object in local timezone.
 */
export function parseDateInputLocal(value: string) {
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Format a date in local timezone using Indonesian locale.
 */
export function formatDateLocalLong(value?: Date | string | null) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
