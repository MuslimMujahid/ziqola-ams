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
