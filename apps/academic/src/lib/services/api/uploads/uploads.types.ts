import type { ApiResponse } from "@/lib/services/api/api.types";

export type UploadFileMetadata = {
  fileKey: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadUrl: string;
};

export type GenerateUploadUrlsVars = {
  files: Array<{
    fileName: string;
    mimeType: string;
    size: number;
  }>;
};

export type GenerateUploadUrlsResponse = ApiResponse<UploadFileMetadata[]>;
