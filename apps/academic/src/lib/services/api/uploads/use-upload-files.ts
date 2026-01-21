import React from "react";
import { generateUploadUrls } from "./api.client";
import { validateFile } from "@/lib/constants/file-validation";
import type { UploadFileMetadata } from "./uploads.types";

export type UploadFilesResult = {
  uploadFiles: (files: File[]) => Promise<UploadFileMetadata[]>;
  isUploading: boolean;
  progress: number; // 0-100
  error: Error | null;
};

export function useUploadFiles(): UploadFilesResult {
  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<Error | null>(null);

  const uploadFiles = React.useCallback(async (files: File[]) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // 1. Validate all files client-side
      for (const file of files) {
        const validationError = validateFile(file);
        if (validationError) {
          throw new Error(validationError);
        }
      }

      // 2. Request presigned URLs from backend
      const metadata = await generateUploadUrls({
        files: files.map((file) => ({
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
        })),
      });

      // 3. Upload files to storage in parallel
      console.log("Uploading files to storage...", metadata);
      const uploadPromises = metadata.map(async (meta, index) => {
        const file = files[index];
        if (!file) throw new Error("File not found at index");

        const response = await fetch(meta.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        return meta;
      });

      const results = await Promise.all(uploadPromises);

      setProgress(100);
      return results;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Upload failed");
      setError(error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { uploadFiles, isUploading, progress, error };
}
