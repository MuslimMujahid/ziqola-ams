import { clientApi } from "@/lib/services/api/api";

import type {
  CreateSubjectResponse,
  CreateSubjectVars,
  DeleteSubjectResponse,
  DeleteSubjectVars,
  GetSubjectsResponse,
  GetSubjectsVars,
  UpdateSubjectResponse,
  UpdateSubjectVars,
} from "./subjects.types";

async function getSubjects(params?: GetSubjectsVars) {
  const response = await clientApi.get<GetSubjectsResponse>("/subjects", {
    params,
  });
  return response.data;
}

async function createSubject(vars: CreateSubjectVars) {
  const response = await clientApi.post<CreateSubjectResponse>(
    "/subjects",
    vars,
  );
  return response.data.data;
}

async function updateSubject(vars: UpdateSubjectVars) {
  const response = await clientApi.patch<UpdateSubjectResponse>(
    `/subjects/${vars.id}`,
    vars,
  );
  return response.data.data;
}

async function deleteSubject(vars: DeleteSubjectVars) {
  const response = await clientApi.delete<DeleteSubjectResponse>(
    `/subjects/${vars.id}`,
  );
  return response.data.data;
}

export { getSubjects, createSubject, updateSubject, deleteSubject };
