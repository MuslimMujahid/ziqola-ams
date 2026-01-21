// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useUploadFiles } from "./use-upload-files";
import { generateUploadUrls } from "./api.client";

vi.mock("./api.client", () => ({
  generateUploadUrls: vi.fn(),
}));

describe("useUploadFiles", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("uploads files after generating URLs", async () => {
    const generateUploadUrlsMock = vi.mocked(generateUploadUrls);
    generateUploadUrlsMock.mockResolvedValue([
      {
        fileKey: "tenant-1/uploads/doc.pdf",
        fileName: "doc.pdf",
        mimeType: "application/pdf",
        size: 3,
        uploadUrl: "https://upload.url",
      },
    ]);

    const { result } = renderHook(() => useUploadFiles());
    const files = [new File(["abc"], "doc.pdf", { type: "application/pdf" })];

    let uploaded: Awaited<
      ReturnType<typeof result.current.uploadFiles>
    > | null = null;

    await act(async () => {
      uploaded = await result.current.uploadFiles(files);
    });

    expect(generateUploadUrlsMock).toHaveBeenCalledWith({
      files: [{ fileName: "doc.pdf", mimeType: "application/pdf", size: 3 }],
    });
    expect(fetchMock).toHaveBeenCalledWith("https://upload.url", {
      method: "PUT",
      headers: { "Content-Type": "application/pdf" },
      body: files[0],
    });
    expect(uploaded).toHaveLength(1);
  });

  it("rejects invalid files before uploading", async () => {
    const generateUploadUrlsMock = vi.mocked(generateUploadUrls);
    const { result } = renderHook(() => useUploadFiles());
    const files = [new File(["abc"], "image.png", { type: "image/png" })];

    await expect(result.current.uploadFiles(files)).rejects.toThrow(
      "Tipe file tidak didukung",
    );
    expect(generateUploadUrlsMock).not.toHaveBeenCalled();
  });
});
