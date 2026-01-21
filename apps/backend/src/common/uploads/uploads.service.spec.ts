import { BadRequestException } from "@nestjs/common";

import { UploadsService } from "./uploads.service";
import type { UploadFileDto } from "./dto/upload-file.dto";
import type { MinioService } from "../storage/minio.service";

describe("UploadsService", () => {
  let service: UploadsService;
  let minioService: { getPresignedUploadUrl: jest.Mock };

  beforeEach(() => {
    minioService = {
      getPresignedUploadUrl: jest.fn().mockResolvedValue("https://upload.url"),
    };

    service = new UploadsService(minioService as unknown as MinioService);
  });

  it("generates upload URLs with sanitized keys", async () => {
    const files: UploadFileDto[] = [
      {
        fileName: "My File.pdf",
        mimeType: "application/pdf",
        size: 1024,
      },
    ];

    const results = await service.generateUploadUrls("tenant-1", files, {
      module: "sessions",
      entityId: "session-1",
    });

    expect(results).toHaveLength(1);
    expect(results[0].fileName).toBe("My File.pdf");
    expect(results[0].uploadUrl).toBe("https://upload.url");
    expect(results[0].fileKey).toContain("tenant-1/sessions/session-1/");
    expect(results[0].fileKey).toContain("My_File.pdf");
    expect(minioService.getPresignedUploadUrl).toHaveBeenCalledWith({
      objectKey: expect.stringContaining("tenant-1/sessions/session-1/"),
      contentType: "application/pdf",
    });
  });

  it("rejects blocked mime types", async () => {
    const files: UploadFileDto[] = [
      {
        fileName: "image.png",
        mimeType: "image/png" as unknown as UploadFileDto["mimeType"],
        size: 1024,
      },
    ];

    await expect(
      service.generateUploadUrls("tenant-1", files, { module: "uploads" }),
    ).rejects.toThrow(BadRequestException);
  });
});
