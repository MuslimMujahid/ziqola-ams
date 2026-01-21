import { clientApi } from "@/lib/services/api/api";
import type {
  GenerateUploadUrlsVars,
  GenerateUploadUrlsResponse,
} from "./uploads.types";

async function generateUploadUrls(vars: GenerateUploadUrlsVars) {
  const response = await clientApi.post<GenerateUploadUrlsResponse>(
    "/uploads",
    vars,
  );
  return response.data.data;
}

export { generateUploadUrls };
