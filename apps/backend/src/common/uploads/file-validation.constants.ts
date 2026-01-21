export const FILE_VALIDATION = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
    "application/zip",
  ] as const,
  BLOCKED_MIME_TYPE_PREFIXES: ["image/", "video/"] as const,
} as const;

export type AllowedMimeType =
  (typeof FILE_VALIDATION.ALLOWED_MIME_TYPES)[number];
