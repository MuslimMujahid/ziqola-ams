import { clientApi } from "@/lib/services/api/api";
import type {
  CreateGroupResponse,
  CreateGroupVars,
  DeleteGroupResponse,
  DeleteGroupVars,
  GetGroupsResponse,
  GetGroupsVars,
  UpdateGroupResponse,
  UpdateGroupVars,
} from "./groups.types";

async function getGroups(params?: GetGroupsVars) {
  const response = await clientApi.get<GetGroupsResponse>("/groups", {
    params,
  });
  return response.data;
}

async function createGroup(vars: CreateGroupVars) {
  const response = await clientApi.post<CreateGroupResponse>("/groups", vars);
  return response.data.data;
}

async function updateGroup(vars: UpdateGroupVars) {
  const { id, ...payload } = vars;
  const response = await clientApi.patch<UpdateGroupResponse>(
    `/groups/${id}`,
    payload,
  );
  return response.data.data;
}

async function deleteGroup(vars: DeleteGroupVars) {
  const response = await clientApi.delete<DeleteGroupResponse>(
    `/groups/${vars.id}`,
  );
  return response.data.data;
}

export { getGroups, createGroup, updateGroup, deleteGroup };
