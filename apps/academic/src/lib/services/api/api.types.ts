export type ApiErrorResponse = {
  message: string;
  code?: string;
  details?: Record<string, string | string[]>;
};

export type ApiResponse<T> = {
  data: T;
  message: string;
  statusCode: number;
  success: boolean;
  error?: string | ApiErrorResponse;
};

export type PaginationMeta = {
  offset: number;
  limit: number;
  total: number;
};

export type ApiListResponse<T> = {
  data: T[];
  message: string;
  statusCode: number;
  success: boolean;
  error?: string | ApiErrorResponse;
  meta: PaginationMeta;
};

export type QueryPagination = {
  offset?: number;
  limit?: number;
};

export type SortOrder = "asc" | "desc";

export type QuerySort = {
  sortBy?: string;
  sortOrder?: SortOrder;
};

export type QuerySearch = {
  search?: string;
};

export type QueryParams<
  TFilters extends Record<string, unknown> = Record<string, unknown>,
> = QueryPagination & QuerySort & QuerySearch & TFilters;

export type EmptyResponse = ApiResponse<null>;

/**
 * Example (basic response):
 *
 * type User = { id: string; name: string };
 * type GetUserResponse = ApiResponse<User>;
 */

/**
 * Example (paginated response):
 *
 * type User = { id: string; name: string };
 * type GetUsersResponse = ApiListResponse<User>;
 */

/**
 * Example (query vars with filters):
 *
 * type UserFilters = { role?: "admin" | "user" };
 * type GetUsersVars = QueryParams<UserFilters>;
 */

/**
 * Example (mutation vars):
 *
 * type CreateUserVars = {
 *   name: string;
 *   email: string;
 * };
 */
