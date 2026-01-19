import type {
  ApiListResponse,
  ApiResponse,
  QueryParams,
} from "@/lib/services/api/api.types";

type GroupType = "GRADE" | "STREAM" | "PROGRAM" | "CUSTOM";

type Group = {
  id: string;
  tenantId: string;
  name: string;
  type: GroupType;
  createdAt?: string | null;
  updatedAt?: string | null;
  classCount?: number;
};

type GetGroupsVars = QueryParams<{
  type?: GroupType;
  order?: "asc" | "desc";
}>;

type GetGroupsResponse = ApiListResponse<Group>;

type CreateGroupVars = {
  name: string;
  type: GroupType;
};

type UpdateGroupVars = {
  id: string;
  name?: string;
  type?: GroupType;
};

type DeleteGroupVars = {
  id: string;
};

type CreateGroupResponse = ApiResponse<Group>;

type UpdateGroupResponse = ApiResponse<Group>;

type DeleteGroupResponse = ApiResponse<Group>;

export type {
  Group,
  GroupType,
  GetGroupsVars,
  GetGroupsResponse,
  CreateGroupVars,
  UpdateGroupVars,
  DeleteGroupVars,
  CreateGroupResponse,
  UpdateGroupResponse,
  DeleteGroupResponse,
};
