export const FILE_VALIDATION = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: new Set([
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
  ]),
  BLOCKED_MIME_TYPE_PREFIXES: ["image/", "video/"] as const,
} as const;

export function validateFile(file: File): string | null {
  if (file.size > FILE_VALIDATION.MAX_SIZE) {
    return "Ukuran file terlalu besar. Maksimal 5 MB.";
  }

  for (const prefix of FILE_VALIDATION.BLOCKED_MIME_TYPE_PREFIXES) {
    if (file.type.startsWith(prefix)) {
      return "Tipe file tidak didukung. Gambar dan video tidak diizinkan.";
    }
  }

  if (!FILE_VALIDATION.ALLOWED_MIME_TYPES.has(file.type)) {
    return "Tipe file tidak didukung. Gunakan PDF, DOCX, PPTX, XLSX, TXT, CSV, atau ZIP.";
  }

  return null; // Valid
}

export function getAllowedMimeTypesString(): string {
  return Array.from(FILE_VALIDATION.ALLOWED_MIME_TYPES).join(",");
}
