import type { ApiResponse } from "@/lib/services/api/api.types";

export type SessionMaterialAttachment = {
  id: string;
  tenantId: string;
  sessionMaterialId: string;
  fileKey: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  downloadUrl?: string | null;
  uploadUrl?: string | null;
};

export type SessionMaterial = {
  id: string | null;
  tenantId: string;
  sessionId: string;
  content: unknown | null;
  links: string[];
  createdById: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  attachments: SessionMaterialAttachment[];
};

export type GetSessionMaterialsResponse = ApiResponse<SessionMaterial>;

export type AttachmentMetadata = {
  fileKey: string;
  fileName: string;
  mimeType: string;
  size: number;
};

export type UpsertSessionMaterialVars = {
  sessionId: string;
  content?: string;
  links?: string[];
  attachments?: AttachmentMetadata[];
};

export type UpsertSessionMaterialResponse = ApiResponse<SessionMaterial>;

export type DeleteSessionMaterialAttachmentVars = {
  sessionId: string;
  attachmentId: string;
};

export type DeleteSessionMaterialAttachmentResponse = ApiResponse<{
  id: string;
}>;
