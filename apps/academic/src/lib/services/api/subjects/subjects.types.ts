import type {
  ApiListResponse,
  ApiResponse,
  QueryParams,
} from "@/lib/services/api/api.types";

export type Subject = {
  id: string;
  tenantId: string;
  name: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  deletedAt?: string | null;
  isDeleted?: boolean;
  deleted?: "soft" | "hard";
};

export type GetSubjectsVars = QueryParams;

export type GetSubjectsResponse = ApiListResponse<Subject>;

export type CreateSubjectVars = {
  name: string;
};

export type UpdateSubjectVars = {
  id: string;
  name: string;
};

export type DeleteSubjectVars = {
  id: string;
};

export type CreateSubjectResponse = ApiResponse<Subject>;

export type UpdateSubjectResponse = ApiResponse<Subject>;

export type DeleteSubjectResponse = ApiResponse<Subject>;
