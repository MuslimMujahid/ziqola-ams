import { clientApi } from "@/lib/services/api/api";

import type {
  CreateSessionResponse,
  CreateSessionVars,
  DeleteSessionResponse,
  DeleteSessionVars,
  GetSessionsResponse,
  GetSessionsVars,
  UpdateSessionResponse,
  UpdateSessionVars,
} from "./sessions.types";

async function getSessions(params?: GetSessionsVars) {
  const response = await clientApi.get<GetSessionsResponse>("/sessions", {
    params,
  });
  return response.data;
}

async function createSession(vars: CreateSessionVars) {
  const response = await clientApi.post<CreateSessionResponse>(
    "/sessions",
    vars,
  );
  return response.data.data;
}

async function updateSession(vars: UpdateSessionVars) {
  const { id, ...body } = vars;
  const response = await clientApi.patch<UpdateSessionResponse>(
    `/sessions/${id}`,
    body,
  );
  return response.data.data;
}

async function deleteSession(vars: DeleteSessionVars) {
  const response = await clientApi.delete<DeleteSessionResponse>(
    `/sessions/${vars.id}`,
  );
  return response.data.data;
}

export { getSessions, createSession, updateSession, deleteSession };
