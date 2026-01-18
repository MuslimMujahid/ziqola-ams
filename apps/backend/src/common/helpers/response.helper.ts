import {
  SuccessResponseDto,
  PaginatedResponseDto,
  PaginationMeta,
  PaginationMetaQuery,
} from "../dto/success-response.dto";

/**
 * Helper function to create a standard success response
 */
export function successResponse<T>(
  data: T,
  message = "Success",
  statusCode = 200,
): SuccessResponseDto<T> {
  return new SuccessResponseDto(data, message, statusCode);
}

/**
 * Helper function to create a standard paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  query?: PaginationMetaQuery,
  message = "Success",
  statusCode = 200,
): PaginatedResponseDto<T> {
  const meta = new PaginationMeta(query);
  return new PaginatedResponseDto(data, meta, message, statusCode);
}

/**
 * Helper type for pagination query parameters
 */
export interface PaginationQuery {
  offset?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  total?: number;
}
