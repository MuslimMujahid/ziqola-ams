import { Injectable, BadRequestException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { MinioService } from "../storage/minio.service";
import { FILE_VALIDATION } from "./file-validation.constants";
import type { UploadFileDto } from "./dto/upload-file.dto";

export interface UploadFileResult {
  fileKey: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadUrl: string;
}

@Injectable()
export class UploadsService {
  constructor(private readonly minioService: MinioService) {}

  async generateUploadUrls(
    tenantId: string,
    files: UploadFileDto[],
    context: { module: string; entityId?: string },
  ): Promise<UploadFileResult[]> {
    // Validate each file
    for (const file of files) {
      this.validateFile(file);
    }

    // Generate upload URLs in parallel
    const results = await Promise.all(
      files.map(async (file) => {
        const fileKey = this.generateFileKey(tenantId, context, file.fileName);
        const uploadUrl = await this.minioService.getPresignedUploadUrl({
          objectKey: fileKey,
          contentType: file.mimeType,
        });

        return {
          fileKey,
          fileName: file.fileName,
          mimeType: file.mimeType,
          size: file.size,
          uploadUrl,
        };
      }),
    );

    return results;
  }

  private validateFile(file: UploadFileDto): void {
    // Check blocked prefixes
    for (const prefix of FILE_VALIDATION.BLOCKED_MIME_TYPE_PREFIXES) {
      if (file.mimeType.startsWith(prefix)) {
        throw new BadRequestException(
          `File type ${file.mimeType} is not allowed. Images and videos are blocked.`,
        );
      }
    }

    // Size already validated by DTO, but double-check
    if (file.size > FILE_VALIDATION.MAX_SIZE) {
      throw new BadRequestException(
        `File ${file.fileName} exceeds maximum size of ${FILE_VALIDATION.MAX_SIZE} bytes`,
      );
    }
  }

  private generateFileKey(
    tenantId: string,
    context: { module: string; entityId?: string },
    fileName: string,
  ): string {
    const uuid = randomUUID();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

    if (context.entityId) {
      return `${tenantId}/${context.module}/${context.entityId}/${uuid}-${sanitizedFileName}`;
    }

    return `${tenantId}/${context.module}/${uuid}-${sanitizedFileName}`;
  }
}
