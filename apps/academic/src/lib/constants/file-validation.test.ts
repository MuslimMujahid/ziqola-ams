// @vitest-environment jsdom
import { describe, it, expect } from "vitest";

import { FILE_VALIDATION, validateFile } from "./file-validation";

describe("file validation", () => {
  it("blocks images and videos", () => {
    const file = new File(["abc"], "image.png", { type: "image/png" });
    const result = validateFile(file);
    expect(result).toContain("Gambar dan video tidak diizinkan");
  });

  it("blocks oversized files", () => {
    const file = new File(
      [new ArrayBuffer(FILE_VALIDATION.MAX_SIZE + 1)],
      "big.pdf",
      { type: "application/pdf" },
    );
    const result = validateFile(file);
    expect(result).toContain("Ukuran file terlalu besar");
  });

  it("accepts allowed mime types", () => {
    const file = new File(["abc"], "doc.pdf", { type: "application/pdf" });
    const result = validateFile(file);
    expect(result).toBeNull();
  });
});
