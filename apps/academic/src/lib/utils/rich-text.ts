import type { Descendant } from "slate";

import { normalizeValue } from "@/components/rich-text-editor/rich-text-editor";

/**
 * Check if a rich text value is empty.
 */
export function isRichTextEmpty(value: Descendant[]) {
  const normalized = normalizeValue(value);
  if (normalized.length !== 1) return false;
  const [first] = normalized as Array<{
    type?: string;
    children?: Array<{ text?: string }>;
  }>;
  if (first?.type && first.type !== "paragraph") return false;
  const children = Array.isArray(first?.children) ? first.children : [];
  return children.every((child) => !child.text || child.text.trim() === "");
}
