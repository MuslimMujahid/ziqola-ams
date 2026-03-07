import { z } from "zod";

function nisn() {
  return z.string().superRefine((value, ctx) => {
    const trimmed = value.trim();
    if (!trimmed) {
      ctx.addIssue({
        code: "custom",
        message: "NISN wajib diisi.",
      });
      return;
    }
    if (!/^\d+$/.test(trimmed) || trimmed.length < 10 || trimmed.length > 13) {
      ctx.addIssue({
        code: "custom",
        message: "NISN harus 10-13 digit angka.",
      });
    }
  });
}

export const zx = { nisn };
