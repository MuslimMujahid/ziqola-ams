import { clientApi } from "@/lib/services/api/api";

import type {
  CreateClassSubjectResponse,
  CreateClassSubjectVars,
  DeleteClassSubjectResponse,
  DeleteClassSubjectVars,
  GetClassSubjectsResponse,
  GetClassSubjectsVars,
  UpdateClassSubjectResponse,
  UpdateClassSubjectVars,
} from "./class-subjects.types";

async function getClassSubjects(params?: GetClassSubjectsVars) {
  const response = await clientApi.get<GetClassSubjectsResponse>(
    "/class-subjects",
    { params },
  );
  return response.data;
}

async function createClassSubject(vars: CreateClassSubjectVars) {
  const response = await clientApi.post<CreateClassSubjectResponse>(
    "/class-subjects",
    vars,
  );
  return response.data.data;
}

async function updateClassSubject(vars: UpdateClassSubjectVars) {
  const response = await clientApi.patch<UpdateClassSubjectResponse>(
    `/class-subjects/${vars.id}`,
    vars,
  );
  return response.data.data;
}

async function deleteClassSubject(vars: DeleteClassSubjectVars) {
  const response = await clientApi.delete<DeleteClassSubjectResponse>(
    `/class-subjects/${vars.id}`,
  );
  return response.data.data;
}

export {
  getClassSubjects,
  createClassSubject,
  updateClassSubject,
  deleteClassSubject,
};
