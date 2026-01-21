import { clientApi } from "@/lib/services/api/api";

import type {
  DeleteSessionMaterialAttachmentResponse,
  DeleteSessionMaterialAttachmentVars,
  GetSessionMaterialsResponse,
  UpsertSessionMaterialResponse,
  UpsertSessionMaterialVars,
} from "./session-materials.types";

async function getSessionMaterials(sessionId: string) {
  const response = await clientApi.get<GetSessionMaterialsResponse>(
    `/sessions/${sessionId}/materials`,
  );
  return response.data.data;
}

async function upsertSessionMaterial(vars: UpsertSessionMaterialVars) {
  const response = await clientApi.put<UpsertSessionMaterialResponse>(
    `/sessions/${vars.sessionId}/materials`,
    {
      content: vars.content,
      links: vars.links,
      attachments: vars.attachments,
    },
  );
  return response.data.data;
}

async function deleteSessionMaterialAttachment(
  vars: DeleteSessionMaterialAttachmentVars,
) {
  const response =
    await clientApi.delete<DeleteSessionMaterialAttachmentResponse>(
      `/sessions/${vars.sessionId}/materials/attachments/${vars.attachmentId}`,
    );
  return response.data.data;
}

export {
  getSessionMaterials,
  upsertSessionMaterial,
  deleteSessionMaterialAttachment,
};
