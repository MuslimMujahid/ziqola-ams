export type SessionMaterialContent = Record<string, unknown>;

export type SessionMaterialAttachmentSummary = {
  id: string;
  tenantId: string;
  sessionMaterialId: string;
  fileKey: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  downloadUrl?: string | null;
  uploadUrl?: string | null;
};

export type SessionMaterialSummary = {
  id: string | null;
  tenantId: string;
  sessionId: string;
  content: SessionMaterialContent | null;
  links: string[];
  createdById: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  attachments: SessionMaterialAttachmentSummary[];
};
