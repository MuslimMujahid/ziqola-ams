import { clientApi } from "@/lib/services/api/api";
import type {
  AssignHomeroomResponse,
  AssignHomeroomVars,
  CreateClassResponse,
  CreateClassVars,
  DeleteClassResponse,
  DeleteClassVars,
  GetClassesResponse,
  GetClassesVars,
  UpdateClassResponse,
  UpdateClassVars,
} from "./classes.types";

async function getClasses(params?: GetClassesVars) {
  const response = await clientApi.get<GetClassesResponse>("/classes", {
    params,
  });
  return response.data;
}

async function createClass(vars: CreateClassVars) {
  const response = await clientApi.post<CreateClassResponse>("/classes", vars);
  return response.data.data;
}

async function updateClass(vars: UpdateClassVars) {
  const { id, ...payload } = vars;
  const response = await clientApi.patch<UpdateClassResponse>(
    `/classes/${id}`,
    payload,
  );
  return response.data.data;
}

async function deleteClass(vars: DeleteClassVars) {
  const response = await clientApi.delete<DeleteClassResponse>(
    `/classes/${vars.id}`,
  );
  return response.data.data;
}

async function assignHomeroom(vars: AssignHomeroomVars) {
  const response = await clientApi.post<AssignHomeroomResponse>(
    `/classes/${vars.id}/homeroom`,
    { teacherProfileId: vars.teacherProfileId },
  );
  return response.data.data;
}

export { getClasses, createClass, updateClass, deleteClass, assignHomeroom };
